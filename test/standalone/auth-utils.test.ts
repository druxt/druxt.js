import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { backend } from './proxy-backends'

// A site that runs nuxt-auth-utils beside Druxt, with Drupal's JSON:API at /api and the proxy on, so Druxt's routes,
// the site's own and nuxt-auth-utils' sit inside the namespace the proxy takes for Drupal. The example backends serve
// JSON:API at /jsonapi, so the site's Drupal is a stand-in that records what reaches it.

/** A token of `length` characters, as a JWT's are: base64url segments joined by dots. */
const token = (length: number, seed: string) => `eyJ${seed}.${'a'.repeat(Math.max(0, length - seed.length - 8))}.sig`.slice(0, length)
// A large but real pair: an RS256 access token with many scopes and claims, and Simple OAuth's encrypted refresh token.
const ACCESS = token(2900, 'access')
const REFRESH = token(1100, 'refresh')
// A token past what one cookie can hold.
const OVERSIZED = token(5000, 'oversized')

const drupal = await backend(({ method, url, body }) => {
  const path = url.split('?')[0]
  // No language module: the build reads one index and nothing more.
  if (method === 'GET' && path === '/api') return { body: { links: { self: { href: '/api' } } } }
  if (method === 'POST' && path === '/oauth/token') {
    const oversized = new URLSearchParams(body).get('username') === 'oversized'
    return { headers: { 'content-type': 'application/json' }, body: { token_type: 'Bearer', access_token: oversized ? OVERSIZED : ACCESS, refresh_token: REFRESH, expires_in: 300 } }
  }
  if (method === 'GET' && path === '/api/node/article') return { body: { data: [], links: {}, from: 'drupal' } }
  return undefined
})
process.env.DRUXT_AUTH_UTILS_BACKEND = drupal.origin

/** The `Set-Cookie` headers of a response, by cookie name. */
const setCookies = (response: Response): Record<string, string> =>
  Object.fromEntries(response.headers.getSetCookie().map((cookie) => [cookie.slice(0, cookie.indexOf('=')), cookie]))
/** Whether a `Set-Cookie` header clears its cookie. */
const clears = (cookie?: string) => /max-age=0|expires=thu, 01 jan 1970/i.test(cookie || '')
/** The `Cookie` header a browser would send back: each cookie's name and value. */
const cookieHeader = (...sets: Record<string, string>[]): string =>
  sets.flatMap((cookies) => Object.values(cookies)).filter((cookie) => !clears(cookie)).map((cookie) => cookie.split(';')[0]).join('; ')
/** The paths the stand-in Drupal received since `from`. */
const reached = (from = 0) => drupal.received.slice(from).map((request) => request.url.split('?')[0]!)

// What the build logged, from before the fixture is loaded until it is built: the streams, which consola writes to, and
// the console, which the auto-import scanner warns on and which vitest reads apart from the streams.
const logged: string[] = []
const writes = { stdout: process.stdout.write, stderr: process.stderr.write }
const consoleMethods = ['log', 'info', 'warn', 'error'] as const
const consoles = Object.fromEntries(consoleMethods.map((method) => [method, console[method]])) as Record<typeof consoleMethods[number], (...args: unknown[]) => void>
const capture = () => {
  for (const [stream, write] of [[process.stdout, writes.stdout], [process.stderr, writes.stderr]] as const) {
    stream.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
      logged.push(String(chunk))
      return (write as (...args: unknown[]) => boolean).call(stream, chunk, ...rest)
    }) as typeof process.stdout.write
  }
  for (const method of consoleMethods) {
    console[method] = (...args: unknown[]) => {
      logged.push(args.map(String).join(' '))
      consoles[method].apply(console, args)
    }
  }
}
const release = () => {
  process.stdout.write = writes.stdout
  process.stderr.write = writes.stderr
  for (const method of consoleMethods) console[method] = consoles[method]
}

afterAll(async () => {
  release()
  await drupal.close()
})

describe('@druxt/core beside nuxt-auth-utils, with Drupal\'s JSON:API at /api', async () => {
  beforeAll(capture)

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/auth-utils', import.meta.url)),
    build: true,
    server: true,
    setupTimeout: 300_000,
    // A fixed test value, 32 characters or more, as nuxt-auth-utils requires.
    env: { NUXT_SESSION_PASSWORD: 'druxt-auth-utils-fixture-password-0123456789' },
  })

  beforeAll(release)

  const signIn = (username = 'editor') => fetch('/api/_druxt/auth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ grant_type: 'password', username, password: 'unused' }),
  })
  const utilsSignIn = () => fetch('/api/utils-login', { method: 'POST' })

  it('(a) answers Druxt\'s /api/_druxt routes itself, and Drupal never sees them', async () => {
    const from = drupal.received.length
    const signedIn = await signIn()
    expect(signedIn.status).toBe(200)
    expect(await signedIn.json()).toEqual({ token_type: 'Bearer', expires_in: 300 })
    expect(setCookies(signedIn)['druxt.auth.access_token']).toMatch(/; HttpOnly/i)
    expect((await fetch('/api/_druxt/cache/clear', { method: 'POST', headers: { 'X-Druxt-Secret': 'auth-utils-secret' } })).status).toBe(204)
    expect((await fetch('/api/_druxt/cache/clear', { method: 'POST', headers: { 'X-Druxt-Secret': 'wrong' } })).status).toBe(401)
    expect((await fetch('/api/_druxt/auth/logout', { method: 'POST', headers: { cookie: cookieHeader(setCookies(signedIn)) } })).status).toBe(204)
    // A method a route does not take is still not Drupal's.
    expect((await fetch('/api/_druxt/auth/token')).status).not.toBe(200)
    // The token route's own request to Drupal is the one Drupal sees.
    expect(reached(from)).toEqual(['/oauth/token'])
  })

  it('(b) answers the site\'s own /api/hello, and Drupal never sees it', async () => {
    const from = drupal.received.length
    const response = await fetch('/api/hello')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ hello: 'site' })
    expect(reached(from)).toEqual([])
  })

  // h3 matches a route by its method too, so a method the site's route does not take reaches the proxy at /api/**.
  it('(b) proxies a GET to the site\'s POST-only /api/utils-login to Drupal, as no route takes it', async () => {
    const from = drupal.received.length
    const response = await fetch('/api/utils-login')
    expect(response.status).toBe(404)
    expect(response.headers.getSetCookie()).toEqual([])
    expect(reached(from)).toEqual(['/api/utils-login'])
  })

  it('(c) answers nuxt-auth-utils\' /api/_auth/session from the module, and Drupal never sees it', async () => {
    const from = drupal.received.length
    const anonymous = await fetch('/api/_auth/session')
    expect(anonymous.status).toBe(200)
    expect(await anonymous.json()).not.toHaveProperty('user')
    const cookies = setCookies(await utilsSignIn())
    expect(cookies['nuxt-session']).toBeDefined()
    const session = await fetch('/api/_auth/session', { headers: { cookie: cookieHeader(cookies) } })
    expect(await session.json()).toMatchObject({ user: { name: 'utils' } })
    expect(reached(from)).toEqual([])
  })

  it('(d) proxies a path no route claims, /api/node/article, to Drupal', async () => {
    const from = drupal.received.length
    const response = await fetch('/api/node/article')
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ from: 'drupal' })
    expect(reached(from)).toEqual(['/api/node/article'])
  })

  describe('(e) with a Druxt session and a nuxt-auth-utils session both set', () => {
    /** What Drupal receives for a proxied read sent with both sessions' cookies and Drupal's own session cookie. */
    const forwarded = async () => {
      const druxt = setCookies(await signIn())
      const utils = setCookies(await utilsSignIn())
      const from = drupal.received.length
      const response = await fetch('/api/node/article', { headers: { cookie: `${cookieHeader(druxt, utils)}; SSESS0123456789abcdef0123456789abcdef=drupal` } })
      expect(response.status).toBe(200)
      const [request] = drupal.received.slice(from)
      return { request: request!, token: decodeURIComponent(druxt['druxt.auth.access_token']!.split(';')[0]!.split('=')[1]!), cookie: String(request!.headers.cookie || '') }
    }

    it('sends Drupal Druxt\'s Authorization, and none of Druxt\'s cookies', async () => {
      const { request, token, cookie } = await forwarded()
      expect(request.headers.authorization).toBe(`Bearer ${token}`)
      expect(cookie).not.toContain('druxt.auth.')
      // Drupal's own session cookie is Drupal's, for a site that signs in with cookies.
      expect(cookie).toContain('SSESS0123456789abcdef0123456789abcdef=drupal')
    })

    it('sends Drupal its own session cookie alone, never nuxt-session', async () => {
      const { cookie } = await forwarded()
      expect(cookie).not.toContain('nuxt-session=')
      expect(cookie).toBe('SSESS0123456789abcdef0123456789abcdef=drupal')
    })

    it('sends Drupal no Cookie header when none of the cookies is Drupal\'s', async () => {
      const utils = setCookies(await utilsSignIn())
      const from = drupal.received.length
      await fetch('/api/node/article', { headers: { cookie: `${cookieHeader(utils)}; theme=dark` } })
      expect(drupal.received.slice(from)[0]!.headers).not.toHaveProperty('cookie')
    })
  })

  it('(f) signs out of each without touching the other\'s cookies', async () => {
    const druxt = setCookies(await signIn())
    const utils = setCookies(await utilsSignIn())
    const both = cookieHeader(druxt, utils)

    const druxtOut = setCookies(await fetch('/api/_druxt/auth/logout', { method: 'POST', headers: { cookie: both } }))
    for (const name of ['druxt.auth.access_token', 'druxt.auth.refresh_token', 'druxt.auth.session']) expect(clears(druxtOut[name]), name).toBe(true)
    expect(Object.keys(druxtOut).filter((name) => !name.startsWith('druxt.auth.'))).toEqual([])
    // nuxt-auth-utils' session still stands.
    expect(await (await fetch('/api/_auth/session', { headers: { cookie: cookieHeader(utils) } })).json()).toMatchObject({ user: { name: 'utils' } })

    const utilsOut = await fetch('/api/_auth/session', { method: 'DELETE', headers: { cookie: both } })
    expect(utilsOut.status).toBe(200)
    const cleared = setCookies(utilsOut)
    expect(Object.keys(cleared).filter((name) => name.startsWith('druxt.auth.'))).toEqual([])
    // Druxt's session still stands: the proxy still sends its token.
    const from = drupal.received.length
    await fetch('/api/node/article', { headers: { cookie: cookieHeader(druxt) } })
    expect(drupal.received.slice(from)[0]!.headers.authorization).toBe(`Bearer ${ACCESS}`)
  })

  it('(g) builds with no duplicated auto-import between the two modules', () => {
    const log = logged.join('')
    // The capture spans the build, from loading the fixture to compiling its server.
    expect(log).toContain('[auth-utils fixture] build starts')
    expect(log).toContain('[auth-utils fixture] server compiled')
    expect(log).not.toMatch(/Duplicated imports/)
    for (const name of ['useUserSession', 'getUserSession', 'setUserSession', 'clearUserSession', 'requireUserSession', 'useDruxtAuth']) {
      expect(log, name).not.toContain(`"${name}"`)
    }
  })

  describe('(h) the Set-Cookie headers of a Druxt sign-in', () => {
    it('stay within 4096 bytes a cookie for a large access and refresh token pair', async () => {
      const cookies = (await signIn()).headers.getSetCookie()
      const sizes = Object.fromEntries(cookies.map((cookie) => [cookie.slice(0, cookie.indexOf('=')), Buffer.byteLength(cookie)]))
      expect(Math.max(...Object.values(sizes))).toBeLessThanOrEqual(4096)
      expect(sizes['druxt.auth.access_token']).toBeGreaterThan(ACCESS.length)
    })

    // A cookie past 4096 bytes is one a browser drops, so the sign-in would answer 200 and leave the visitor anonymous.
    it('refuses an access token too large for one cookie with a 502 and DRUXT_E01007, and keeps no session', async () => {
      const response = await signIn('oversized')
      expect(response.status).toBe(502)
      const { error, message } = await response.json() as { error: string, message: string }
      expect(error).toBe('server_error')
      expect(message).toMatch(/^DRUXT_E01007: Drupal's access token makes the druxt\.auth\.access_token cookie \d+ bytes, past the 4096/)
      expect(message).not.toContain(OVERSIZED.slice(0, 40))
      // The session the browser had ends with the sign-in, and none of the refused one's cookies is set.
      const set = response.headers.getSetCookie().filter((cookie) => cookie.startsWith('druxt.auth.'))
      expect(set.map((cookie) => cookie.split(';')[0])).toEqual(['access_token', 'refresh_token', 'client_id', 'expires_at', 'session'].map((name) => `druxt.auth.${name}=`))
      for (const cookie of set) expect(cookie).toContain('Max-Age=0')
    })
  })
})
