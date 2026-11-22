import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  body: {} as Record<string, string>,
  status: 0,
  config: {} as Record<string, unknown>,
  // The cookies the request carried, encoded into its Cookie header, or the header as a browser wrote it, and what the
  // route set, by name: undefined for a cleared one.
  cookies: {} as Record<string, string>,
  cookieHeader: undefined as string | undefined,
  // The other headers the request carried, such as Host and Origin.
  headers: {} as Record<string, string>,
  set: {} as Record<string, { value?: string, options: Record<string, unknown> }>,
  protocol: 'http',
  // What the routes logged.
  logged: [] as string[],
}))

vi.mock('#imports', () => ({ useRuntimeConfig: () => state.config }))
vi.mock('consola', () => {
  const logger = { error: (message: string) => { state.logged.push(message) }, warn: (message: string) => { state.logged.push(message) } }
  return { consola: { withTag: () => logger } }
})
vi.mock('h3', async (original) => ({
  ...await original<typeof import('h3')>(),
  readBody: async () => state.body,
  setResponseStatus: (_event: unknown, status: number) => { state.status = status },
  setCookie: (_event: unknown, name: string, value: string, options: Record<string, unknown>) => { state.set[name] = { value, options } },
  deleteCookie: (_event: unknown, name: string, options: Record<string, unknown>) => { state.set[name] = { options } },
  getRequestProtocol: () => state.protocol,
}))

const publicConfig = { druxt: { baseUrl: 'https://drupal.test', auth: { clientId: 'site', passwordClientId: 'site-password' } } }
const credentials = { grant_type: 'password', username: 'editor', password: 'pw' }
const SESSION = ['druxt.auth.access_token', 'druxt.auth.refresh_token', 'druxt.auth.client_id', 'druxt.auth.expires_at', 'druxt.auth.session']

/** Asserts the route cleared every cookie of the session and set none: the browser is left signed out. */
const expectNoSession = () => {
  for (const name of SESSION) expect(state.set[name], name).toEqual({ options: expect.any(Object) })
}

/** Calls the route, with Drupal answering `answer`, and returns what it sent Drupal and what it answered. */
const request = async (answer: { status: number, body: Record<string, unknown> } = { status: 200, body: { access_token: 'token' } }) => {
  const sent: URLSearchParams[] = []
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: URLSearchParams }) => {
    sent.push(init.body)
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'Content-Type': 'application/json' } })
  }))
  const { default: handler } = await import('../../packages/core/src/runtime/server/routes/token')
  const cookie = state.cookieHeader ?? Object.entries(state.cookies).map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('; ')
  const event = { context: {}, node: { req: { headers: { ...state.headers, ...(cookie ? { cookie } : {}) } } } }
  const result = await (handler as unknown as (event: unknown) => Promise<unknown>)(event)
  return { sent: sent[0] ? Object.fromEntries(sent[0]) : undefined, result }
}

beforeEach(() => {
  // The route keeps the refresh tokens it has just redeemed, so each test takes the route afresh.
  vi.resetModules()
  state.body = { ...credentials }
  state.status = 0
  state.config = { public: publicConfig, druxt: { auth: { clientSecret: '' } } }
  state.cookies = {}
  state.cookieHeader = undefined
  state.headers = {}
  state.set = {}
  state.protocol = 'http'
  state.logged = []
  // A secret in the developer's own environment is not the fixture's.
  vi.stubEnv('DRUXT_AUTH_CLIENT_SECRET', '')
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('POST /api/_druxt/auth/token', () => {
  it('sends the secret the runtime config holds', async () => {
    state.config = { public: publicConfig, druxt: { auth: { clientSecret: 'runtime-secret' } } }
    const { sent, result } = await request()
    expect(sent).toEqual({ ...credentials, client_id: 'site-password', client_secret: 'runtime-secret' })
    expect(result).toEqual({ access_token: 'token' })
  })

  it('sends a secret from DRUXT_AUTH_CLIENT_SECRET at runtime', async () => {
    vi.stubEnv('DRUXT_AUTH_CLIENT_SECRET', 'env-secret')
    const { sent } = await request()
    expect(sent?.client_secret).toBe('env-secret')
  })

  it('sends no client_secret without a secret, as for a public Consumer, and lets Drupal decide', async () => {
    const { sent } = await request()
    expect(sent).toEqual({ ...credentials, client_id: 'site-password' })
    expect(sent).not.toHaveProperty('client_secret')
  })

  it('answers a refusal with Drupal\'s status, error and message, and nothing else', async () => {
    const { result } = await request({
      status: 401,
      body: { error: 'invalid_client', error_description: 'Client authentication failed', hint: 'Check https://drupal.test/admin', message: 'Client authentication failed' },
    })
    expect(state.status).toBe(401)
    expect(result).toEqual({ error: 'invalid_client', message: 'Client authentication failed' })
  })

  it('refuses a grant it does not make, and a password grant without credentials, with a 400', async () => {
    state.body = { grant_type: 'client_credentials' }
    await expect(request()).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Unsupported grant type' })
    state.body = { grant_type: 'password', username: 'editor' }
    await expect(request()).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Invalid username or password' })
  })
})

// Behind the site's proxy the tokens leave JavaScript: the route keeps them in httpOnly cookies on the site.
describe('POST /api/_druxt/auth/token, holding the session', () => {
  const sessionConfig = (siteUrl = '') => ({
    app: { baseURL: '/' },
    public: { druxt: { ...publicConfig.druxt, siteUrl, auth: { ...publicConfig.druxt.auth, session: true } } },
    druxt: { auth: { clientSecret: '' } },
  })
  const tokens = { status: 200, body: { token_type: 'Bearer', access_token: 'access-secret', refresh_token: 'refresh-secret', expires_in: 300 } }

  beforeEach(() => {
    state.config = sessionConfig()
  })

  it('sets the tokens as httpOnly cookies on the site, and answers no token', async () => {
    const { result } = await request(tokens)
    expect(result).toEqual({ token_type: 'Bearer', expires_in: 300 })
    expect(JSON.stringify(result)).not.toContain('secret')
    for (const name of ['druxt.auth.access_token', 'druxt.auth.refresh_token', 'druxt.auth.client_id', 'druxt.auth.expires_at']) {
      expect(state.set[name]?.options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', secure: false })
      // Host-only: the site's own host, never the backend's.
      expect(state.set[name]?.options).not.toHaveProperty('domain')
    }
    expect(state.set['druxt.auth.access_token']?.value).toBe('access-secret')
    expect(state.set['druxt.auth.refresh_token']?.value).toBe('refresh-secret')
    expect(state.set['druxt.auth.client_id']?.value).toBe('site-password')
    // The marker the browser reads holds the expiry, never a token.
    expect(state.set['druxt.auth.session']?.options).toMatchObject({ httpOnly: false })
    expect(Number(state.set['druxt.auth.session']?.value)).toBeGreaterThan(Date.now())
  })

  it('marks the cookies Secure on an https site, over https, and not over plain http', async () => {
    await request(tokens)
    expect(state.set['druxt.auth.access_token']?.options.secure).toBe(false)
    state.protocol = 'https'
    await request(tokens)
    expect(state.set['druxt.auth.access_token']?.options.secure).toBe(true)
    state.protocol = 'http'
    state.config = sessionConfig('https://www.site.test')
    await request(tokens)
    expect(state.set['druxt.auth.access_token']?.options.secure).toBe(true)
    expect(state.set['druxt.auth.session']?.options.secure).toBe(true)
  })

  it('refreshes with the refresh token and the Consumer its cookies hold, rotating them', async () => {
    state.cookies = { 'druxt.auth.refresh_token': 'refresh-secret', 'druxt.auth.client_id': 'site' }
    state.body = { grant_type: 'refresh_token', refresh_token: 'from-the-browser', client_id: 'other' }
    const { sent } = await request({ status: 200, body: { access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 300 } })
    expect(sent).toEqual({ grant_type: 'refresh_token', refresh_token: 'refresh-secret', client_id: 'site' })
    expect(state.set['druxt.auth.access_token']?.value).toBe('access-2')
    expect(state.set['druxt.auth.refresh_token']?.value).toBe('refresh-2')
  })

  it('clears the session when Drupal refuses the refresh token', async () => {
    state.cookies = { 'druxt.auth.refresh_token': 'spent' }
    state.body = { grant_type: 'refresh_token' }
    await request({ status: 400, body: { error: 'invalid_grant' } })
    for (const name of ['druxt.auth.access_token', 'druxt.auth.refresh_token', 'druxt.auth.session']) expect(state.set[name]?.value).toBeUndefined()
    expect(Object.keys(state.set)).toContain('druxt.auth.session')
  })

  // Two tabs refresh one expired session, each with its own client. Drupal takes a refresh token once, so the second
  // request would be refused and would clear the cookies the first had just set.
  it('redeems a refresh token once for refreshes that overlap, and gives each the new session', async () => {
    state.config = { public: { druxt: { ...publicConfig.druxt, auth: { ...publicConfig.druxt.auth, session: true } } }, druxt: { auth: { clientSecret: '' } } }
    state.headers = { host: 'site.test' }
    state.cookies = { 'druxt.auth.refresh_token': 'shared-by-two-tabs', 'druxt.auth.client_id': 'site' }
    state.body = { grant_type: 'refresh_token' }
    let answer!: (response: Response) => void
    const drupal = vi.fn(() => new Promise<Response>((resolve) => { answer = resolve }))
    vi.stubGlobal('fetch', drupal)
    const { default: handler } = await import('../../packages/core/src/runtime/server/routes/token')
    const call = () => (handler as unknown as (event: unknown) => Promise<unknown>)({ context: {}, node: { req: { headers: { ...state.headers, cookie: Object.entries(state.cookies).map(([name, value]) => `${name}=${value}`).join('; ') } } } })
    const first = call()
    const second = call()
    await vi.waitFor(() => expect(drupal).toHaveBeenCalled())
    answer(new Response(JSON.stringify({ token_type: 'Bearer', access_token: 'next-access', refresh_token: 'next-refresh', expires_in: 300 }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    expect(await Promise.all([first, second])).toEqual([{ token_type: 'Bearer', expires_in: 300 }, { token_type: 'Bearer', expires_in: 300 }])
    expect(drupal).toHaveBeenCalledTimes(1)
    expect(state.set['druxt.auth.refresh_token']?.value).toBe('next-refresh')
    // A tab that asks a moment later with the token just spent gets the same session, not a refusal.
    state.set = {}
    expect(await call()).toEqual({ token_type: 'Bearer', expires_in: 300 })
    expect(drupal).toHaveBeenCalledTimes(1)
    expect(state.set['druxt.auth.access_token']?.value).toBe('next-access')
  })

  describe('with a refresh token being redeemed', () => {
    const refreshing = (token: string) => {
      state.config = { public: { druxt: { ...publicConfig.druxt, auth: { ...publicConfig.druxt.auth, session: true } } }, druxt: { auth: { clientSecret: '' } } }
      state.headers = { host: 'site.test' }
      state.body = { grant_type: 'refresh_token' }
      return () => ({ context: {}, node: { req: { headers: { host: 'site.test', cookie: `druxt.auth.refresh_token=${token}; druxt.auth.client_id=site` } } } })
    }
    const next = () => new Response(JSON.stringify({ token_type: 'Bearer', access_token: 'next-access', refresh_token: 'next-refresh', expires_in: 300 }), { status: 200, headers: { 'Content-Type': 'application/json' } })

    it('joins a refresh that Drupal has not answered yet, however long it takes, and keeps the answer ten seconds from then', async () => {
      const event = refreshing('slow-to-redeem')
      const clock = vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
      let answer!: (response: Response) => void
      const drupal = vi.fn(() => new Promise<Response>((resolve) => { answer = resolve }))
      vi.stubGlobal('fetch', drupal)
      const handler = (await import('../../packages/core/src/runtime/server/routes/token')).default as unknown as (event: unknown) => Promise<unknown>
      const first = handler(event())
      await vi.waitFor(() => expect(drupal).toHaveBeenCalledTimes(1))
      clock.mockReturnValue(1_011_000)
      const second = handler(event())
      await new Promise((resolve) => setTimeout(resolve, 5))
      expect(drupal).toHaveBeenCalledTimes(1)
      answer(next())
      expect(await Promise.all([first, second])).toEqual([{ token_type: 'Bearer', expires_in: 300 }, { token_type: 'Bearer', expires_in: 300 }])
      clock.mockReturnValue(1_020_000)
      expect(await handler(event())).toEqual({ token_type: 'Bearer', expires_in: 300 })
      expect(drupal).toHaveBeenCalledTimes(1)
      clock.mockReturnValue(1_022_000)
      void handler(event())
      await vi.waitFor(() => expect(drupal).toHaveBeenCalledTimes(2))
      answer(next())
      clock.mockRestore()
    })

    it('asks Drupal again after an answer that redeemed nothing, such as a 503', async () => {
      const event = refreshing('drupal-was-away')
      const drupal = vi.fn(async () => new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } }))
      vi.stubGlobal('fetch', drupal)
      const handler = (await import('../../packages/core/src/runtime/server/routes/token')).default as unknown as (event: unknown) => Promise<unknown>
      await handler(event())
      expect(state.status).toBe(503)
      expect(state.set).toEqual({})
      drupal.mockImplementation(async () => next())
      expect(await handler(event())).toEqual({ token_type: 'Bearer', expires_in: 300 })
      expect(drupal).toHaveBeenCalledTimes(2)
    })
  })

  // A list coerces to its one item as a string, and would pass for the grant while skipping every check on it.
  it.each([[['password']], [{ toString: 'password' }], [7]])('refuses a grant type that is not a string, %j, before any secret is attached', async (grant) => {
    state.config = { public: { druxt: { ...publicConfig.druxt, auth: { ...publicConfig.druxt.auth, password: false } } }, druxt: { auth: { clientSecret: 'runtime-secret' } } }
    state.body = { ...credentials, grant_type: grant as never }
    await expect(request()).rejects.toMatchObject({ statusCode: 400 })
    expect(fetch).not.toHaveBeenCalled()
  })

  // A redirect that keeps the method would send the secret, the password or the refresh token on to its target.
  it('follows no redirect from the token endpoint, and answers 502', async () => {
    const { result } = await request({ status: 307, body: {} })
    expect((vi.mocked(fetch).mock.calls[0]![1] as RequestInit).redirect).toBe('manual')
    expect(state.status).toBe(502)
    expect(result).toEqual({ error: 'server_error', message: expect.stringContaining('redirect') })
  })

  it('answers 502 for a session\'s sign-in that Drupal answered 200 without a token', async () => {
    state.config = { public: { druxt: { ...publicConfig.druxt, auth: { ...publicConfig.druxt.auth, session: true } } }, druxt: { auth: { clientSecret: '' } } }
    state.headers = { host: 'site.test' }
    const { result } = await request({ status: 200, body: {} })
    expect(state.status).toBe(502)
    expect(result).toEqual({ error: 'server_error', message: expect.stringContaining('no access token') })
    expect(state.set['druxt.auth.access_token']?.value).toBeUndefined()
  })

  it('asks Drupal again for a refresh token whose last request failed on the network', async () => {
    state.config = { public: { druxt: { ...publicConfig.druxt, auth: { ...publicConfig.druxt.auth, session: true } } }, druxt: { auth: { clientSecret: '' } } }
    state.headers = { host: 'site.test' }
    state.cookies = { 'druxt.auth.refresh_token': 'retried-after-a-failure', 'druxt.auth.client_id': 'site' }
    state.body = { grant_type: 'refresh_token' }
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed') }))
    const { default: handler } = await import('../../packages/core/src/runtime/server/routes/token')
    const event = () => ({ context: {}, node: { req: { headers: { ...state.headers, cookie: 'druxt.auth.refresh_token=retried-after-a-failure; druxt.auth.client_id=site' } } } })
    await expect((handler as unknown as (event: unknown) => Promise<unknown>)(event())).rejects.toThrow('fetch failed')
    expect(state.set).toEqual({})
    expect((await request({ status: 200, body: { token_type: 'Bearer', access_token: 'a', refresh_token: 'r', expires_in: 300 } })).result).toEqual({ token_type: 'Bearer', expires_in: 300 })
  })

  // As druxt-auth 0.x, whose password sign-in forgot the stored tokens before it asked Drupal: a visitor who tried to
  // sign in as someone else is never left signed in as the first user.
  const signedIn = { 'druxt.auth.access_token': 'first-access', 'druxt.auth.refresh_token': 'first-refresh', 'druxt.auth.client_id': 'site', 'druxt.auth.session': 'on' }
  const codeGrant = { grant_type: 'authorization_code', code: 'c', code_verifier: 'v', redirect_uri: 'https://site.test/callback' }

  it.each([
    { grant: 'password', body: credentials, status: 401 },
    { grant: 'password', body: credentials, status: 400 },
    { grant: 'password', body: credentials, status: 503 },
    { grant: 'authorization_code', body: codeGrant, status: 400 },
  ])('ends the session the browser had when Drupal answers the $grant grant with a $status', async ({ body, status }) => {
    state.cookies = { ...signedIn }
    state.body = { ...body }
    await request({ status, body: { error: 'invalid_grant', message: 'The user credentials were incorrect.' } })
    expect(state.status).toBe(status)
    expectNoSession()
  })

  it('replaces the session the browser had with the one a sign-in makes', async () => {
    state.cookies = { ...signedIn }
    await request(tokens)
    expect(state.set['druxt.auth.access_token']?.value).toBe('access-secret')
    expect(state.set['druxt.auth.refresh_token']?.value).toBe('refresh-secret')
    expect(state.set['druxt.auth.client_id']?.value).toBe('site-password')
  })

  // A bare percent sign, a truncated escape, and the escape of a lone surrogate: the browser writes its own header.
  it.each(['%', '%E0%A4%A', '%ED%A0%80'])('takes a refresh token cookie of %s for none, and asks Drupal nothing', async (value) => {
    state.cookieHeader = `druxt.auth.refresh_token=${value}; druxt.auth.client_id=site`
    state.body = { grant_type: 'refresh_token' }
    const fetch = vi.fn(async () => new Response('{}', { status: 400, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    const { default: handler } = await import('../../packages/core/src/runtime/server/routes/token')
    const event = { context: {}, node: { req: { headers: { cookie: state.cookieHeader } } } }
    await expect((handler as unknown as (event: unknown) => Promise<unknown>)(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('takes a Consumer cookie that does not decode for none, and refreshes for the confidential Consumer', async () => {
    state.cookieHeader = 'druxt.auth.refresh_token=refresh-secret; druxt.auth.client_id=%E0%A4%A'
    state.body = { grant_type: 'refresh_token' }
    const { sent } = await request({ status: 200, body: { access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 300 } })
    expect(sent).toEqual({ grant_type: 'refresh_token', refresh_token: 'refresh-secret', client_id: 'site-password' })
  })

  it('refuses a refresh with no session to refresh', async () => {
    state.body = { grant_type: 'refresh_token' }
    await expect(request()).rejects.toMatchObject({ statusCode: 401 })
  })

  it('finishes the authorization code grant for the browser\'s Consumer, holding its tokens', async () => {
    state.body = { grant_type: 'authorization_code', code: 'c', code_verifier: 'v', redirect_uri: 'https://site.test/callback', client_id: 'other' }
    const { sent, result } = await request(tokens)
    expect(sent).toEqual({ grant_type: 'authorization_code', code: 'c', code_verifier: 'v', redirect_uri: 'https://site.test/callback', client_id: 'site' })
    expect(result).toEqual({ token_type: 'Bearer', expires_in: 300 })
    expect(state.set['druxt.auth.client_id']?.value).toBe('site')
  })
})

// `auth.password: false` offers no password grant, though the route stays for the session's code grant and refresh.
// A response to a cross-site form post may set cookies, so the route that sets the session's checks who asks.
describe('POST /api/_druxt/auth/token, asked from another site', () => {
  const sessionConfig = (siteUrl = '', trustForwarded = false) => ({
    app: { baseURL: '/' },
    public: { druxt: { ...publicConfig.druxt, siteUrl, auth: { ...publicConfig.druxt.auth, session: true } } },
    druxt: { auth: { clientSecret: '' }, proxy: { trustForwarded } },
  })
  const tokens = { status: 200, body: { token_type: 'Bearer', access_token: 'access-secret', refresh_token: 'refresh-secret', expires_in: 300 } }

  /** Asserts the route answered 403, asked Drupal nothing, and neither set nor cleared a cookie. */
  const expectRefused = async () => {
    await expect(request(tokens)).rejects.toMatchObject({ statusCode: 403 })
    expect(fetch).not.toHaveBeenCalled()
    expect(state.set).toEqual({})
  }

  beforeEach(() => {
    state.config = sessionConfig()
    state.headers = { host: 'site.test' }
  })

  it('refuses a request whose Origin is another site, asking Drupal nothing and touching no cookie', async () => {
    state.cookies = { 'druxt.auth.access_token': 'visitor' }
    state.headers = { host: 'site.test', origin: 'https://evil.test' }
    await expectRefused()
  })

  it('refuses an opaque Origin, as a sandboxed frame sends', async () => {
    state.headers = { host: 'site.test', origin: 'null' }
    await expectRefused()
  })

  it('signs in a request from the site\'s own origin', async () => {
    state.headers = { host: 'site.test', origin: 'http://site.test' }
    const { result } = await request(tokens)
    expect(result).toEqual({ token_type: 'Bearer', expires_in: 300 })
    expect(state.set['druxt.auth.access_token']?.value).toBe('access-secret')
  })

  it('takes the site\'s host from siteUrl when the request names another, as behind a front proxy', async () => {
    state.config = sessionConfig('https://www.site.test')
    state.headers = { host: 'internal:3000', origin: 'https://www.site.test' }
    expect((await request(tokens)).result).toEqual({ token_type: 'Bearer', expires_in: 300 })
    state.set = {}
    state.headers = { host: 'internal:3000', origin: 'https://evil.test' }
    await expectRefused()
  })

  // The same host over plain http is another origin. A page there, which someone on the network can serve, is refused
  // when the site is known to be https: by `siteUrl`, or by the request's own protocol.
  it('refuses the site\'s host over http when the site is https', async () => {
    state.config = sessionConfig('https://www.site.test')
    state.headers = { host: 'internal:3000', origin: 'http://www.site.test' }
    await expectRefused()
    state.config = sessionConfig()
    state.protocol = 'https'
    state.headers = { host: 'site.test', origin: 'http://site.test' }
    await expectRefused()
    state.headers = { host: 'site.test', origin: 'https://site.test' }
    expect((await request(tokens)).result).toEqual({ token_type: 'Bearer', expires_in: 300 })
  })

  // TLS that ends at a front proxy the site was not told to trust: the request reads as http, so the scheme is unknown.
  it('passes the site\'s host over https when the request reads as http', async () => {
    state.headers = { host: 'site.test', origin: 'https://site.test' }
    expect((await request(tokens)).result).toEqual({ token_type: 'Bearer', expires_in: 300 })
  })

  // A front proxy may forward the host with its default port, which a browser's Origin never carries.
  it('reads a forwarded host with the scheme\'s default port as the host alone, and still refuses another port', async () => {
    state.config = sessionConfig('', true)
    state.protocol = 'https'
    state.headers = { 'host': 'internal:3000', 'x-forwarded-host': 'www.site.test:443', 'origin': 'https://www.site.test' }
    expect((await request(tokens)).result).toEqual({ token_type: 'Bearer', expires_in: 300 })
    state.set = {}
    state.headers = { 'host': 'internal:3000', 'x-forwarded-host': 'www.site.test:443', 'origin': 'https://www.site.test:8443' }
    await expectRefused()
  })

  it('takes the forwarded host only with proxy.trustForwarded', async () => {
    state.headers = { 'host': 'internal:3000', 'x-forwarded-host': 'www.site.test', 'origin': 'https://www.site.test' }
    await expectRefused()
    state.config = sessionConfig('', true)
    expect((await request(tokens)).result).toEqual({ token_type: 'Bearer', expires_in: 300 })
  })

  it('falls back to Sec-Fetch-Site when the request has no Origin', async () => {
    state.headers = { 'host': 'site.test', 'sec-fetch-site': 'cross-site' }
    await expectRefused()
    state.headers = { 'host': 'site.test', 'sec-fetch-site': 'same-site' }
    await expectRefused()
    for (const site of ['same-origin', 'none']) {
      state.set = {}
      state.headers = { 'host': 'site.test', 'sec-fetch-site': site }
      expect((await request(tokens)).result, site).toEqual({ token_type: 'Bearer', expires_in: 300 })
    }
  })

  it('signs in a request with neither header, as a script outside a browser sends', async () => {
    expect((await request(tokens)).result).toEqual({ token_type: 'Bearer', expires_in: 300 })
  })

  it('ignores the Origin when the browser holds the session, as the route sets no cookie', async () => {
    state.config = { public: publicConfig, druxt: { auth: { clientSecret: '' } } }
    state.headers = { host: 'site.test', origin: 'https://evil.test' }
    const { result } = await request()
    expect(result).toEqual({ access_token: 'token' })
    expect(state.set).toEqual({})
  })
})

describe('POST /api/_druxt/auth/token, by auth.password', () => {
  const grants = {
    password: credentials,
    refresh_token: { grant_type: 'refresh_token', refresh_token: 'from-the-browser' },
    authorization_code: { grant_type: 'authorization_code', code: 'c', code_verifier: 'v', redirect_uri: 'https://site.test/callback' },
  }
  const configWith = (password: boolean | undefined, session: boolean) => ({
    app: { baseURL: '/' },
    public: { druxt: { ...publicConfig.druxt, auth: { ...publicConfig.druxt.auth, ...(password === undefined ? {} : { password }), session } } },
    druxt: { auth: { clientSecret: 'runtime-secret' } },
  })
  const tokens = { status: 200, body: { token_type: 'Bearer', access_token: 'access-secret', refresh_token: 'refresh-secret', expires_in: 300 } }
  const cases = [true, false].flatMap((session) => [true, false, undefined].flatMap((password) =>
    (Object.keys(grants) as (keyof typeof grants)[]).map((grant) => ({ grant, password, session }))))

  it.each(cases)('the $grant grant, with password $password and session $session', async ({ grant, password, session }) => {
    state.config = configWith(password, session)
    state.body = { ...grants[grant] }
    if (session) state.cookies = { 'druxt.auth.refresh_token': 'refresh-held' }
    // Off with password: false, and the code grant only for a session the server holds, as before.
    const refused = (grant === 'password' && password === false) || (grant === 'authorization_code' && !session)
    const fetch = vi.fn(async () => new Response(JSON.stringify(tokens.body), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    const { default: handler } = await import('../../packages/core/src/runtime/server/routes/token')
    const cookie = Object.entries(state.cookies).map(([name, value]) => `${name}=${value}`).join('; ')
    const answer = (handler as unknown as (event: unknown) => Promise<unknown>)({ context: {}, node: { req: { headers: cookie ? { cookie } : {} } } })
    if (refused) {
      await expect(answer).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Unsupported grant type' })
      // Never sent, so no secret goes with it, and the browser's session is left as it was.
      expect(fetch).not.toHaveBeenCalled()
      expect(state.set).toEqual({})
    } else {
      await answer
      expect(fetch).toHaveBeenCalledTimes(1)
    }
  })
})

// A browser keeps at most 4096 bytes of one cookie, name, value and attributes, and drops a larger one unseen.
describe('POST /api/_druxt/auth/token, with a token too large for a cookie', () => {
  const sessionConfig = (baseURL = '/') => ({
    app: { baseURL },
    public: { druxt: { ...publicConfig.druxt, auth: { ...publicConfig.druxt.auth, session: true } } },
    druxt: { auth: { clientSecret: '' } },
  })
  /** The access token's Set-Cookie header, as h3 writes it for an http site under `path`. */
  const accessCookie = (token: string, path = '/') => `druxt.auth.access_token=${token}; Max-Age=2592000; Path=${path}; HttpOnly; SameSite=Lax`
  /** A token whose access cookie is `bytes` bytes under `path`. */
  const tokenOf = (bytes: number, path = '/') => 'a'.repeat(bytes - Buffer.byteLength(accessCookie('', path)))
  const answer = (access_token: string, refresh_token = 'refresh-secret') => ({ status: 200, body: { token_type: 'Bearer', access_token, refresh_token, expires_in: 300 } })

  beforeEach(() => {
    state.config = sessionConfig()
  })

  it('measures a cookie as h3 writes it, in bytes, an attribute\'s accented letter as two', async () => {
    const { cookieBytes } = await import('../../packages/core/src/runtime/server/utils/session')
    expect(cookieBytes('a', 'b', { path: '/' })).toBe(11)
    expect(cookieBytes('a', 'b', { path: '/é' })).toBe(13)
    expect(cookieBytes('druxt.auth.access_token', 'x', { path: '/café/', sameSite: 'lax', httpOnly: true, maxAge: 2592000 })).toBe(Buffer.byteLength(accessCookie('x', '/café/')))
  })

  it('sets an access cookie of 4096 bytes exactly, and refuses one of 4097', async () => {
    const fits = tokenOf(4096)
    await request(answer(fits))
    expect(state.status).toBe(200)
    expect(state.set['druxt.auth.access_token']?.value).toBe(fits)
    state.set = {}
    const { result } = await request(answer(tokenOf(4097)))
    expect(state.status).toBe(502)
    expectNoSession()
    expect((result as { message: string }).message).toContain('4097 bytes')
  })

  it('counts each byte of an accented letter in the cookie\'s path, from the app\'s baseURL', async () => {
    state.config = sessionConfig('/café/')
    // 4096 bytes is 4095 characters here.
    const fits = tokenOf(4096, '/café/')
    expect(accessCookie(fits, '/café/').length).toBe(4095)
    await request(answer(fits))
    expect(state.status).toBe(200)
    expect(state.set['druxt.auth.access_token']?.value).toBe(fits)
    state.set = {}
    await request(answer(`${fits}a`))
    expect(state.status).toBe(502)
    expectNoSession()
  })

  it('refuses the sign-in with a 502 and DRUXT_E01007, keeps no session, and names the token, its size and the fix, never its value', async () => {
    const token = `secret-${'s'.repeat(5000)}`
    const { result } = await request(answer(token))
    expect(state.status).toBe(502)
    expectNoSession()
    const { error, message } = result as { error: string, message: string }
    expect(error).toBe('server_error')
    expect(message).toMatch(/^DRUXT_E01007: /)
    expect(message).toContain('access token')
    expect(message).toContain(`${Buffer.byteLength(accessCookie(token))} bytes`)
    expect(message).toContain('4096 bytes')
    expect(message).toMatch(/fewer scopes or shorter-lived claims, or sign it with a smaller key/)
    // Logged once, with the same words, and no token.
    expect(state.logged).toEqual([message])
    for (const text of [JSON.stringify(result), ...state.logged]) expect(text).not.toContain('secret-')
  })

  it('names the refresh token when it is the one too large, as for the authorization code grant', async () => {
    state.body = { grant_type: 'authorization_code', code: 'c', code_verifier: 'v', redirect_uri: 'https://site.test/callback' }
    const { result } = await request(answer('access-secret', `refresh-${'r'.repeat(5000)}`))
    expect(state.status).toBe(502)
    expectNoSession()
    expect((result as { message: string }).message).toContain('refresh token makes the druxt.auth.refresh_token cookie')
  })

  it('ends the session on a refresh that answers a token too large, rather than keep half of it', async () => {
    state.cookies = { 'druxt.auth.refresh_token': 'refresh-secret', 'druxt.auth.client_id': 'site' }
    state.body = { grant_type: 'refresh_token' }
    const { result } = await request(answer(tokenOf(5000), 'refresh-2'))
    expect(state.status).toBe(502)
    for (const name of ['druxt.auth.access_token', 'druxt.auth.refresh_token', 'druxt.auth.client_id', 'druxt.auth.expires_at', 'druxt.auth.session']) {
      expect(state.set[name], name).toEqual({ options: expect.any(Object) })
    }
    expect((result as { message: string }).message).toContain('the refresh ended the session')
  })
})

describe('POST /api/_druxt/auth/logout', () => {
  it('clears every session cookie', async () => {
    state.config = { app: { baseURL: '/app/' }, public: { druxt: { ...publicConfig.druxt, auth: { ...publicConfig.druxt.auth, session: true } } } }
    const { default: handler } = await import('../../packages/core/src/runtime/server/routes/logout')
    await (handler as unknown as (event: unknown) => Promise<unknown>)({ context: {}, node: { req: { headers: { host: 'site.test', origin: 'http://site.test' } } } })
    for (const name of ['druxt.auth.access_token', 'druxt.auth.refresh_token', 'druxt.auth.client_id', 'druxt.auth.expires_at', 'druxt.auth.session']) {
      expect(state.set[name]).toEqual({ options: expect.objectContaining({ path: '/app/' }) })
    }
    expect(state.status).toBe(204)
  })

  it('refuses a request from another site, clearing no cookie', async () => {
    state.config = { app: { baseURL: '/' }, public: { druxt: { ...publicConfig.druxt, auth: { ...publicConfig.druxt.auth, session: true } } } }
    const { default: handler } = await import('../../packages/core/src/runtime/server/routes/logout')
    const event = { context: {}, node: { req: { headers: { host: 'site.test', origin: 'https://evil.test' } } } }
    expect(() => (handler as unknown as (event: unknown) => unknown)(event)).toThrow(expect.objectContaining({ statusCode: 403 }))
    expect(state.set).toEqual({})
    expect(state.status).toBe(0)
  })
})
