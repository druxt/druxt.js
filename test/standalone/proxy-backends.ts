import { createServer } from 'node:http'
import type { IncomingHttpHeaders, IncomingMessage, Server } from 'node:http'
import type { AddressInfo } from 'node:net'

// The fake Drupal backends the proxy tests build against and serve against.

/** A request a fake backend received. */
export interface Received {
  method: string
  url: string
  headers: IncomingHttpHeaders
  body: string
}

/** What a fake backend answers. */
export interface Answer {
  status?: number
  headers?: Record<string, string | string[]>
  body?: unknown
}

/**
 * A fake Drupal on a free port, which records each request and answers with `respond`, or 404. On `host`, a name
 * other than the site's, so a cookie domain or a location on it can be told apart from the site's.
 */
export const backend = async (respond: (request: Received, origin: string) => Answer | undefined, host = '127.0.0.1') => {
  const received: Received[] = []
  const read = (request: IncomingMessage) => new Promise<string>((done) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => done(Buffer.concat(chunks).toString('utf8')))
  })
  const server: Server = createServer(async (request, response) => {
    const entry = { method: request.method!, url: request.url!, headers: request.headers, body: await read(request) }
    received.push(entry)
    const answer = respond(entry, origin) || { status: 404, body: { errors: [{ status: '404' }] } }
    response.writeHead(answer.status || 200, { 'content-type': 'application/vnd.api+json', ...answer.headers })
    response.end(typeof answer.body === 'string' || Buffer.isBuffer(answer.body) ? answer.body : JSON.stringify(answer.body ?? {}))
  })
  // Every address, so `localhost` reaches it over either IPv4 or IPv6.
  await new Promise<void>((done) => server.listen(0, done))
  const origin = `http://${host}:${(server.address() as AddressInfo).port}`
  return { origin, received, close: () => new Promise<void>((done) => server.close(() => done())) }
}


// The build's Drupal: `en` is the default language, served under the configured prefix `english`, and `es` under its
// langcode. `fr` has a prefix of its own, which no answer shows.
export const buildBackend = () => backend(({ method, url }, origin) => {
  if (method !== 'GET') return undefined
  const path = url.split('?')[0]
  const type = 'configurable_language--configurable_language'
  if (path === '/jsonapi') {
    return {
      headers: { 'content-language': 'en' },
      body: { links: { self: { href: `${origin}/english/jsonapi` }, [type]: { href: `${origin}/english/jsonapi/configurable_language/configurable_language` } } },
    }
  }
  if (path === '/english/jsonapi/configurable_language/configurable_language') {
    const data = ['en', 'es', 'fr', 'und'].map((langcode) => ({ type, id: langcode, attributes: { drupal_internal__id: langcode } }))
    return { body: { data, links: {} } }
  }
  if (path === '/es/jsonapi') return { headers: { 'content-language': 'es' }, body: { links: { self: { href: `${origin}/es/jsonapi` } } } }
  return undefined
})
