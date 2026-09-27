import mockAxios from 'jest-mock-axios'
import { DruxtClient } from '../src'
import { resetProcessCache, runtime } from '../src/utils/processCache'

const baseUrl = 'https://demo-api.druxtjs.org'
jest.mock('axios')

// Each server request gets its own Axios instance from @nuxtjs/axios.
let calls = 0
// `sent` is what a request interceptor adds on the way out, which the defaults never show.
const requestAxios = (common = {}, sent = {}, headers = { 'cache-control': 'public, max-age=300' }) => {
  const instance = jest.fn()
  const handlers = []
  instance.defaults = { headers: { common } }
  instance.interceptors = { response: { use: (ok) => handlers.push(ok) } }
  instance.get = jest.fn(async () => {
    calls += 1
    const response = { config: { headers: { ...common, ...sent } }, headers, data: { links: { 'node--page': { href: `${baseUrl}/jsonapi/node/page` } } } }
    return handlers.reduce((result, handler) => handler(result), response)
  })
  return instance
}
const indexCalls = () => calls

describe('DruxtClient process cache', () => {
  const { isServer } = runtime
  beforeEach(() => {
    mockAxios.reset()
    resetProcessCache()
    calls = 0
    runtime.isServer = () => true
  })
  afterAll(() => { runtime.isServer = isServer })

  test('never used in a browser', async () => {
    runtime.isServer = () => false
    await new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} }).getIndex()
    await new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} }).getIndex()
    expect(indexCalls()).toBe(2)
  })

  test('the index survives between requests without credentials', async () => {
    const first = new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} })
    await first.getIndex()
    expect(indexCalls()).toBe(1)

    const second = new DruxtClient(baseUrl, { axios: requestAxios({ cookie: '_ga=GA1.2.3' }), cache: {} })
    const index = await second.getIndex()
    expect(indexCalls()).toBe(1)
    expect(Object.keys(index).length).toBeGreaterThan(0)
  })

  test('a request with credentials neither reads nor fills the shared index', async () => {
    const user = new DruxtClient(baseUrl, { axios: requestAxios({ Authorization: 'Bearer token' }), cache: {} })
    await user.getIndex()
    expect(indexCalls()).toBe(1)

    const anonymous = new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} })
    await anonymous.getIndex()
    expect(indexCalls()).toBe(2)

    const session = new DruxtClient(baseUrl, { axios: requestAxios({ cookie: 'SESS0123456789abcdef0123456789abcdef=abc' }), cache: {} })
    await session.getIndex()
    expect(indexCalls()).toBe(3)
  })

  test('credentials added by an interceptor keep the response out of the cache', async () => {
    const user = new DruxtClient(baseUrl, { axios: requestAxios({}, { Authorization: 'Bearer token' }), cache: {} })
    await user.getIndex()
    expect(indexCalls()).toBe(1)

    await new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} }).getIndex()
    expect(indexCalls()).toBe(2)

    // The anonymous response above was stored, so the next one is served from it.
    await new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} }).getIndex()
    expect(indexCalls()).toBe(2)
  })

  test('off by default, and per backend', async () => {
    await new DruxtClient(baseUrl, { axios: requestAxios() }).getIndex()
    await new DruxtClient(baseUrl, { axios: requestAxios() }).getIndex()
    expect(indexCalls()).toBe(2)

    await new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} }).getIndex()
    await new DruxtClient('https://other.example', { axios: requestAxios(), cache: {} }).getIndex()
    expect(indexCalls()).toBe(4)
  })

  test('follows the Cache-Control Drupal sent', async () => {
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(1000)

    // Drupal's default, and a response with no header, are never stored.
    for (const headers of [{ 'cache-control': 'max-age=0, no-cache, must-revalidate' }, {}]) {
      resetProcessCache()
      calls = 0
      await new DruxtClient(baseUrl, { axios: requestAxios({}, {}, headers), cache: {} }).getIndex()
      await new DruxtClient(baseUrl, { axios: requestAxios({}, {}, headers), cache: {} }).getIndex()
      expect(indexCalls()).toBe(2)
    }

    // A max-age is honoured, and a ttl only shortens it.
    resetProcessCache()
    calls = 0
    const allowed = { 'cache-control': 'public, max-age=60' }
    await new DruxtClient(baseUrl, { axios: requestAxios({}, {}, allowed), cache: { ttl: 600 } }).getIndex()
    now.mockReturnValue(1000 + 59 * 1000)
    await new DruxtClient(baseUrl, { axios: requestAxios({}, {}, allowed), cache: { ttl: 600 } }).getIndex()
    expect(indexCalls()).toBe(1)
    now.mockReturnValue(1000 + 61 * 1000)
    await new DruxtClient(baseUrl, { axios: requestAxios({}, {}, allowed), cache: { ttl: 600 } }).getIndex()
    expect(indexCalls()).toBe(2)

    now.mockRestore()
  })

  test('the lifetime read later is what is left of it', async () => {
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    const client = new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} })
    const { data } = await client.get('/jsonapi')
    expect(client.cacheLifetime(data)).toBe(300)
    now.mockReturnValue(1000 + 100 * 1000)
    expect(client.cacheLifetime(data)).toBe(200)
    now.mockReturnValue(1000 + 400 * 1000)
    expect(client.cacheLifetime(data)).toBe(0)
    now.mockRestore()
  })

  test('the merged index lives no longer than the resource config response allows', async () => {
    // The index says 300 seconds, the resource config it is decorated with says no-store.
    const configHref = `${baseUrl}/jsonapi/jsonapi_resource_config/jsonapi_resource_config`
    const configured = () => {
      const instance = requestAxios()
      const get = instance.get
      instance.get = jest.fn(async (url, options) => {
        if (url === configHref) {
          calls += 1
          return { config: { headers: {} }, headers: { 'cache-control': 'no-store' }, data: { data: [{ attributes: { drupal_internal__id: 'node--page', resourceType: 'node--page', resourceFields: {} } }] } }
        }
        const response = await get(url, options)
        response.data.links['jsonapi_resource_config--jsonapi_resource_config'] = { href: configHref }
        return response
      })
      return instance
    }
    await new DruxtClient(baseUrl, { axios: configured(), cache: {} }).getIndex()
    expect(indexCalls()).toBe(2)

    // Nothing was stored, so the next request fetches both again.
    await new DruxtClient(baseUrl, { axios: configured(), cache: {} }).getIndex()
    expect(indexCalls()).toBe(4)
  })

  test('cacheLifetime reads the lifetime of a document the client fetched', async () => {
    const client = new DruxtClient(baseUrl, { axios: requestAxios({}, {}, { 'cache-control': 'public, max-age=120' }) })
    const { data } = await client.get('/jsonapi')
    expect(client.cacheLifetime(data)).toBe(120)
    expect(client.cacheLifetime({})).toBe(0)
    expect(client.cacheLifetime(false)).toBe(0)
  })

  test('an index fetched before a clear is not stored after it', async () => {
    // The cache is cleared while the index request is in flight, as it is when
    // Drupal calls the clear endpoint because the content changed.
    const axios = requestAxios()
    const inFlight = axios.get
    axios.get = jest.fn(async (...args) => {
      const response = await inFlight(...args)
      resetProcessCache()
      return response
    })
    await new DruxtClient(baseUrl, { axios, cache: {} }).getIndex()
    expect(indexCalls()).toBe(1)

    // The pre-clear index must not be readable, so the next request fetches.
    await new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} }).getIndex()
    expect(indexCalls()).toBe(2)
  })

  test('clearCache empties the index and the process cache', async () => {
    const client = new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} })
    await client.getIndex()
    expect(indexCalls()).toBe(1)
    expect(client.cacheGeneration).toBe(0)

    client.clearCache()
    expect(client.cacheGeneration).toBe(1)
    await client.getIndex()
    expect(indexCalls()).toBe(2)

    // Another request's client finds the process cache empty too.
    client.clearCache()
    await new DruxtClient(baseUrl, { axios: requestAxios(), cache: {} }).getIndex()
    expect(indexCalls()).toBe(3)
  })
})
