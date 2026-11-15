import { afterEach, describe, expect, it, vi } from 'vitest'
import { DruxtClient } from '../../packages/client/src'
import type { DruxtAuth } from '../../packages/client/src'
import { shareRefresh } from '../../packages/core/src/runtime/utils/refresh'
import { BASE_URL, drupal, json, requested } from './fake-drupal'

const ARTICLE = '/jsonapi/node/article/a1'

afterEach(() => {
  vi.restoreAllMocks()
})

/** Simple OAuth, issuing numbered tokens or refusing every refresh, and an article only a refreshed token may read. */
const simpleOauth = (refuse?: number) => {
  let issued = 1
  return drupal({
    'POST /oauth/token': () => {
      if (refuse) return json({ error: 'invalid_grant' }, refuse)
      issued += 1
      return json({ token_type: 'Bearer', access_token: `access-${issued}`, refresh_token: `refresh-${issued}`, expires_in: 300 })
    },
    [`GET ${ARTICLE}`]: (call) => (call.headers.Authorization && call.headers.Authorization !== 'Bearer access-1'
      ? json({ data: { type: 'node--article', id: 'a1' } })
      : json({ errors: [{ title: 'Unauthorized' }] }, 401)),
  })
}

/** One server render's client, as the app plugin builds it per request, holding a browser's session. */
const render = (fetch: ReturnType<typeof drupal>['fetch'], refreshToken: string) => {
  const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'druxt', refresh: { share: shareRefresh } } }) as DruxtClient & { auth: DruxtAuth }
  client.auth.setTokens({ access_token: 'access-1', refresh_token: refreshToken, expires_in: 300 }, 'druxt')
  return client
}

const tokenRequests = (calls: ReturnType<typeof drupal>['calls']) => requested(calls).filter((call) => call === 'POST /oauth/token')

describe('shareRefresh()', () => {
  it('makes one token request for the concurrent server renders of one session, and each takes the new tokens', async () => {
    const { fetch, calls } = simpleOauth()
    const renders = [render(fetch, 'browser-1'), render(fetch, 'browser-1'), render(fetch, 'browser-1')]
    const responses = await Promise.all(renders.map((client) => client.request(ARTICLE)))
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200])
    expect(tokenRequests(calls)).toHaveLength(1)
    for (const client of renders) expect([client.auth.accessToken, client.auth.refreshToken]).toEqual(['access-2', 'refresh-2'])
  })

  it('does not share between different sessions', async () => {
    const { fetch, calls } = simpleOauth()
    const [a, b] = [render(fetch, 'browser-2'), render(fetch, 'browser-3')]
    await Promise.all([a.request(ARTICLE), b.request(ARTICLE)])
    expect(tokenRequests(calls)).toHaveLength(2)
    expect(a.auth.accessToken).not.toBe(b.auth.accessToken)
  })

  it('shares a refresh that just ended within the grace period, and not after it', async () => {
    const now = Date.now()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now)
    const { fetch, calls } = simpleOauth()
    await render(fetch, 'browser-4').request(ARTICLE)
    const later = render(fetch, 'browser-4')
    await later.request(ARTICLE)
    expect(tokenRequests(calls)).toHaveLength(1)
    expect(later.auth.accessToken).toBe('access-2')

    clock.mockReturnValue(now + 5001)
    await render(fetch, 'browser-4').request(ARTICLE)
    expect(tokenRequests(calls)).toHaveLength(2)
  })

  it('shares a refused refresh too, and every render reads on anonymously, signed out', async () => {
    const { fetch, calls } = simpleOauth(400)
    const renders = [render(fetch, 'browser-5'), render(fetch, 'browser-5')]
    const responses = await Promise.all(renders.map((client) => client.request(ARTICLE).catch((error: { response: { status: number } }) => error.response)))
    expect(responses.map((response) => response.status)).toEqual([401, 401])
    expect(tokenRequests(calls)).toHaveLength(1)
    for (const client of renders) expect(client.auth.loggedIn).toBe(false)
    // Each render repeated its read without a token.
    expect(calls.filter((call) => call.method === 'GET').map((call) => call.headers.Authorization))
      .toEqual(['Bearer access-1', 'Bearer access-1', undefined, undefined])
  })
})
