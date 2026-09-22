import { configHasCredentials, hasCredentials, processCache, resetProcessCache, runtime, watchCredentials } from '../../src/utils/processCache'

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

  test('the reader ttl applies to an entry written with a longer one', () => {
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    processCache('index', { ttl: 300, axios: axios() }).set('key', 'value')
    now.mockReturnValue(1000 + 61 * 1000)
    expect(processCache('index', { ttl: 60, axios: axios() }).get('key')).toBe(undefined)
    expect(processCache('index', { ttl: 300, axios: axios() }).get('key')).toBe('value')
    now.mockRestore()
  })

  test('configHasCredentials reads the config as sent', () => {
    expect(configHasCredentials(undefined)).toBe(false)
    expect(configHasCredentials({ headers: { Accept: 'application/json' } })).toBe(false)
    expect(configHasCredentials({ headers: { Authorization: 'Bearer token' } })).toBe(true)
    expect(configHasCredentials({ headers: { common: { Authorization: 'Bearer token' } } })).toBe(true)
    expect(configHasCredentials({ headers: { Cookie: 'SESS0123456789abcdef0123456789abcdef=abc' } })).toBe(true)
    expect(configHasCredentials({ auth: { username: 'a', password: 'b' }, headers: {} })).toBe(true)
  })

  test('an instance seen sending credentials is refused from then on', async () => {
    const handlers = []
    const instance = { ...axios(), interceptors: { response: { use: (ok, fail) => handlers.push({ ok, fail }) } } }
    watchCredentials(instance)
    watchCredentials(instance)
    expect(handlers.length).toBe(1)
    expect(processCache('menu', { ttl: 300, axios: instance })).not.toBe(null)

    // A response whose request left without credentials changes nothing.
    const plain = { config: { headers: {} } }
    expect(handlers[0].ok(plain)).toBe(plain)
    expect(processCache('menu', { ttl: 300, axios: instance })).not.toBe(null)

    // A token added by an interceptor shows in the config as sent, on success or failure.
    const failed = { config: { headers: { Authorization: 'Bearer token' } } }
    await expect(handlers[0].fail(failed)).rejects.toBe(failed)
    expect(processCache('menu', { ttl: 300, axios: instance })).toBe(null)

    // An instance without interceptors is left alone.
    expect(() => watchCredentials({ defaults: {} })).not.toThrow()
  })
})
