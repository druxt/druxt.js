import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createError, defineEventHandler, getRequestHeader, getRequestIP, readBody } from 'h3'
import { DruxtTemplateError, renderTemplate, templatePath, validateTemplateRequest } from '../runtime/utils/template'

/**
 * Gets an `Origin` header's host. It is undefined for a header that does not parse, such as a sandboxed frame's `null`.
 */
const originHost = (origin: string): string | undefined => {
  try {
    return new URL(origin).host
  } catch {
    return undefined
  }
}

/**
 * Whether a connection's address is this machine's own: IPv4 loopback, IPv6 loopback, or IPv4 loopback mapped to IPv6.
 */
const isLoopback = (address: string | undefined): boolean =>
  !!address && (address === '::1' || /^(?:::ffff:)?127(?:\.\d{1,3}){3}$/i.test(address))

/**
 * Makes the development template tool's route.
 *
 * The route writes the wrapper component a checked request describes, under `componentsDir`, and answers with its path.
 *
 * It answers a `POST` from this machine only:
 *
 * - The connection must come from a loopback address. The `Host` header is the client's to set, so it is not enough.
 * - The `Host` must be loopback, which a tunnel's public host is not.
 * - An `Origin`, when sent, must name the same host. One that does not parse, such as `null`, counts as another origin.
 *
 * @param componentsDir - The site's components directory.
 * @returns The event handler. It answers 405 for another method, 403 for another machine or origin, 400 for a request
 * that fails the check, and 409 when the file exists already.
 */
export const templateRoute = (componentsDir: string) => defineEventHandler(async (event) => {
  if (event.method !== 'POST') throw createError({ statusCode: 405 })
  const host = (getRequestHeader(event, 'host') || '').replace(/:\d+$/, '')
  if (!isLoopback(getRequestIP(event)) || !['localhost', '127.0.0.1', '[::1]'].includes(host)) throw createError({ statusCode: 403, statusMessage: 'The template tool answers this machine only.' })
  const origin = getRequestHeader(event, 'origin')
  if (origin && originHost(origin) !== getRequestHeader(event, 'host')) throw createError({ statusCode: 403, statusMessage: 'Cross-origin request.' })

  let request
  try {
    request = validateTemplateRequest(await readBody(event))
  } catch (error) {
    if (error instanceof DruxtTemplateError) throw createError({ statusCode: 400, statusMessage: error.message })
    throw error
  }
  const file = join(componentsDir, templatePath(request))
  if (existsSync(file)) throw createError({ statusCode: 409, statusMessage: `${file} exists already.` })
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, renderTemplate(request), { flag: 'wx' })
  return { file }
})
