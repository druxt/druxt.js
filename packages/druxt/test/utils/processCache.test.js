import { byteSize, configHasCredentials, hasCredentials, parseCacheLifetime, processCache, resetProcessCache, runtime, watchCredentials } from '../../src/utils/processCache'

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
    // What Drupal forces on every response to a signed-in request, whatever the max-age.
    expect(parseCacheLifetime({ 'cache-control': 'no-cache, must-revalidate' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'no-cache' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300, no-store' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'private, max-age=300' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public' })).toBe(0)
    // A shared cache prefers s-maxage.
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300, s-maxage=60' })).toBe(60)
    // Time already spent in a cache in front of Drupal is taken off.
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', age: '100' })).toBe(200)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', age: '400' })).toBe(0)
    // The Date header is not an age: Drupal's page cache serves a stored
    // response with its original Date and no Age, for as long as it holds it.
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(Date.parse('Sun, 27 Sep 2026 10:00:00 GMT'))
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', date: 'Sun, 27 Sep 2026 09:00:00 GMT' })).toBe(300)
    now.mockRestore()
    // A value that is not all digits is not a lifetime, however it starts.
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300abc' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age="300"' })).toBe(0)
    // An s-maxage that is present but unusable makes the response stale for a shared cache.
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300, s-maxage=invalid' })).toBe(0)
    // Drupal varies every cacheable response on Cookie, which the credentials gate
    // already accounts for. A variation on anything else cannot be told apart.
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', vary: 'Cookie' })).toBe(300)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', Vary: 'Cookie, Accept-Encoding' })).toBe(300)
    // A Druxt backend's consumers module varies every response by X-Consumer-ID.
    expect(parseCacheLifetime({ 'cache-control': 'max-age=300, public', vary: 'Cookie, X-Consumer-ID' })).toBe(300)
    // Drupal's CORS adds Origin to every response while it is on; the site's server never sends one.
    expect(parseCacheLifetime({ 'cache-control': 'max-age=300, public', vary: 'Cookie, Accept-Encoding, Origin' })).toBe(300)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', vary: 'Accept-Language' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', vary: 'Cookie, Accept-Language' })).toBe(0)
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', vary: '*' })).toBe(0)
    // A header present under two spellings of its name is read as one list.
    expect(parseCacheLifetime({ 'cache-control': 'public, max-age=300', vary: 'Cookie', Vary: 'Accept-Language' })).toBe(0)
  })

  test('refused in a browser or with credentials', () => {
    expect(processCache('index', { axios: axios() })).not.toBe(null)
    expect(processCache('index', { axios: axios({ Authorization: 'Bearer token' }) })).toBe(null)
    runtime.isServer = () => false
    expect(processCache('index', { axios: axios() })).toBe(null)
  })

  test('refused to an instance that sends an Origin', async () => {
    // Drupal varies by Origin, and the key doesn't hold one, so a client sending one would share the no-origin entries.
    expect(processCache('index', { axios: axios({ Origin: 'https://example.com' }) })).toBe(null)
    expect(processCache('index', { axios: { defaults: { headers: { get: { origin: 'https://example.com' } } } } })).toBe(null)
    expect(configHasCredentials({ headers: { Origin: 'https://example.com' } })).toBe(true)

    // One added by an interceptor shows in the config as sent.
    const handlers = []
    const instance = { ...axios(), interceptors: { response: { use: (ok, fail) => handlers.push({ ok, fail }) } } }
    watchCredentials(instance)
    handlers[0].ok({ config: { headers: { Origin: 'https://example.com' } } })
    expect(processCache('index', { axios: instance })).toBe(null)
  })

  test('shares values between handles in the same scope only', () => {
    const one = processCache('index', { axios: axios() })
    const two = processCache('index', { axios: axios() })
    const menu = processCache('menu', { axios: axios() })
    one.set('key', { a: 1 }, 300)
    expect(two.get('key')).toStrictEqual({ a: 1 })
    expect(menu.get('key')).toBe(undefined)
  })

  test('a client sending X-Consumer-ID keeps entries of its own', () => {
    const one = processCache('index', { axios: axios({ 'X-Consumer-ID': 'one' }) })
    const same = processCache('index', { axios: axios({ 'x-consumer-id': 'one' }) })
    const two = processCache('index', { axios: axios({ 'X-Consumer-ID': 'two' }) })
    const none = processCache('index', { axios: axios() })
    one.set('key', 'for one', 300)
    expect(same.get('key')).toBe('for one')
    expect(two.get('key')).toBe(undefined)
    expect(none.get('key')).toBe(undefined)
    // A header set for GET requests alone counts the same way.
    processCache('index', { axios: { defaults: { headers: { get: { 'X-Consumer-ID': 'two' } } } } }).set('key', 'for two', 300)
    expect(two.get('key')).toBe('for two')
    // Emptying the scope empties every consumer's entries in it.
    resetProcessCache('index')
    expect(processCache('index', { axios: axios({ 'X-Consumer-ID': 'one' }) }).get('key')).toBe(undefined)
    expect(processCache('index', { axios: axios({ 'X-Consumer-ID': 'two' }) }).get('key')).toBe(undefined)
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

  test('a ttl of 0 keeps nothing and reads nothing', () => {
    processCache('index', { axios: axios(), ttl: 0 }).set('key', 'value', 300)
    expect(processCache('index', { axios: axios() }).get('key')).toBe(undefined)
    processCache('index', { axios: axios() }).set('key', 'value', 300)
    expect(processCache('index', { axios: axios(), ttl: 0 }).get('key')).toBe(undefined)
    expect(processCache('index', { axios: axios() }).get('key')).toBe('value')
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

    // The generation is shared, so a clear through the copy refuses an older handle's write.
    const before = processCache('index', { axios: axios() })
    copy.resetProcessCache()
    processCache('index', { axios: axios() }).set('later', 'fetched before the clear', 300, before.generation)
    expect(processCache('index', { axios: axios() }).get('later')).toBe(undefined)
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

  test('a value fetched before a clear is not stored after it', () => {
    const before = processCache('menu')
    const since = before.generation

    // The clear lands while the request is in flight.
    resetProcessCache()
    const after = processCache('menu')
    expect(after.generation).not.toBe(since)

    after.set('key', 'fetched before the clear', 300, since)
    expect(after.get('key')).toBeUndefined()

    // A value fetched after it is stored, and a caller that reports no
    // generation is stored as before.
    after.set('key', 'fetched after the clear', 300, after.generation)
    expect(after.get('key')).toBe('fetched after the clear')
    after.set('other', 'no generation reported', 300)
    expect(after.get('other')).toBe('no generation reported')
  })

  test('a shared instance is watched for every session cookie registered on it', () => {
    const handlers = []
    const instance = { ...axios(), interceptors: { response: { use: (ok, fail) => handlers.push({ ok, fail }) } } }

    // Each client sharing the instance registers its own session cookie name.
    watchCredentials(instance, 'FIRST[0-9a-f]+')
    watchCredentials(instance, 'SECOND[0-9a-f]+')
    expect(handlers.length).toBe(1)
    expect(processCache('menu', { axios: instance })).not.toBe(null)

    // A cookie only the second client would recognise still refuses the cache.
    const response = { config: { headers: { cookie: 'SECOND0f=1' } } }
    expect(handlers[0].ok(response)).toBe(response)
    expect(processCache('menu', { axios: instance })).toBe(null)
  })

  // Each value below is a string, which counts as its length against maxSize.
  test('a scope keeps at most maxSize, dropping the least recently used', () => {
    const cache = processCache('bounded', { axios: axios(), maxSize: 8 })
    cache.set('a', 'aaaa', 60)
    cache.set('b', 'bbbb', 60)
    // Reading a makes b the oldest.
    expect(cache.get('a')).toBe('aaaa')
    cache.set('c', 'cccc', 60)
    expect(cache.get('b')).toBe(undefined)
    expect(cache.get('a')).toBe('aaaa')
    expect(cache.get('c')).toBe('cccc')

    // Writing a key again replaces its size rather than adding to it.
    cache.set('a', 'aa', 60)
    cache.set('d', 'dd', 60)
    expect(cache.get('a')).toBe('aa')
    expect(cache.get('c')).toBe('cccc')
    expect(cache.get('d')).toBe('dd')

    // One large value pushes out as many older ones as it needs.
    cache.set('e', 'eeeeeeee', 60)
    expect([cache.get('a'), cache.get('c'), cache.get('d')]).toStrictEqual([undefined, undefined, undefined])
    expect(cache.get('e')).toBe('eeeeeeee')
  })

  test('a value larger than maxSize is not stored and leaves the scope as it was', () => {
    const cache = processCache('bounded', { axios: axios(), maxSize: 4 })
    cache.set('a', 'aaaa', 60)
    cache.set('big', 'bbbbb', 60)
    expect(cache.get('big')).toBe(undefined)
    expect(cache.get('a')).toBe('aaaa')
  })

  test('values are measured by their JSON unless sizeOf is given', () => {
    const json = processCache('bounded', { axios: axios(), maxSize: 10 })
    // {"n":1} is 7 characters, so a second one does not fit beside it.
    json.set('a', { n: 1 }, 60)
    json.set('b', { n: 2 }, 60)
    expect(json.get('a')).toBe(undefined)
    expect(json.get('b')).toStrictEqual({ n: 2 })

    resetProcessCache()
    const measured = processCache('bounded', { axios: axios(), maxSize: 10, sizeOf: (value) => value.size })
    measured.set('a', { size: 5 }, 60)
    measured.set('b', { size: 5 }, 60)
    expect(measured.get('a')).toStrictEqual({ size: 5 })
    expect(measured.get('b')).toStrictEqual({ size: 5 })
  })

  test('expired entries go before live ones when a scope is full', () => {
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    const cache = processCache('bounded', { axios: axios(), maxSize: 8 })
    cache.set('live', 'llll', 600)
    cache.set('short', 'ssss', 10)
    now.mockReturnValue(1000 + 20 * 1000)
    // The oldest entry is live, the newer one has expired, so the expired one goes.
    cache.set('new', 'nnnn', 600)
    expect(cache.get('live')).toBe('llll')
    expect(cache.get('new')).toBe('nnnn')
    now.mockRestore()
  })

  test('an expired entry is removed when it is read, and its size with it', () => {
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    const cache = processCache('bounded', { axios: axios(), maxSize: 8 })
    cache.set('a', 'aaaa', 10)
    cache.set('b', 'bbbb', 600)
    now.mockReturnValue(1000 + 11 * 1000)
    expect(cache.get('a')).toBe(undefined)
    // The room a held is free again, so a later entry is stored without evicting b.
    cache.set('c', 'cccc', 600)
    expect(cache.get('b')).toBe('bbbb')
    expect(cache.get('c')).toBe('cccc')
    now.mockRestore()
  })

  test('sizes are UTF-8 bytes', () => {
    expect([byteSize(''), byteSize('a'), byteSize('é'), byteSize('€'), byteSize('😀')]).toStrictEqual([0, 1, 2, 3, 4])
    expect(byteSize('a€😀é')).toBe(Buffer.byteLength('a€😀é'))

    // 'éé' is four bytes, so it fills a limit of four, and 'ééé' does not fit.
    const cache = processCache('bounded', { axios: axios(), maxSize: 4 })
    cache.set('a', 'éé', 60)
    expect(cache.get('a')).toBe('éé')
    cache.set('b', 'ééé', 60)
    expect(cache.get('b')).toBe(undefined)
    expect(cache.get('a')).toBe('éé')
  })

  test('a value JSON cannot hold is kept and counts for nothing', () => {
    const cache = processCache('bounded', { axios: axios(), maxSize: 4 })
    const circular = {}
    circular.self = circular
    const handler = () => {}
    cache.set('circular', circular, 60)
    // JSON.stringify gives undefined for a function.
    cache.set('handler', handler, 60)
    cache.set('a', 'aaaa', 60)
    expect(cache.get('circular')).toBe(circular)
    expect(cache.get('handler')).toBe(handler)
    expect(cache.get('a')).toBe('aaaa')
  })

  test('without maxSize a scope is unbounded', () => {
    const cache = processCache('unbounded', { axios: axios() })
    for (let i = 0; i < 50; i++) cache.set(String(i), 'x'.repeat(1000), 60)
    expect(cache.get('0')).toBe('x'.repeat(1000))
    expect(cache.get('49')).toBe('x'.repeat(1000))
  })

  test('a clear empties the sizes with the entries', () => {
    const cache = () => processCache('bounded', { axios: axios(), maxSize: 8 })
    cache().set('a', 'aaaaaaaa', 60)
    resetProcessCache()
    cache().set('b', 'bbbbbbbb', 60)
    expect(cache().get('b')).toBe('bbbbbbbb')
  })
})
