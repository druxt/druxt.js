import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearServerClients, serverAuthConfig, serverAuthOptions, signedInClient } from '../../packages/core/src/runtime/server/signIn'
import { BASE_URL, drupal, index, json } from './fake-drupal'

describe('serverAuthOptions()', () => {
  it('signs in with client credentials when a client id and secret are set', () => {
    expect(serverAuthOptions({ clientId: 'build', clientSecret: 'secret', scope: 'druxt_build' }))
      .toEqual({ clientId: 'build', clientSecret: 'secret', username: undefined, password: undefined, scope: 'druxt_build' })
  })

  it('signs in with the password grant when a username and password are set', () => {
    expect(serverAuthOptions({ clientId: 'build', username: 'bot', password: 'pw' }))
      .toEqual({ clientId: 'build', clientSecret: undefined, username: 'bot', password: 'pw', scope: undefined })
  })

  it('returns undefined, meaning anonymous, without a client id or without a secret and password', () => {
    expect(serverAuthOptions({})).toBeUndefined()
    expect(serverAuthOptions({ clientId: 'build' })).toBeUndefined()
    expect(serverAuthOptions({ clientSecret: 'secret' })).toBeUndefined()
  })

  it('treats empty strings, which an unset runtime config key leaves behind, as unset', () => {
    expect(serverAuthOptions({ clientId: '', clientSecret: '', username: '', password: '', scope: '' })).toBeUndefined()
  })
})

describe('signedInClient()', () => {
  const credentials = { clientId: 'build', clientSecret: 'secret' }

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const stubTokens = (expiresIn: number, fail = false) => {
    const fetchMock = vi.fn(async () => {
      if (fail) return new Response('{}', { status: 500 })
      return new Response(JSON.stringify({ access_token: 'token', token_type: 'Bearer', expires_in: expiresIn }), { status: 200, headers: { 'content-type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('signs in once, and again when the token has expired without a refresh token', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const fetchMock = stubTokens(300)
    const clients = new Map()
    const first = await signedInClient(clients, 'https://drupal.test', {}, credentials)
    expect(await signedInClient(clients, 'https://drupal.test', {}, credentials)).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    vi.setSystemTime(Date.now() + 301_000)
    // Callers arriving together share the one new sign-in.
    const [a, b] = await Promise.all([
      signedInClient(clients, 'https://drupal.test', {}, credentials),
      signedInClient(clients, 'https://drupal.test', {}, credentials),
    ])
    expect(a).toBe(first)
    expect(b).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('forgets a sign-in that failed, so the next call tries again', async () => {
    const fetchMock = stubTokens(300, true)
    const clients = new Map()
    await expect(signedInClient(clients, 'https://drupal.test', {}, credentials)).rejects.toThrow()
    expect(clients.size).toBe(0)
    await expect(signedInClient(clients, 'https://drupal.test', {}, credentials)).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('serverAuthConfig()', () => {
  const env = { DRUXT_BUILD_CLIENT_ID: 'env-id', DRUXT_BUILD_CLIENT_SECRET: 'env-secret', DRUXT_BUILD_USERNAME: 'env-user', DRUXT_BUILD_PASSWORD: 'env-pw', DRUXT_BUILD_SCOPE: 'env-scope' }

  it('reads the runtime config first, and the DRUXT_BUILD_* variables at request time for each key it leaves unset', () => {
    expect(serverAuthConfig({ clientId: 'runtime-id', clientSecret: '', username: '', password: '', scope: 'druxt_build' }, env))
      .toEqual({ clientId: 'runtime-id', clientSecret: 'env-secret', username: 'env-user', password: 'env-pw', scope: 'druxt_build' })
  })

  it('leaves the credentials unset when neither names them', () => {
    expect(serverAuthOptions(serverAuthConfig({}, {}))).toBeUndefined()
  })
})

describe('clearServerClients()', () => {
  it('empties each client\'s index, so a resource type Drupal added is seen, and skips a failed sign-in', async () => {
    let types = ['node--article']
    const { fetch } = drupal({ 'GET /jsonapi': () => json(index('', types)) })
    const clients = new Map()
    const client = await signedInClient(clients, BASE_URL, { fetch }, {})
    const listed = async () => Object.keys(await client.getIndex()).filter((key) => key.startsWith('node--'))
    clients.set('failed', Promise.reject(new Error('sign-in failed')))
    clients.get('failed').catch(() => {})

    expect(await listed()).toEqual(['node--article'])
    types = ['node--article', 'node--page']
    expect(await listed()).toEqual(['node--article'])

    await clearServerClients(clients)
    expect(await listed()).toEqual(['node--article', 'node--page'])
  })
})
