import { hasCredentials, processCache, resetProcessCache, runtime } from '../../src/utils/processCache'

const axios = (common = {}) => ({ defaults: { headers: { common } } })

describe('processCache', () => {
  const { isServer } = runtime
  beforeEach(() => {
    resetProcessCache()
    runtime.isServer = () => true
  })
  afterAll(() => { runtime.isServer = isServer })

  test('hasCredentials', () => {
    expect(hasCredentials(axios())).toBe(false)
    expect(hasCredentials(undefined)).toBe(false)
    expect(hasCredentials(axios({ Authorization: 'Bearer token' }))).toBe(true)
    expect(hasCredentials(axios({ authorization: 'Basic abc' }))).toBe(true)
    expect(hasCredentials(axios({ cookie: 'SESS0123456789abcdef0123456789abcdef=abc' }))).toBe(true)
    expect(hasCredentials(axios({ Cookie: '_ga=1; SSESS0123456789abcdef0123456789abcdef=abc' }))).toBe(true)
    // Analytics and consent cookies are not credentials.
    expect(hasCredentials(axios({ cookie: '_ga=GA1.2.3; cookie-agreed=2' }))).toBe(false)
    expect(hasCredentials({ defaults: { auth: { username: 'a', password: 'b' }, headers: { common: {} } } })).toBe(true)
    // A site can name its own session cookie.
    expect(hasCredentials(axios({ cookie: 'sid=abc' }), 'sid')).toBe(true)
  })

  test('disabled without a ttl or with credentials', () => {
    expect(processCache('index', { axios: axios() })).toBe(null)
    expect(processCache('index', { ttl: 0, axios: axios() })).toBe(null)
    expect(processCache('index', { ttl: 300, axios: axios({ Authorization: 'Bearer token' }) })).toBe(null)
    expect(processCache('index', { ttl: 300, axios: axios() })).not.toBe(null)
  })

  test('shares values between handles in the same scope only', () => {
    const one = processCache('index', { ttl: 300, axios: axios() })
    const two = processCache('index', { ttl: 300, axios: axios() })
    const menu = processCache('menu', { ttl: 300, axios: axios() })
    one.set('key', { a: 1 })
    expect(two.get('key')).toStrictEqual({ a: 1 })
    expect(menu.get('key')).toBe(undefined)
  })

  test('expires entries after the ttl', () => {
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    const cache = processCache('index', { ttl: 300, axios: axios() })
    cache.set('key', 'value')
    now.mockReturnValue(1000 + 299 * 1000)
    expect(cache.get('key')).toBe('value')
    now.mockReturnValue(1000 + 301 * 1000)
    expect(cache.get('key')).toBe(undefined)
    now.mockRestore()
  })

  test('drops a rejected promise so the next caller retries', async () => {
    const cache = processCache('menu', { ttl: 300, axios: axios() })
    const request = Promise.reject(new Error('nope'))
    cache.set('key', request)
    await request.catch(() => {})
    await Promise.resolve()
    await Promise.resolve()
    expect(cache.get('key')).toBe(undefined)
  })
})
