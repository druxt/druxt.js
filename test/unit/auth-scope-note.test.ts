import { describe, expect, it } from 'vitest'
import { DruxtClient } from '../../packages/client/src'
import { watchScopeRefusals } from '../../packages/core/src/runtime/devel/utils/scope'
import { BASE_URL, drupal, json, requested } from './fake-drupal'

// A signed-in editor whose token carries no roles: Drupal refuses it what it gives an anonymous visitor.
const site = () => drupal({
  'GET /jsonapi/node/page/p1': (call) => (call.headers.Authorization ? json({ errors: [{ status: '403' }] }, 403) : json({ data: { type: 'node--page', id: 'p1' } })),
  'GET /jsonapi/node/page/secret': () => json({ errors: [{ status: '403' }] }, 403),
})

const signedIn = (fetch: ReturnType<typeof drupal>['fetch']) => {
  const client = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'site' } })
  client.auth!.setTokens({ access_token: 'no-roles' })
  return client
}

const settle = () => new Promise((done) => setTimeout(done, 0))

describe('watchScopeRefusals()', () => {
  it('notes a read Drupal refused the signed-in visitor and gives an anonymous one, once per path', async () => {
    const { fetch, calls } = site()
    const client = signedIn(fetch)
    const noted: string[] = []
    watchScopeRefusals(client, (path) => noted.push(path))
    await client.request('/jsonapi/node/page/p1', { validateStatus: () => true })
    await client.request('/jsonapi/node/page/p1', { validateStatus: () => true })
    await settle()
    expect(noted).toEqual(['/jsonapi/node/page/p1'])
    // One anonymous probe, never repeated.
    expect(requested(calls)).toEqual(['GET /jsonapi/node/page/p1', 'GET /jsonapi/node/page/p1', 'GET /jsonapi/node/page/p1'])
    expect(calls.filter((call) => !call.headers.Authorization)).toHaveLength(1)
  })

  it('notes nothing for a read refused to anonymous too, or for a visitor who is not signed in', async () => {
    const { fetch } = site()
    const client = signedIn(fetch)
    const noted: string[] = []
    watchScopeRefusals(client, (path) => noted.push(path))
    await client.request('/jsonapi/node/page/secret', { validateStatus: () => true })
    const anonymous = new DruxtClient(BASE_URL, { fetch, auth: { clientId: 'site' } })
    watchScopeRefusals(anonymous, (path) => noted.push(path))
    await anonymous.request('/jsonapi/node/page/secret', { validateStatus: () => true })
    await settle()
    expect(noted).toEqual([])
  })
})
