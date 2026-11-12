import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { IncomingHttpHeaders } from 'node:http'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { hasDrush } from './drush'
import { testEditor } from './editor'
import { installPackages } from './installed'

const BASE_URL = process.env.DRUXT_BASE_URL || 'http://127.0.0.1:8888'
const CLIENT_ID = 'druxt-session-test'
const RUN = randomUUID()
const TITLE = `Druxt session test ${RUN}`

// The editor, and an unpublished page only an editor may read.
const editor = testEditor({ client: CLIENT_ID, scope: 'druxt_session_test', editor: 'druxt-session-editor', title: TITLE, published: false })

/** A request the front to Drupal received: its method, path and headers. */
interface Received { method: string, url: string, headers: IncomingHttpHeaders }

/**
 * The site's Drupal: the example backend behind a front that answers the password grant, which the backend lacks a
 * module for, with the test editor's real token, and a refresh with a fresh one, rotating the refresh token. Every
 * other request goes on to the backend as it came, and is recorded.
 */
const front = async () => {
  const received: Received[] = []
  let refresh = 0
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = []
    for await (const chunk of request) chunks.push(chunk as Buffer)
    const body = Buffer.concat(chunks)
    received.push({ method: request.method!, url: request.url!, headers: request.headers })
    if (request.url === '/oauth/token') {
      const form = new URLSearchParams(body.toString('utf8'))
      const grant = form.get('grant_type')
      const valid = grant === 'password' || (grant === 'refresh_token' && form.get('refresh_token') === `refresh-${refresh}`)
      response.writeHead(valid ? 200 : 400, { 'content-type': 'application/json' })
      response.end(JSON.stringify(valid ? { token_type: 'Bearer', access_token: await editor.signIn(), refresh_token: `refresh-${++refresh}`, expires_in: 300 } : { error: 'invalid_grant' }))
      return
    }
    const headers = Object.fromEntries(Object.entries(request.headers).filter(([name]) => !['host', 'connection', 'content-length'].includes(name))) as Record<string, string>
    const answer = await globalThis.fetch(`${BASE_URL}${request.url}`, { method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method!) ? undefined : body, redirect: 'manual' })
    const out = Buffer.from(await answer.arrayBuffer())
    response.writeHead(answer.status, { 'content-type': answer.headers.get('content-type') || 'application/octet-stream' })
    response.end(out)
  })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  return { origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, received, close: () => new Promise<void>((done) => server.close(() => done())) }
}

/** The `Set-Cookie` headers of a response, by cookie name. */
const setCookies = (response: Response): Record<string, string> =>
  Object.fromEntries(response.headers.getSetCookie().map((cookie) => [cookie.slice(0, cookie.indexOf('=')), cookie]))
/** The `Cookie` header a browser would send back: each cookie's name and value. */
const cookieHeader = (cookies: Record<string, string>): string =>
  Object.values(cookies).filter((cookie) => !/max-age=0|expires=thu, 01 jan 1970/i.test(cookie)).map((cookie) => cookie.split(';')[0]).join('; ')
const valueOf = (cookie?: string) => decodeURIComponent((cookie || '').split(';')[0]!.split('=').slice(1).join('='))

describe.skipIf(!hasDrush)('@druxt/core, a browser session the site\'s server holds', async () => {
  const drupal = await front()
  process.env.DRUXT_SESSION_BACKEND = drupal.origin
  let created: { uuid: string, token: string }
  afterAll(async () => {
    editor.tearDown()
    expect(editor.left()).toEqual({ users: 0, consumers: 0, scopes: 0 })
    await drupal.close()
  })
  installPackages('auth-session', ['client', 'core'])
  beforeAll(async () => {
    created = await editor.prepare()
  })

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/auth-session', import.meta.url)),
    build: true,
    server: true,
    setupTimeout: 300_000,
    // A front proxy that names the protocol, so an https request reads as one.
    env: { NUXT_DRUXT_PROXY_TRUST_FORWARDED: 'true' },
  })

  const signIn = async (headers: Record<string, string> = {}) => fetch('/api/_druxt/auth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ grant_type: 'password', username: 'druxt-session-editor', password: 'unused' }),
  })

  it('sets the tokens as httpOnly cookies on the site, and gives the browser no token', async () => {
    const response = await signIn()
    expect(response.status).toBe(200)
    const body = await response.json() as Record<string, unknown>
    expect(body).toEqual({ token_type: 'Bearer', expires_in: 300 })
    const cookies = setCookies(response)
    for (const name of ['druxt.auth.access_token', 'druxt.auth.refresh_token', 'druxt.auth.client_id', 'druxt.auth.expires_at']) {
      expect(cookies[name]).toMatch(/; HttpOnly/i)
      expect(cookies[name]).toMatch(/; SameSite=Lax/i)
      expect(cookies[name]).toMatch(/; Path=\//i)
      // The site's own host, never the backend's, and not Secure over plain http.
      expect(cookies[name]).not.toMatch(/; Domain=/i)
      expect(cookies[name]).not.toMatch(/; Secure/i)
    }
    // What `document.cookie` shows: the marker alone, which holds the expiry and no token.
    const readable = Object.entries(cookies).filter(([, cookie]) => !/; HttpOnly/i.test(cookie))
    expect(readable.map(([name]) => name)).toEqual(['druxt.auth.session'])
    expect(Number(valueOf(cookies['druxt.auth.session']))).toBeGreaterThan(Date.now())
    expect(valueOf(cookies['druxt.auth.access_token']).length).toBeGreaterThan(20)
    expect(JSON.stringify(readable)).not.toContain(valueOf(cookies['druxt.auth.access_token']))
  })

  it('marks the cookies Secure over https', async () => {
    const cookies = setCookies(await signIn({ 'x-forwarded-proto': 'https' }))
    for (const name of ['druxt.auth.access_token', 'druxt.auth.session']) expect(cookies[name]).toMatch(/; Secure/i)
  })

  it('reads as the editor through the proxy, which turns the cookie into the Authorization header Drupal receives', async () => {
    const cookies = setCookies(await signIn())
    const token = valueOf(cookies['druxt.auth.access_token'])
    const anonymous = await fetch(`/jsonapi/node/page/${created.uuid}`)
    expect(anonymous.status).not.toBe(200)

    const before = drupal.received.length
    const read = await fetch(`/jsonapi/node/page/${created.uuid}`, { headers: { cookie: cookieHeader(cookies) } })
    expect(read.status).toBe(200)
    expect(((await read.json()) as { data: { attributes: { title: string } } }).data.attributes.title).toBe(TITLE)
    const forwarded = drupal.received.slice(before).find((request) => request.url.startsWith(`/jsonapi/node/page/${created.uuid}`))!
    // The browser sent no Authorization header: Drupal received one, and none of the session's cookies.
    expect(forwarded.headers.authorization).toBe(`Bearer ${token}`)
    expect(String(forwarded.headers.cookie || '')).not.toContain('druxt.auth.')
  })

  it('renders the editor\'s page on the server from the session\'s cookies, with no token in the page or its chunks', async () => {
    const cookies = setCookies(await signIn())
    const token = valueOf(cookies['druxt.auth.access_token'])
    const html = await (await fetch(`/?uuid=${created.uuid}`, { headers: { cookie: cookieHeader(cookies), accept: 'text/html' } })).text()
    expect(html.match(/<main>[\s\S]*?<\/main>/)?.[0]).toBe(`<main><p id="signed-in">true</p><p id="title">${TITLE}</p></main>`)
    expect(html).not.toContain(token)
    expect(html).not.toContain('refresh-')
    const chunks = [...html.matchAll(/(?:src|href)="(\/_nuxt\/[^"]+\.js)"/g)].map((match) => match[1]!)
    expect(chunks.length).toBeGreaterThan(0)
    for (const chunk of chunks) expect(await (await fetch(chunk)).text()).not.toContain(token)
  })

  it('rotates the session on a refresh with the refresh token its cookie holds', async () => {
    const cookies = setCookies(await signIn())
    const response = await fetch('/api/_druxt/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: cookieHeader(cookies) },
      body: JSON.stringify({ grant_type: 'refresh_token' }),
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ token_type: 'Bearer', expires_in: 300 })
    const rotated = setCookies(response)
    expect(valueOf(rotated['druxt.auth.refresh_token'])).not.toBe(valueOf(cookies['druxt.auth.refresh_token']))
    expect(rotated['druxt.auth.access_token']).toMatch(/; HttpOnly/i)
  })

  it('clears the session on sign-out', async () => {
    const cookies = setCookies(await signIn())
    const response = await fetch('/api/_druxt/auth/logout', { method: 'POST', headers: { cookie: cookieHeader(cookies) } })
    expect(response.status).toBe(204)
    const cleared = setCookies(response)
    for (const name of ['druxt.auth.access_token', 'druxt.auth.refresh_token', 'druxt.auth.session']) expect(cleared[name]).toMatch(/max-age=0|expires=thu, 01 jan 1970/i)
  })
})
