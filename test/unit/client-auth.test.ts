import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AUTH_STORAGE_KEYS, DruxtAuth, DruxtClient, createPkce } from '../../packages/client/src'
import type { AuthStorage, DruxtAuthOptions, DruxtFetch } from '../../packages/client/src'
import { BASE_URL, drupal, json, requested } from './fake-drupal'
import type { Call } from './fake-drupal'

const ARTICLE = '/jsonapi/node/article/a1'
const article = { data: { type: 'node--article', id: 'a1' } }

afterEach(() => {
  vi.useRealTimers()
})

/** The fields of a token request. */
const form = (call?: Call): Record<string, string> => Object.fromEntries(call?.body as URLSearchParams)

/** Simple OAuth issuing numbered tokens, or refusing them with a status, and an article only some tokens may read. */
const simpleOauth = (accepts: (authorization?: string) => boolean, refuse?: number) => {
  let issued = 1
  return drupal({
    'POST /oauth/token': () => {
      if (refuse) return json({ error: 'invalid_grant' }, refuse)
      issued += 1
      return json({ token_type: 'Bearer', access_token: `access-${issued}`, refresh_token: `refresh-${issued}`, expires_in: 300 })
    },
    [`GET ${ARTICLE}`]: (call) => (accepts(call.headers.Authorization) ? json(article) : json({ errors: [{ title: 'Unauthorized' }] }, 401)),
  })
}

const signedIn = (fetch: DruxtFetch, options: Partial<DruxtAuthOptions> = {}): DruxtClient & { auth: DruxtAuth } => {
  const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt', ...options } })
  client.auth!.setTokens({ access_token: 'access-1', refresh_token: 'refresh-1', expires_in: 300 }, 'druxt')
  return client as DruxtClient & { auth: DruxtAuth }
}

const expire = (client: DruxtClient) => client.auth!.storage.set(AUTH_STORAGE_KEYS.expiresAt, String(Date.now() - 1000))

describe('the access token', () => {
  it('is sent as a bearer token', async () => {
    const { fetch, calls } = simpleOauth(() => true)
    await signedIn(fetch).request(ARTICLE)
    expect(calls[0]?.headers.Authorization).toBe('Bearer access-1')
  })

  it('is read from and written to the storage given', async () => {
    const values = new Map<string, string | number | undefined>([[AUTH_STORAGE_KEYS.accessToken, 'stored']])
    const storage: AuthStorage = { get: (key) => values.get(key), set: (key, value) => { values.set(key, value) }, remove: (key) => { values.delete(key) } }
    const { fetch, calls } = simpleOauth(() => true)
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt', storage } })
    await client.request(ARTICLE)
    expect(calls[0]?.headers.Authorization).toBe('Bearer stored')
    client.auth!.setTokens({ access_token: 'new', refresh_token: 'refresh' }, 'druxt')
    expect(Object.fromEntries(values)).toEqual({ [AUTH_STORAGE_KEYS.accessToken]: 'new', [AUTH_STORAGE_KEYS.refreshToken]: 'refresh', [AUTH_STORAGE_KEYS.clientId]: 'druxt' })
  })

  it('expires after expires_in', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const client = signedIn(drupal({}).fetch)
    expect(client.auth.expired).toBe(false)
    vi.setSystemTime(Date.now() + 300_000)
    expect(client.auth.expired).toBe(true)
  })

  it('never expires without expires_in, even after one that did', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const { fetch, calls } = simpleOauth(() => true)
    const client = signedIn(fetch)
    vi.setSystemTime(Date.now() + 600_000)
    client.auth.setTokens({ access_token: 'lasting', refresh_token: 'refresh-1' })
    expect(client.auth.expired).toBe(false)
    expect(client.auth.storage.get(AUTH_STORAGE_KEYS.expiresAt)).toBeUndefined()
    await client.request(ARTICLE)
    expect(requested(calls)).toEqual([`GET ${ARTICLE}`])
  })

  it('replaces a client Authorization header of any case, sending one', async () => {
    const { fetch, calls } = simpleOauth(() => true)
    const client = signedIn(fetch)
    client.addHeaders({ authorization: 'Basic ZWRpdG9yOnNlY3JldA==' })
    await client.request(ARTICLE)
    const sent = Object.entries(calls[0]!.headers).filter(([name]) => name.toLowerCase() === 'authorization')
    expect(sent).toEqual([['Authorization', 'Bearer access-1']])
  })

  it('is left off, with no refresh, by auth: false', async () => {
    const { fetch, calls } = simpleOauth(() => true)
    const client = signedIn(fetch)
    expire(client)
    await client.request(ARTICLE, { auth: false })
    expect(requested(calls)).toEqual([`GET ${ARTICLE}`])
    expect(calls[0]?.headers.Authorization).toBeUndefined()
  })

  it('is no longer sent after logout()', async () => {
    const { fetch, calls } = simpleOauth(() => true)
    const client = signedIn(fetch)
    client.auth.logout()
    await client.request(ARTICLE)
    expect(client.auth.loggedIn).toBe(false)
    expect(calls[0]?.headers.Authorization).toBeUndefined()
  })
})

describe('refresh and retry', () => {
  it('refreshes an expired token before the request', async () => {
    const { fetch, calls } = simpleOauth((authorization) => authorization === 'Bearer access-2')
    const client = signedIn(fetch)
    expire(client)
    const response = await client.request(ARTICLE)
    expect(response.data).toEqual(article)
    expect(requested(calls)).toEqual(['POST /oauth/token', `GET ${ARTICLE}`])
    expect(form(calls[0])).toEqual({ grant_type: 'refresh_token', refresh_token: 'refresh-1', client_id: 'druxt' })
    expect(calls[0]?.headers.Authorization).toBeUndefined()
    expect(calls[1]?.headers.Authorization).toBe('Bearer access-2')
  })

  it('refreshes and retries a 401 once', async () => {
    const { fetch, calls } = simpleOauth((authorization) => authorization === 'Bearer access-2')
    const response = await signedIn(fetch).request(ARTICLE)
    expect(response.status).toBe(200)
    expect(requested(calls)).toEqual([`GET ${ARTICLE}`, 'POST /oauth/token', `GET ${ARTICLE}`])
    expect(calls.map((call) => call.headers.Authorization)).toEqual(['Bearer access-1', undefined, 'Bearer access-2'])
  })

  it('gives up when the retry is refused too, without looping', async () => {
    const { fetch, calls } = simpleOauth(() => false)
    await expect(signedIn(fetch).request(ARTICLE)).rejects.toMatchObject({ message: 'Request failed with status code 401', response: { status: 401 } })
    expect(requested(calls)).toEqual([`GET ${ARTICLE}`, 'POST /oauth/token', `GET ${ARTICLE}`])
  })

  it('throws the formatted 401 from the resource methods when the retry is refused', async () => {
    const { fetch, calls } = simpleOauth(() => false)
    await expect(signedIn(fetch).get(ARTICLE)).rejects.toThrow(`401: Unauthorized\n\nURL: ${BASE_URL}${ARTICLE}`)
    expect(calls).toHaveLength(3)
  })

  it('retries as the anonymous visitor when Drupal refuses the refresh token', async () => {
    const { fetch, calls } = simpleOauth((authorization) => !authorization, 400)
    const client = signedIn(fetch)
    const response = await client.request(ARTICLE)
    expect(response.status).toBe(200)
    expect(calls.map((call) => call.headers.Authorization)).toEqual(['Bearer access-1', undefined, undefined])
    expect(client.auth.loggedIn).toBe(false)
  })

  it('ends the session on a refresh refused with a 400 or a 401, and repeats the read anonymously', async () => {
    for (const status of [400, 401]) {
      const { fetch, calls } = simpleOauth((authorization) => !authorization, status)
      const client = signedIn(fetch)
      expect((await client.request(ARTICLE)).status).toBe(200)
      expect(calls.map((call) => call.headers.Authorization)).toEqual(['Bearer access-1', undefined, undefined])
      expect(client.auth.loggedIn).toBe(false)
    }
  })

  it('keeps the session through a refresh that times out or fails with a 5xx, and reports the original 401', async () => {
    const failures = [
      () => Promise.reject(new Error('The operation was aborted due to timeout')),
      () => Promise.resolve(json({ error: 'server_error' }, 503)),
    ]
    for (const failure of failures) {
      const { fetch, calls } = drupal({
        'POST /oauth/token': failure,
        [`GET ${ARTICLE}`]: () => json({ errors: [{ title: 'Unauthorized' }] }, 401),
      })
      const client = signedIn(fetch)
      await expect(client.request(ARTICLE)).rejects.toMatchObject({ response: { status: 401 } })
      expect(requested(calls)).toEqual([`GET ${ARTICLE}`, 'POST /oauth/token'])
      expect(client.auth.accessToken).toBe('access-1')
      expect(client.auth.refreshToken).toBe('refresh-1')
    }
  })

  it('does not repeat a write anonymously after a refused refresh, as it was meant to be made as the user', async () => {
    const { fetch, calls } = drupal({
      'POST /oauth/token': () => json({ error: 'invalid_grant' }, 400),
      'POST /jsonapi/node/article': () => json({ errors: [{ title: 'Unauthorized' }] }, 401),
    })
    const client = signedIn(fetch)
    const body = { data: { type: 'node--article', attributes: { title: 'Draft' } } }
    await expect(client.request('/jsonapi/node/article', { method: 'POST', body })).rejects.toMatchObject({ response: { status: 401 } })
    expect(requested(calls)).toEqual(['POST /jsonapi/node/article', 'POST /oauth/token'])
    expect(client.auth.loggedIn).toBe(false)
  })

  it('repeats every read refused together anonymously, after their one refused refresh', async () => {
    const { fetch, calls } = simpleOauth((authorization) => !authorization, 400)
    const client = signedIn(fetch)
    const responses = await Promise.all([client.request(ARTICLE), client.request(ARTICLE), client.request(ARTICLE)])
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200])
    expect(requested(calls).filter((call) => call === 'POST /oauth/token')).toHaveLength(1)
    expect(calls.filter((call) => call.method === 'GET').map((call) => call.headers.Authorization))
      .toEqual(['Bearer access-1', 'Bearer access-1', 'Bearer access-1', undefined, undefined, undefined])
  })

  it('keeps a session signed in again while a refused refresh was pending, and repeats the read without it', async () => {
    let refuse = () => {}
    const { fetch, calls } = drupal({
      'POST /oauth/token': () => new Promise<Response>((resolve) => { refuse = () => resolve(json({ error: 'invalid_grant' }, 400)) }),
      [`GET ${ARTICLE}`]: (call) => (call.headers.Authorization ? json({ errors: [{ title: 'Unauthorized' }] }, 401) : json(article)),
    })
    const client = signedIn(fetch)
    const read = client.request(ARTICLE)
    await vi.waitFor(() => expect(requested(calls)).toContain('POST /oauth/token'))
    // A sign-in that completes while the old session's refresh is pending is a session of its own.
    client.auth.setTokens({ access_token: 'access-new', refresh_token: 'refresh-new', expires_in: 300 }, 'druxt')
    refuse()
    expect((await read).status).toBe(200)
    expect(client.auth.accessToken).toBe('access-new')
    expect(client.auth.refreshToken).toBe('refresh-new')
    // The read belonged to the old session: it is repeated anonymously, never as the new one.
    expect(calls.map((call) => call.headers.Authorization)).toEqual(['Bearer access-1', undefined, undefined])
  })

  it('drops a token Drupal refuses when there is no refresh token to try, and repeats the read anonymously', async () => {
    const { fetch, calls } = simpleOauth((authorization) => !authorization)
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt' } }) as DruxtClient & { auth: DruxtAuth }
    client.auth.setTokens({ access_token: 'access-1' })
    expect((await client.request(ARTICLE)).status).toBe(200)
    expect(requested(calls)).toEqual([`GET ${ARTICLE}`, `GET ${ARTICLE}`])
    expect(calls.map((call) => call.headers.Authorization)).toEqual(['Bearer access-1', undefined])
    expect(client.auth.loggedIn).toBe(false)
  })

  it('reports the 401 of a read still refused anonymously once its token is dropped', async () => {
    const { fetch, calls } = simpleOauth(() => false)
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt' } }) as DruxtClient & { auth: DruxtAuth }
    client.auth.setTokens({ access_token: 'access-1' })
    await expect(client.request(ARTICLE)).rejects.toMatchObject({ response: { status: 401 } })
    expect(calls.map((call) => call.headers.Authorization)).toEqual(['Bearer access-1', undefined])
  })

  it('keeps the token and the 401 of a write refused with no refresh token, as it was meant to be made as the user', async () => {
    const { fetch, calls } = drupal({ 'POST /jsonapi/node/article': () => json({ errors: [{ title: 'Unauthorized' }] }, 401) })
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt' } }) as DruxtClient & { auth: DruxtAuth }
    client.auth.setTokens({ access_token: 'access-1' })
    const body = { data: { type: 'node--article', attributes: { title: 'Draft' } } }
    await expect(client.request('/jsonapi/node/article', { method: 'POST', body })).rejects.toMatchObject({ response: { status: 401 } })
    expect(requested(calls)).toEqual(['POST /jsonapi/node/article'])
    expect(client.auth.accessToken).toBe('access-1')
  })

  it('repeats nothing for a 401 to a read sent without a token, as there is none to drop', async () => {
    const { fetch, calls } = simpleOauth(() => false)
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt' } })
    await expect(client.request(ARTICLE)).rejects.toMatchObject({ response: { status: 401 } })
    expect(calls).toHaveLength(1)
  })

  it('leaves the session and the 401 of another host alone', async () => {
    const elsewhere = 'https://elsewhere.test/feed'
    const { fetch, calls } = drupal({ [`GET ${elsewhere}`]: () => json({ errors: [{ title: 'Unauthorized' }] }, 401) })
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt' } }) as DruxtClient & { auth: DruxtAuth }
    client.auth.setTokens({ access_token: 'access-1' })
    await expect(client.request(elsewhere)).rejects.toMatchObject({ response: { status: 401 } })
    expect(calls).toHaveLength(1)
    expect(client.auth.accessToken).toBe('access-1')
  })

  it('does not retry a request as a session signed in while its refresh ran', async () => {
    let issue = () => {}
    const { fetch, calls } = drupal({
      'POST /oauth/token': () => new Promise<Response>((resolve) => { issue = () => resolve(json({ access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 300 })) }),
      'POST /jsonapi/node/article': (call) => (call.headers.Authorization === 'Bearer access-1' ? json({ errors: [{ title: 'Unauthorized' }] }, 401) : json(article, 201)),
    })
    const client = signedIn(fetch)
    const write = client.request('/jsonapi/node/article', { method: 'POST', body: { data: { type: 'node--article' } } })
    await vi.waitFor(() => expect(requested(calls)).toContain('POST /oauth/token'))
    // Another user signs in while the first one's refresh runs.
    client.auth.setTokens({ access_token: 'access-b', refresh_token: 'refresh-b', expires_in: 300 }, 'druxt')
    issue()
    await expect(write).rejects.toMatchObject({ response: { status: 401 } })
    expect(requested(calls)).toEqual(['POST /jsonapi/node/article', 'POST /oauth/token'])
    expect([client.auth.accessToken, client.auth.refreshToken]).toEqual(['access-b', 'refresh-b'])
  })

  it('sends no bearer token to another host', async () => {
    const elsewhere = 'https://cdn.example/file.json'
    const { fetch, calls } = drupal({ [`GET ${elsewhere}`]: { ok: true }, [`GET ${ARTICLE}`]: article })
    const client = signedIn(fetch)
    await client.request(elsewhere)
    await client.request(`${BASE_URL}${ARTICLE}`)
    expect(calls.map((call) => call.headers.Authorization)).toEqual([undefined, 'Bearer access-1'])
  })

  it('neither refreshes nor replays another host\'s 401', async () => {
    const elsewhere = 'https://cdn.example/file.json'
    const { fetch, calls } = drupal({
      [`GET ${elsewhere}`]: () => json({}, 401),
      'POST /oauth/token': () => json({ access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 300 }),
    })
    const client = signedIn(fetch)
    await expect(client.request(elsewhere)).rejects.toMatchObject({ response: { status: 401 } })
    // Nor is an expired token refreshed for a request that will not carry it.
    expire(client)
    expect((await client.request(elsewhere, { validateStatus: () => true })).status).toBe(401)
    expect(requested(calls)).toEqual([`GET ${elsewhere}`, `GET ${elsewhere}`])
    expect([client.auth.accessToken, client.auth.refreshToken]).toEqual(['access-1', 'refresh-1'])
  })

  it('repeats every read refused together with a dropped token anonymously, and ends the session once', async () => {
    const { fetch, calls } = simpleOauth((authorization) => !authorization)
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt' } }) as DruxtClient & { auth: DruxtAuth }
    client.auth.setTokens({ access_token: 'access-1' })
    const clear = vi.spyOn(client.auth, 'clearTokens')
    const responses = await Promise.all([client.request(ARTICLE), client.request(ARTICLE), client.request(ARTICLE)])
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200])
    expect(calls.map((call) => call.headers.Authorization))
      .toEqual(['Bearer access-1', 'Bearer access-1', 'Bearer access-1', undefined, undefined, undefined])
    expect(clear).toHaveBeenCalledTimes(1)
    expect(client.auth.loggedIn).toBe(false)
  })

  it('keeps a session signed in again while a read with a dropped token was pending, and repeats the read without it', async () => {
    let refuse = () => {}
    const { fetch, calls } = drupal({
      [`GET ${ARTICLE}`]: (call) => (call.headers.Authorization
        ? new Promise<Response>((resolve) => { refuse = () => resolve(json({ errors: [{ title: 'Unauthorized' }] }, 401)) })
        : json(article)),
    })
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt' } }) as DruxtClient & { auth: DruxtAuth }
    client.auth.setTokens({ access_token: 'access-1' })
    const read = client.request(ARTICLE)
    await vi.waitFor(() => expect(calls).toHaveLength(1))
    // A sign-in that completes while the read is pending is a session of its own.
    client.auth.setTokens({ access_token: 'access-new' })
    refuse()
    expect((await read).status).toBe(200)
    expect(client.auth.accessToken).toBe('access-new')
    // The read belonged to the old session: it is repeated anonymously, never as the new one.
    expect(calls.map((call) => call.headers.Authorization)).toEqual(['Bearer access-1', undefined])
  })

  it('shares one refresh between concurrent requests', async () => {
    const { fetch, calls } = simpleOauth((authorization) => authorization === 'Bearer access-2')
    const client = signedIn(fetch)
    const responses = await Promise.all([client.request(ARTICLE), client.request(ARTICLE)])
    expect(responses.map((response) => response.status)).toEqual([200, 200])
    expect(requested(calls).filter((call) => call === 'POST /oauth/token')).toHaveLength(1)
  })

  it('refreshes without a scope, keeping the one granted', async () => {
    const { fetch, calls } = simpleOauth((authorization) => authorization === 'Bearer access-3')
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt', scope: 'read write' } })
    await client.auth!.loginWithPassword({ username: 'editor', password: 'correct horse', scope: 'read' })
    expire(client)
    await client.request(ARTICLE)
    expect(requested(calls)).toEqual(['POST /oauth/token', 'POST /oauth/token', `GET ${ARTICLE}`])
    expect(form(calls[0])).toMatchObject({ grant_type: 'password', scope: 'read' })
    expect(form(calls[1])).toEqual({ grant_type: 'refresh_token', refresh_token: 'refresh-2', client_id: 'druxt' })
  })

  it('refreshes with the Consumer that issued the tokens', async () => {
    const { fetch, calls } = drupal({
      'POST /api/password-token': () => json({ access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 300 }),
      [`GET ${ARTICLE}`]: article,
    })
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt', passwordClientId: 'druxt-password', clientSecret: 'secret', passwordTokenUrl: '/api/password-token' } })
    await client.auth!.loginWithPassword({ username: 'editor', password: 'correct horse' })
    expire(client)
    await client.request(ARTICLE)
    expect(requested(calls)).toEqual(['POST /api/password-token', 'POST /api/password-token', `GET ${ARTICLE}`])
    expect(form(calls[1])).toEqual({ grant_type: 'refresh_token', refresh_token: 'refresh-2', client_id: 'druxt-password', client_secret: 'secret' })
  })
})

describe('DruxtAuth', () => {
  it('requires a clientId', () => {
    expect(() => new DruxtAuth(new DruxtClient(BASE_URL), { clientId: '' })).toThrow('DruxtAuth requires a clientId.')
  })

  it('signs in with a password, without the bearer token and with the secret', async () => {
    const { fetch, calls } = simpleOauth(() => true)
    const client = signedIn(fetch, { clientSecret: 'secret', scope: 'editor' })
    const tokens = await client.auth.loginWithPassword({ username: 'editor', password: 'correct horse' })
    expect(tokens).toEqual({ token_type: 'Bearer', access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 300 })
    expect(form(calls[0])).toEqual({ grant_type: 'password', username: 'editor', password: 'correct horse', scope: 'editor', client_id: 'druxt', client_secret: 'secret' })
    expect(calls[0]?.headers.Authorization).toBeUndefined()
    expect([client.auth.accessToken, client.auth.refreshToken, client.auth.loggedIn, client.auth.expired]).toEqual(['access-2', 'refresh-2', true, false])
  })

  it('drops the stored refresh token when a sign-in issues none', async () => {
    const { fetch } = drupal({ 'POST /oauth/token': () => json({ access_token: 'access-2', expires_in: 300 }) })
    const client = signedIn(fetch, { clientSecret: 'secret' })
    await client.auth.loginWithPassword({ username: 'editor', password: 'correct horse' })
    expect([client.auth.accessToken, client.auth.refreshToken, client.auth.canRefresh]).toEqual(['access-2', undefined, false])
  })

  it('keeps the refresh token when a refresh issues no new one, as RFC 6749 section 6 allows', async () => {
    const { fetch, calls } = drupal({ 'POST /oauth/token': () => json({ access_token: 'access-2', expires_in: 300 }) })
    const client = signedIn(fetch)
    await client.auth.refresh()
    expect(form(calls[0])).toMatchObject({ grant_type: 'refresh_token', refresh_token: 'refresh-1' })
    expect([client.auth.accessToken, client.auth.refreshToken]).toEqual(['access-2', 'refresh-1'])
  })

  it('signs in with client credentials', async () => {
    const { fetch, calls } = simpleOauth(() => true)
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt-build', clientSecret: 'secret' } })
    await client.auth!.loginWithClientCredentials({ scope: 'druxt_build' })
    expect(form(calls[0])).toEqual({ grant_type: 'client_credentials', scope: 'druxt_build', client_id: 'druxt-build', client_secret: 'secret' })
    expect(client.auth!.accessToken).toBe('access-2')
  })

  it('sends the secret to the password grant\'s Consumer alone', async () => {
    const { fetch, calls } = drupal({
      'POST /api/password-token': () => json({ access_token: 'password' }),
      'POST /oauth/token': () => json({ access_token: 'code' }),
    })
    const auth = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt', passwordClientId: 'druxt-password', clientSecret: 'secret', passwordTokenUrl: '/api/password-token' } }).auth!
    await auth.loginWithPassword({ username: 'editor', password: 'correct horse' })
    await auth.exchangeCode({ code: 'auth-code', verifier: 'pkce-verifier', redirectUri: 'https://site.test/callback' })
    expect(requested(calls)).toEqual(['POST /api/password-token', 'POST /oauth/token'])
    expect(form(calls[0])).toMatchObject({ client_id: 'druxt-password', client_secret: 'secret' })
    expect(form(calls[1])).toEqual({ grant_type: 'authorization_code', code: 'auth-code', code_verifier: 'pkce-verifier', redirect_uri: 'https://site.test/callback', client_id: 'druxt' })
  })

  it('starts the authorization code grant with an S256 PKCE challenge', async () => {
    const client = new DruxtClient(BASE_URL, { auth: { clientId: 'druxt', authorizeUrl: `${BASE_URL}/oauth/authorize`, scope: 'editor' } })
    const { url, state, verifier } = await client.auth!.authorize({ redirectUri: 'https://site.test/callback', state: 'xyz-state' })
    const params = Object.fromEntries(new URL(url).searchParams)
    expect(url.startsWith(`${BASE_URL}/oauth/authorize?`)).toBe(true)
    expect(state).toBe('xyz-state')
    expect(params).toEqual({
      response_type: 'code',
      client_id: 'druxt',
      redirect_uri: 'https://site.test/callback',
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
      state: 'xyz-state',
      scope: 'editor',
    })
  })

  it('leaves the scope out when none is set', async () => {
    const { url } = await new DruxtClient(BASE_URL, { auth: { clientId: 'druxt' } }).auth!.authorize({ redirectUri: 'https://site.test/callback' })
    expect(new URLSearchParams(url.split('?')[1]).has('scope')).toBe(false)
  })

  it('sends the visitor to Drupal\'s authorize URL by default', async () => {
    const { url } = await new DruxtClient(BASE_URL, { auth: { clientId: 'druxt' } }).auth!.authorize({ redirectUri: 'https://site.test/callback' })
    expect(url.startsWith(`${BASE_URL}/oauth/authorize?`)).toBe(true)
  })

  it('makes a URL-safe PKCE verifier and its challenge', async () => {
    const { verifier, challenge } = await createPkce()
    expect(verifier).toMatch(/^[\w-]{64}$/)
    expect(challenge).toBe(createHash('sha256').update(verifier).digest('base64url'))
  })

  it('reuses a refresh made within the grace period', async () => {
    const { fetch, calls } = simpleOauth(() => true)
    const client = signedIn(fetch)
    expect(await client.auth.refresh()).toMatchObject({ access_token: 'access-2' })
    expect(await client.auth.refresh()).toBeUndefined()
    expect(calls).toHaveLength(1)
  })

  // A server answering several renders of one browser at once, each with a client of its own, shares one refresh
  // between them through `refresh.share`, as one refresh token can be spent only once.
  const sharing = () => {
    const running = new Map<string, Promise<unknown>>()
    const share = <T>(session: string, start: () => Promise<T>): Promise<T> => {
      if (!running.has(session)) running.set(session, start())
      return running.get(session) as Promise<T>
    }
    return { running, share }
  }

  it('shares a refresh through refresh.share, and each client stores the tokens it shared', async () => {
    const { fetch, calls } = simpleOauth((authorization) => authorization === 'Bearer access-2')
    const { running, share } = sharing()
    const renders = [signedIn(fetch, { refresh: { share } }), signedIn(fetch, { refresh: { share } })]
    const responses = await Promise.all(renders.map((client) => client.request(ARTICLE)))
    expect(responses.map((response) => response.status)).toEqual([200, 200])
    expect(requested(calls).filter((call) => call === 'POST /oauth/token')).toHaveLength(1)
    expect(running.size).toBe(1)
    for (const client of renders) expect([client.auth.accessToken, client.auth.refreshToken]).toEqual(['access-2', 'refresh-2'])

    const other = signedIn(fetch, { refresh: { share } })
    other.auth.setTokens({ access_token: 'access-9', refresh_token: 'refresh-9', expires_in: 300 }, 'druxt')
    await other.auth.refresh()
    // Another session is another key.
    expect(running.size).toBe(2)
  })

  it('stores a shared refresh only in a client still holding the session it was for', async () => {
    let issue = () => {}
    const { fetch, calls } = drupal({
      'POST /oauth/token': () => new Promise<Response>((resolve) => { issue = () => resolve(json({ access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 300 })) }),
    })
    const { share } = sharing()
    const owner = signedIn(fetch, { refresh: { share } })
    const joined = signedIn(fetch, { refresh: { share } })
    const refreshes = [owner.auth.refresh(), joined.auth.refresh()]
    await vi.waitFor(() => expect(calls).toHaveLength(1))
    // A sign-in on the joined client before the shared refresh answers is newer, and kept.
    joined.auth.setTokens({ access_token: 'access-new', refresh_token: 'refresh-new', expires_in: 300 }, 'druxt')
    issue()
    await expect(refreshes[0]).resolves.toMatchObject({ access_token: 'access-2' })
    // The joined client's refresh was for the session it no longer holds.
    await expect(refreshes[1]).rejects.toMatchObject({ superseded: true })
    expect(owner.auth.accessToken).toBe('access-2')
    expect([joined.auth.accessToken, joined.auth.refreshToken]).toEqual(['access-new', 'refresh-new'])
  })

  it('keeps a logout made while a sign-in was pending', async () => {
    let answer = () => {}
    const { fetch, calls } = drupal({
      'POST /oauth/token': () => new Promise<Response>((resolve) => { answer = () => resolve(json({ access_token: 'late', refresh_token: 'late-r', expires_in: 300 })) }),
    })
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt' } }) as DruxtClient & { auth: DruxtAuth }
    const signIn = client.auth.loginWithPassword({ username: 'editor', password: 'correct horse' })
    await vi.waitFor(() => expect(calls).toHaveLength(1))
    await client.auth.logout()
    answer()
    await expect(signIn).rejects.toMatchObject({ superseded: true })
    expect([client.auth.loggedIn, client.auth.accessToken]).toEqual([false, undefined])
  })

  it('keeps the later of two overlapping sign-ins', async () => {
    const answers: Record<string, () => void> = {}
    const { fetch } = drupal({
      'POST /oauth/token': (call) => new Promise<Response>((resolve) => {
        const user = form(call).username!
        answers[user] = () => resolve(json({ access_token: `access-${user}`, refresh_token: `refresh-${user}`, expires_in: 300 }))
      }),
    })
    const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt' } }) as DruxtClient & { auth: DruxtAuth }
    const first = client.auth.loginWithPassword({ username: 'a', password: 'pw' })
    const second = client.auth.loginWithPassword({ username: 'b', password: 'pw' })
    await vi.waitFor(() => expect(Object.keys(answers)).toHaveLength(2))
    answers.b!()
    await second
    answers.a!()
    await expect(first).rejects.toMatchObject({ superseded: true })
    expect([client.auth.accessToken, client.auth.refreshToken]).toEqual(['access-b', 'refresh-b'])
  })

  it('refuses more refreshes than the limit allows in a window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const { fetch, calls } = simpleOauth(() => true)
    const client = signedIn(fetch, { refresh: { grace: 0, limit: 2, window: 30_000 } })
    await client.auth.refresh()
    await client.auth.refresh()
    await expect(client.auth.refresh()).rejects.toThrow('DruxtAuth refresh limit reached.')
    expect(calls).toHaveLength(2)
    vi.setSystemTime(Date.now() + 30_000)
    await client.auth.refresh()
    expect(calls).toHaveLength(3)
  })

  it('cannot refresh without a refresh token', async () => {
    const client = new DruxtClient(BASE_URL, { fetch: drupal({}).fetch, auth: { clientId: 'druxt' } })
    await expect(client.auth!.refresh()).rejects.toThrow('DruxtAuth holds no refresh token.')
  })

  it('forgets tokens Drupal refused, and keeps them through a server error', async () => {
    const refused = signedIn(simpleOauth(() => true, 401).fetch)
    await expect(refused.auth.refresh()).rejects.toMatchObject({ response: { status: 401 } })
    expect(refused.auth.loggedIn).toBe(false)

    const failed = signedIn(simpleOauth(() => true, 500).fetch)
    await expect(failed.auth.refresh()).rejects.toMatchObject({ response: { status: 500 } })
    expect(failed.auth.refreshToken).toBe('refresh-1')
  })

  it('gets the signed-in user from userinfo', async () => {
    const { fetch, calls } = drupal({ 'GET /oauth/userinfo': { sub: '1', name: 'editor' } })
    expect(await new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt' } }).auth!.getUser()).toBeUndefined()
    expect(calls).toHaveLength(0)
    expect(await signedIn(fetch).auth.getUser()).toEqual({ sub: '1', name: 'editor' })
    expect(calls[0]?.headers.Authorization).toBe('Bearer access-1')
  })
})

// In a browser behind the site's proxy, the tokens stay in httpOnly cookies the site's server holds. The browser's
// client holds only the session marker, the access token's expiry, and the proxy adds the Authorization header.
describe('a session the site\'s server holds', () => {
  const TOKEN_ROUTE = `${BASE_URL}/api/_druxt/auth/token`
  const marker = (value?: string) => {
    const values = new Map<string, string | number | undefined>(value ? [[AUTH_STORAGE_KEYS.session, value]] : [])
    const storage: AuthStorage = { get: (key) => values.get(key), set: (key, value) => { values.set(key, value) }, remove: (key) => { values.delete(key) } }
    return { values, storage }
  }
  const server = (accepts: (call: Call) => boolean = () => true) => drupal({
    'POST /api/_druxt/auth/token': () => json({ token_type: 'Bearer', expires_in: 300 }),
    'POST /api/_druxt/auth/logout': () => new Response(null, { status: 204 }),
    [`GET ${ARTICLE}`]: (call) => (accepts(call) ? json(article) : json({ errors: [{ title: 'Unauthorized' }] }, 401)),
  })
  const sessionClient = (fetch: DruxtFetch, storage: AuthStorage) => new DruxtClient(BASE_URL, {
    fetch,
    auth: { clientId: 'druxt', session: true, tokenUrl: TOKEN_ROUTE, passwordTokenUrl: TOKEN_ROUTE, logoutUrl: `${BASE_URL}/api/_druxt/auth/logout`, storage },
  }) as DruxtClient & { auth: DruxtAuth }

  it('is signed in by its marker, and sends no Authorization header of its own', async () => {
    const { fetch, calls } = server()
    const client = sessionClient(fetch, marker(String(Date.now() + 300_000)).storage)
    expect(client.auth.loggedIn).toBe(true)
    expect(client.auth.accessToken).toBeUndefined()
    expect(client.auth.refreshToken).toBeUndefined()
    await client.request(ARTICLE)
    expect(calls[0]?.headers.Authorization).toBeUndefined()
    expect(sessionClient(fetch, marker().storage).auth.loggedIn).toBe(false)
  })

  it('reads its expiry from the marker, and never expires on a marker with none', () => {
    expect(sessionClient(drupal({}).fetch, marker(String(Date.now() - 1000)).storage).auth.expired).toBe(true)
    expect(sessionClient(drupal({}).fetch, marker(String(Date.now() + 1000)).storage).auth.expired).toBe(false)
    expect(sessionClient(drupal({}).fetch, marker('on').storage).auth.expired).toBe(false)
  })

  it('signs in through the site\'s token route, keeping no token, only the marker', async () => {
    const { fetch, calls } = server()
    const { values, storage } = marker()
    const client = sessionClient(fetch, storage)
    await client.auth.loginWithPassword({ username: 'editor', password: 'pw' })
    expect(requested(calls)).toEqual(['POST /api/_druxt/auth/token'])
    expect([...values.keys()]).toEqual([AUTH_STORAGE_KEYS.session])
    expect(client.auth.loggedIn).toBe(true)
  })

  it('refreshes an expired session and a 401 through the token route, with no refresh token of its own', async () => {
    const { fetch, calls } = server(() => calls.some((c) => c.url.includes('/api/_druxt/auth/token')))
    const client = sessionClient(fetch, marker(String(Date.now() + 300_000)).storage)
    await client.request(ARTICLE)
    expect(requested(calls)).toEqual([`GET ${ARTICLE}`, 'POST /api/_druxt/auth/token', `GET ${ARTICLE}`])
    expect(form(calls[1])).toEqual({ grant_type: 'refresh_token', client_id: 'druxt' })

    const expired = server()
    const stale = sessionClient(expired.fetch, marker(String(Date.now() - 1000)).storage)
    await stale.request(ARTICLE)
    expect(requested(expired.calls)).toEqual(['POST /api/_druxt/auth/token', `GET ${ARTICLE}`])
  })

  it('asks the proxy to leave its credentials off a request made with auth: false', async () => {
    const { fetch, calls } = server()
    await sessionClient(fetch, marker('on').storage).request(ARTICLE, { auth: false })
    expect(calls[0]?.headers['X-Druxt-Auth']).toBe('none')
    expect(calls[0]?.headers.Authorization).toBeUndefined()
  })

  it('asks the proxy for no credentials on the read it repeats after a refused refresh', async () => {
    const { fetch, calls } = drupal({
      'POST /api/_druxt/auth/token': () => json({ error: 'invalid_grant' }, 400),
      [`GET ${ARTICLE}`]: (call) => (call.headers['X-Druxt-Auth'] === 'none' ? json(article) : json({ errors: [{ title: 'Unauthorized' }] }, 401)),
    })
    const response = await sessionClient(fetch, marker('on').storage).request(ARTICLE)
    expect(response.status).toBe(200)
    expect(requested(calls)).toEqual([`GET ${ARTICLE}`, 'POST /api/_druxt/auth/token', `GET ${ARTICLE}`])
    // The token request, made without auth, asks for none too.
    expect(calls.map((call) => call.headers['X-Druxt-Auth'])).toEqual([undefined, 'none', 'none'])
  })

  it('asks the proxy for no credentials on a read refused after another read ended its session', async () => {
    const { values, storage } = marker('on')
    const { fetch, calls } = drupal({
      [`GET ${ARTICLE}`]: (call) => {
        if (call.headers['X-Druxt-Auth'] === 'none') return json(article)
        // Another read's refused refresh ends the session while this one is answered.
        values.delete(AUTH_STORAGE_KEYS.session)
        return json({ errors: [{ title: 'Unauthorized' }] }, 401)
      },
    })
    const response = await sessionClient(fetch, storage).request(ARTICLE)
    expect(response.status).toBe(200)
    expect(requested(calls)).toEqual([`GET ${ARTICLE}`, `GET ${ARTICLE}`])
    expect(calls.map((call) => call.headers['X-Druxt-Auth'])).toEqual([undefined, 'none'])
  })

  it('keeps a second session-mode sign-in through a refused refresh of the first, without expires_in', async () => {
    let refuse = () => {}
    const { fetch } = drupal({
      // A token route that answers without expires_in, so each sign-in stores the same `on` marker.
      'POST /api/_druxt/auth/token': (call) => (form(call).grant_type === 'refresh_token'
        ? new Promise<Response>((resolve) => { refuse = () => resolve(json({ error: 'invalid_grant' }, 400)) })
        : json({ token_type: 'Bearer' })),
    })
    const { values, storage } = marker()
    const client = sessionClient(fetch, storage)
    await client.auth.loginWithPassword({ username: 'a', password: 'pw' })
    const refresh = client.auth.refresh()
    await client.auth.loginWithPassword({ username: 'b', password: 'pw' })
    expect(values.get(AUTH_STORAGE_KEYS.session)).toBe('on')
    refuse()
    await expect(refresh).rejects.toMatchObject({ response: { status: 400 } })
    expect(client.auth.loggedIn).toBe(true)
  })

  it('signs out through the site\'s logout route, which clears the cookies the browser cannot', async () => {
    const { fetch, calls } = server()
    const { storage } = marker('on')
    await sessionClient(fetch, storage).auth.logout()
    expect(requested(calls)).toEqual(['POST /api/_druxt/auth/logout'])
  })

  it('keeps the session and rejects when the logout route fails', async () => {
    let status = 500
    const { fetch, calls } = drupal({ 'POST /api/_druxt/auth/logout': () => (status === 204 ? new Response(null, { status }) : json({ error: 'server_error' }, status)) })
    const { values, storage } = marker('on')
    const client = sessionClient(fetch, storage)
    await expect(client.auth.logout()).rejects.toMatchObject({ response: { status: 500 } })
    expect([client.auth.loggedIn, values.get(AUTH_STORAGE_KEYS.session)]).toEqual([true, 'on'])
    // Signing out again retries it.
    status = 204
    await client.auth.logout()
    expect(client.auth.loggedIn).toBe(false)
    expect(requested(calls)).toEqual(['POST /api/_druxt/auth/logout', 'POST /api/_druxt/auth/logout'])
  })
})
