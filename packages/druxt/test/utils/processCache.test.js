import { configHasCredentials, hasCredentials, parseCacheLifetime, processCache, resetProcessCache, runtime, watchCredentials } from '../../src/utils/processCache'

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

  test('parseCacheLifetime reads Cache-Control as a shared cache', () => {
    expect(parseCacheLifetime(undefined)).toBe(0)
    expect(parseCacheLifetime({})).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300' })).toBe(300)
    expect(parseCacheLifetime({ 'Cache-Control': 'public, max-age=300' })).toBe(300)
    // Drupal's default when the page cache max-age is 0.
    expect(parseCacheLifetime({ 'cache-control': 'max-age=0, no-cache, must-revalidate' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'no-cache' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300, no-store' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'private, max-age=300' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public' })).toBe(0)
    // A shared cache prefers s-maxage.
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300, s-maxage=60' })).toBe(60)
    // Time already spent in a cache in front of Drupal is taken off.
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', age: '100' })).toBe(200)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', age: '400' })).toBe(0)
    // A value that is not all digits is not a lifetime, however it starts.
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300abc' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age="300"' })).toBe(0)
  })

  test('refused in a browser or with credentials', () => {
    expect(processCache('index', { axios: axios() })).not.toBe(null)
    expect(processCache('index', { axios: axios({ Authorization: 'Bearer token' }) })).toBe(null)
    runtime.isServer = () => false
    expect(processCache('index', { axios: axios() })).toBe(null)
  })

  test('shares values between handles in the same scope only', () => {
    const one = processCache('index', { axios: axios() })
    const two = processCache('index', { axios: axios() })
    const menu = processCache('menu', { axios: axios() })
    one.set('key', { a: 1 }, 300)
    expect(two.get('key')).toStrictEqual({ a: 1 })
    expect(menu.get('key')).toBe(undefined)
  })

  test('an entry lives for its own lifetime, and a lifetime of 0 stores nothing', () => {
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    const cache = processCache('index', { axios: axios() })
    cache.set('long', 'value', 300)
    cache.set('short', 'value', 60)
    expect(cache.set('none', 'value', 0)).toBe('value')
    expect(cache.get('none')).toBe(undefined)
    // A response that may not be kept also removes what an earlier one stored.
    cache.set('replaced', 'earlier', 300)
    cache.set('replaced', 'later', 0)
    expect(cache.get('replaced')).toBe(undefined)
    now.mockReturnValue(1000 + 61 * 1000)
    expect(cache.get('short')).toBe(undefined)
    expect(cache.get('long')).toBe('value')
    now.mockReturnValue(1000 + 301 * 1000)
    expect(cache.get('long')).toBe(undefined)
    now.mockRestore()
  })

  test('the ttl caps an entry, for the writer and the reader, and never extends one', () => {
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    processCache('index', { axios: axios(), ttl: 60 }).set('capped', 'value', 300)
    processCache('index', { axios: axios(), ttl: 600 }).set('short', 'value', 30)
    processCache('index', { axios: axios() }).set('uncapped', 'value', 300)
    now.mockReturnValue(1000 + 61 * 1000)
    expect(processCache('index', { axios: axios() }).get('capped')).toBe(undefined)
    expect(processCache('index', { axios: axios() }).get('short')).toBe(undefined)
    expect(processCache('index', { axios: axios(), ttl: 60 }).get('uncapped')).toBe(undefined)
    expect(processCache('index', { axios: axios() }).get('uncapped')).toBe('value')
    now.mockRestore()
  })

  test('one cache per process, whichever copy of the module wrote it', () => {
    processCache('index', { axios: axios() }).set('key', 'value', 300)
    let copy
    jest.isolateModules(() => { copy = require('../../src/utils/processCache') })
    copy.runtime.isServer = () => true
    expect(copy.processCache('index', { axios: axios() }).get('key')).toBe('value')
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
    expect(processCache('menu', { axios: instance })).not.toBe(null)

    // A response whose request left without credentials changes nothing.
    const plain = { config: { headers: {} } }
    expect(handlers[0].ok(plain)).toBe(plain)
    expect(processCache('menu', { axios: instance })).not.toBe(null)

    // A token added by an interceptor shows in the config as sent, on success or failure.
    const failed = { config: { headers: { Authorization: 'Bearer token' } } }
    await expect(handlers[0].fail(failed)).rejects.toBe(failed)
    expect(processCache('menu', { axios: instance })).toBe(null)

    // An instance without interceptors is left alone.
    expect(() => watchCredentials({ defaults: {} })).not.toThrow()
  })
})
