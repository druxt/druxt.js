import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp, toWebHandler } from 'h3'
import { afterEach, describe, expect, it } from 'vitest'
import { templateRoute } from '../../packages/core/src/utils/template-route'

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

/** The route over a fresh components directory, as the dev server mounts it. */
const route = () => {
  const dir = mkdtempSync(join(tmpdir(), 'druxt-template-'))
  dirs.push(dir)
  const handler = toWebHandler(createApp().use('/api/_druxt/template', templateRoute(dir)))
  const send = (headers: Record<string, string>, body: unknown = { component: 'DruxtSite', name: 'DruxtSiteUmami' }, clientAddress: string | null = '127.0.0.1') =>
    handler(new Request('http://localhost:3000/api/_druxt/template', { method: 'POST', headers: { 'content-type': 'application/json', host: 'localhost:3000', ...headers }, body: JSON.stringify(body) }), { clientAddress: clientAddress ?? undefined })
  return { dir, send }
}

describe('the template route', () => {
  it('writes the wrapper for a request from this machine\'s own origin', async () => {
    const { dir, send } = route()
    const response = await send({ origin: 'http://localhost:3000' })
    expect(response.status).toBe(200)
    expect(readFileSync(join(dir, 'druxt/site/Umami.vue'), 'utf8')).toContain('<script setup lang="ts">')
  })

  it('refuses another origin with a 403', async () => {
    const { dir, send } = route()
    const response = await send({ origin: 'http://evil.test' })
    expect(response.status).toBe(403)
    expect(response.statusText).toBe('Cross-origin request.')
    expect(existsSync(join(dir, 'druxt'))).toBe(false)
  })

  // A sandboxed frame sends `Origin: null`; an origin that doesn't parse is another origin.
  it.each(['null', 'not a url', 'http://', '://localhost:3000'])('refuses the origin %j with a 403, not a 500', async (origin) => {
    const { dir, send } = route()
    const response = await send({ origin })
    expect(response.status).toBe(403)
    expect(response.statusText).toBe('Cross-origin request.')
    expect(existsSync(join(dir, 'druxt'))).toBe(false)
  })

  it('refuses a host that is not this machine with a 403', async () => {
    const { send } = route()
    expect((await send({ host: 'site.example' })).status).toBe(403)
  })

  // The `Host` header is the client's to set, so the connection's own address is checked too.
  it.each(['192.168.1.20', '10.0.0.5', '::ffff:192.168.1.20', '2001:db8::1', null])('refuses a connection from %s with a 403, whatever its Host says', async (address) => {
    const { dir, send } = route()
    const response = await send({}, undefined, address)
    expect(response.status).toBe(403)
    expect(response.statusText).toBe('The template tool answers this machine only.')
    expect(existsSync(join(dir, 'druxt'))).toBe(false)
  })

  it.each(['127.0.0.1', '127.0.0.2', '::1', '::ffff:127.0.0.1'])('answers a connection from the loopback address %s', async (address) => {
    const { send } = route()
    expect((await send({}, undefined, address)).status).toBe(200)
  })

  // The check's refusals are the request's fault: a 400, never a 500.
  it.each([
    ['a settings path through __proto__', { '__proto__.polluted': 1 }],
    ['a setting that is a value and a parent', { query: 1, 'query.fields': ['title'] }],
  ])('refuses %s with a 400 and writes nothing', async (_label, druxt) => {
    const { dir, send } = route()
    try {
      const response = await send({}, { component: 'DruxtSite', name: 'DruxtSiteUmami', template: { druxt } })
      expect(response.status).toBe(400)
      expect(existsSync(join(dir, 'druxt'))).toBe(false)
      expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    } finally {
      delete (Object.prototype as Record<string, unknown>).polluted
    }
  })
})
