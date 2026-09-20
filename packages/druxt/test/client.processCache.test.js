import mockAxios from 'jest-mock-axios'
import { DruxtClient } from '../src'
import { resetProcessCache, runtime } from '../src/utils/processCache'

const baseUrl = 'https://demo-api.druxtjs.org'
jest.mock('axios')

// Each server request gets its own Axios instance from @nuxtjs/axios.
let calls = 0
const requestAxios = (common = {}) => {
  const instance = jest.fn()
  instance.defaults = { headers: { common } }
  instance.get = jest.fn(async () => {
    calls += 1
    return { data: { links: { 'node--page': { href: `${baseUrl}/jsonapi/node/page` } } } }
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
    await new DruxtClient(baseUrl, { axios: requestAxios(), cache: { ttl: 300 } }).getIndex()
    await new DruxtClient(baseUrl, { axios: requestAxios(), cache: { ttl: 300 } }).getIndex()
    expect(indexCalls()).toBe(2)
  })

  test('the index survives between requests without credentials', async () => {
    const first = new DruxtClient(baseUrl, { axios: requestAxios(), cache: { ttl: 300 } })
    await first.getIndex()
    expect(indexCalls()).toBe(1)

    const second = new DruxtClient(baseUrl, { axios: requestAxios({ cookie: '_ga=GA1.2.3' }), cache: { ttl: 300 } })
    const index = await second.getIndex()
    expect(indexCalls()).toBe(1)
    expect(Object.keys(index).length).toBeGreaterThan(0)
  })

  test('a request with credentials neither reads nor fills the shared index', async () => {
    const user = new DruxtClient(baseUrl, { axios: requestAxios({ Authorization: 'Bearer token' }), cache: { ttl: 300 } })
    await user.getIndex()
    expect(indexCalls()).toBe(1)

    const anonymous = new DruxtClient(baseUrl, { axios: requestAxios(), cache: { ttl: 300 } })
    await anonymous.getIndex()
    expect(indexCalls()).toBe(2)

    const session = new DruxtClient(baseUrl, { axios: requestAxios({ cookie: 'SESS0123456789abcdef0123456789abcdef=abc' }), cache: { ttl: 300 } })
    await session.getIndex()
    expect(indexCalls()).toBe(3)
  })

  test('off by default, and per backend', async () => {
    await new DruxtClient(baseUrl, { axios: requestAxios() }).getIndex()
    await new DruxtClient(baseUrl, { axios: requestAxios() }).getIndex()
    expect(indexCalls()).toBe(2)

    await new DruxtClient(baseUrl, { axios: requestAxios(), cache: { ttl: 300 } }).getIndex()
    await new DruxtClient('https://other.example', { axios: requestAxios(), cache: { ttl: 300 } }).getIndex()
    expect(indexCalls()).toBe(4)
  })
})
