import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { installPackages } from './installed'

/**
 * The site's Drupal: a stand-in that answers the password grant and a refresh with fixed test tokens, the signed-in
 * user's userinfo, and an empty JSON:API index. Anything else is a 404. `tokens()` counts the token requests it has had.
 */
const stand = async () => {
  let tokens = 0
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = []
    for await (const chunk of request) chunks.push(chunk as Buffer)
    const send = (status: number, body: unknown) => {
      response.writeHead(status, { 'content-type': 'application/json' })
      response.end(JSON.stringify(body))
    }
    const path = request.url!.split('?')[0]
    if (request.method === 'POST' && path === '/oauth/token') {
      tokens++
      const grant = new URLSearchParams(Buffer.concat(chunks).toString('utf8')).get('grant_type')
      return send(200, { token_type: 'Bearer', access_token: `${grant}-access-test`, refresh_token: `${grant}-refresh-test`, expires_in: 300 })
    }
    if (path === '/oauth/userinfo') return send(/^Bearer \S+-access-test$/.test(String(request.headers.authorization)) ? 200 : 401, { sub: '1', name: 'Editor' })
    if (path === '/jsonapi') return send(200, { data: [], links: { self: { href: '/jsonapi' } } })
    return send(404, { errors: [{ status: '404' }] })
  })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  return { origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, tokens: () => tokens, close: () => new Promise<void>((done) => server.close(() => done())) }
}

/** Whether a `Set-Cookie` header clears its cookie. */
const clears = (cookie?: string) => /max-age=0|expires=thu, 01 jan 1970/i.test(cookie || '')

/** A browser's cookies for the site: each response's `Set-Cookie` headers applied in the order the responses arrive. */
const jar = () => {
  const cookies = new Map<string, string>()
  return {
    take(response: Response) {
      for (const cookie of response.headers.getSetCookie()) {
        const name = cookie.slice(0, cookie.indexOf('='))
        if (clears(cookie)) cookies.delete(name)
        else cookies.set(name, cookie.split(';')[0]!)
      }
      return response
    },
    has: (name: string) => cookies.has(name),
    get header() {
      return [...cookies.values()].join('; ')
    },
  }
}

describe('@druxt/core, the sign-in form for a browser whose session the site\'s server holds', async () => {
  const drupal = await stand()
  process.env.DRUXT_AUTH_BROWSER_BACKEND = drupal.origin
  afterAll(() => drupal.close())
  installPackages('auth-browser', ['client', 'core'])

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/auth-browser', import.meta.url)),
    build: true,
    server: true,
    setupTimeout: 300_000,
  })

  const post = (path: string, cookies: string, body?: Record<string, string>) => fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookies ? { cookie: cookies } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const signIn = (cookies = '') => post('/api/_druxt/auth/token', cookies, { grant_type: 'password', username: 'editor', password: 'unused' })
  const render = async (cookies: string, path = '/') => (await fetch(path, { headers: { accept: 'text/html', ...(cookies ? { cookie: cookies } : {}) }, redirect: 'manual' }))

  it('renders who is signed in and the sign-out button on the server, and no field, for a signed-in browser', async () => {
    const browser = jar()
    expect(browser.take(await signIn()).status).toBe(200)
    const html = await (await render(browser.header)).text()
    const main = html.match(/<main>[\s\S]*?<\/main>/)?.[0] || ''
    expect(main).toContain('<p id="signed-in">true</p>')
    expect(main).toContain('druxt-auth-login--signed-in')
    expect(main).toContain('Signed in as Editor.')
    expect(main).toMatch(/<button type="button" class="druxt-auth-login__sign-out"[^>]*>Sign out<\/button>/)
    expect(main).not.toContain('<input')
    expect(main).not.toContain('<form')
  })

  it('renders the form on the server for a signed-out browser', async () => {
    const main = (await (await render('')).text()).match(/<main>[\s\S]*?<\/main>/)?.[0] || ''
    expect(main).toContain('<p id="signed-in">false</p>')
    expect(main).toContain('name="name"')
    expect(main).not.toContain('druxt-auth-login__sign-out')
  })

  it('sends a signed-in visitor from the login page on to where they were going, from the server', async () => {
    const browser = jar()
    browser.take(await signIn())
    const response = await render(browser.header, '/user/login?redirect=/account')
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/account')
    const away = await render(browser.header, '/user/login?redirect=//elsewhere.example')
    expect(away.headers.get('location')).toBe('/')
    expect((await render('', '/user/login?redirect=/account')).status).toBe(200)
  })

  it('refuses a site\'s own loginWithPassword() for a signed-in browser, by the auto-imported error name, and asks Drupal nothing', async () => {
    const browser = jar()
    browser.take(await signIn())
    const before = drupal.tokens()
    const response = await render(browser.header, '/switch')
    browser.take(response)
    const main = (await response.text()).match(/<main>[\s\S]*?<\/main>/)?.[0] || ''
    expect(main).toContain('<p id="outcome">refused</p>')
    expect(main).toContain('<p id="signed-in">true</p>')
    expect(main).toContain('<p id="user">Editor</p>')
    expect(drupal.tokens()).toBe(before)
    expect(browser.has('druxt.auth.access_token')).toBe(true)
  })

  it('signs in again after a sign-out', async () => {
    const browser = jar()
    browser.take(await signIn())
    browser.take(await post('/api/_druxt/auth/logout', browser.header))
    expect(browser.take(await signIn(browser.header)).status).toBe(200)
    const main = (await (await render(browser.header)).text()).match(/<main>[\s\S]*?<\/main>/)?.[0] || ''
    expect(main).toContain('Signed in as Editor.')
  })
})
