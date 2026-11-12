import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { byteSize, forgetProcessCache, headersHaveCredentials, lifetimeLeft, nextRequest, parseCacheLifetime, processCache, processCacheGeneration, rememberLifetime, resetProcessCache } from '../../packages/client/src/processCache'
import { DruxtClient } from '../../packages/client/src'
import { BASE_URL, drupal, json } from './fake-drupal'

afterEach(() => {
  vi.useRealTimers()
})

describe('parseCacheLifetime()', () => {
  const headers = (value: string, age?: string) => new Headers({ 'Cache-Control': value, ...(age ? { Age: age } : {}) })

  it('reads max-age, prefers s-maxage, and takes the Age off', () => {
    expect(parseCacheLifetime(headers('max-age=300'))).toBe(300)
    expect(parseCacheLifetime(headers('max-age=300, s-maxage=60'))).toBe(60)
    expect(parseCacheLifetime(headers('max-age=300', '100'))).toBe(200)
  })

  it('keeps a response Drupal varies by Origin, Cookie, X-Consumer-ID or Accept-Encoding, and refuses one varied by any other header', () => {
    const vary = (value: string) => new Headers({ 'Cache-Control': 'public, max-age=300', Vary: value })
    // Drupal's CORS names Origin on every response while it is on, and the site's server sends none.
    expect(parseCacheLifetime(vary('Cookie, X-Consumer-ID, Origin'))).toBe(300)
    expect(parseCacheLifetime(vary('Accept-Encoding'))).toBe(300)
    expect(parseCacheLifetime(vary('Accept-Language'))).toBe(0)
    expect(parseCacheLifetime(vary('Cookie, Authorization'))).toBe(0)
  })

  it('forbids storing for private, no-store, no-cache and no directive', () => {
    for (const value of ['private, max-age=300', 'no-store', 'no-cache, max-age=300', '']) {
      expect(parseCacheLifetime(headers(value))).toBe(0)
    }
    expect(parseCacheLifetime(undefined)).toBe(0)
  })
})

describe('rememberLifetime() and lifetimeLeft()', () => {
  it('remembers a document\'s lifetime from its arrival, and counts it down', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-17T00:00:00Z'))
    const document = { data: [] }
    rememberLifetime(document, new Headers({ 'Cache-Control': 'max-age=300' }))
    expect(lifetimeLeft(document)).toBe(300)
    vi.setSystemTime(new Date('2026-10-17T00:02:00Z'))
    expect(lifetimeLeft(document)).toBe(180)
    vi.setSystemTime(new Date('2026-10-17T00:10:00Z'))
    expect(lifetimeLeft(document)).toBe(0)
  })

  it('is 0 for a document it never saw, or that is not an object', () => {
    expect(lifetimeLeft({ data: [] })).toBe(0)
    expect(lifetimeLeft(null)).toBe(0)
    expect(lifetimeLeft('text')).toBe(0)
    rememberLifetime('text', new Headers({ 'Cache-Control': 'max-age=300' }))
    expect(lifetimeLeft('text')).toBe(0)
  })
})

describe('processCacheGeneration()', () => {
  it('moves on when resetProcessCache() empties the cache', () => {
    const before = processCacheGeneration()
    resetProcessCache()
    expect(processCacheGeneration()).toBe(before + 1)
  })
})

describe('headersHaveCredentials()', () => {
  it('sees a Bearer Authorization header and a session Cookie header', () => {
    expect(headersHaveCredentials({ Authorization: 'Bearer token' })).toBe(true)
    expect(headersHaveCredentials(new Headers({ Cookie: 'SSESS0123abcd=value' }))).toBe(true)
    expect(headersHaveCredentials({ Cookie: 'theme=dark' })).toBe(false)
  })

  it('counts an Origin, which Drupal varies by and the cache key holds none of', () => {
    expect(headersHaveCredentials({ Origin: 'https://example.com' })).toBe(true)
    expect(headersHaveCredentials(new Headers({ origin: 'https://example.com' }))).toBe(true)
  })

  it('reads an array value as the header it joins into', () => {
    // A header object such as Node's takes an array for a value.
    expect(headersHaveCredentials({ Origin: ['https://example.com'] })).toBe(true)
    expect(headersHaveCredentials({ Authorization: ['Bearer token'] })).toBe(true)
    expect(headersHaveCredentials({ Cookie: ['_ga=1', 'SESS0123456789abcdef0123456789abcdef=abc'] })).toBe(true)
    expect(headersHaveCredentials({ Origin: [] })).toBe(false)
  })

  it('refused to an instance that sends an Origin', async () => {
    // Drupal varies by Origin, and the key doesn't hold one, so a client sending one would share the no-origin entries.
    expect(new DruxtClient(BASE_URL, { cache: {}, headers: { Origin: 'https://example.com' } }).processCache('index')).toBeUndefined()
    expect(new DruxtClient(BASE_URL, { cache: {}, headers: { Origin: ['https://example.com'] as unknown as string } }).processCache('index')).toBeUndefined()
    // One added to a single request withholds the cache from the client after it.
    const client = new DruxtClient(BASE_URL, { cache: {}, fetch: drupal({ 'GET /file': () => json({}) }).fetch })
    await client.request('/file', { headers: { Origin: 'https://example.com' } })
    expect(client.processCache('index')).toBeUndefined()
  })
})

describe('the bounded process cache', () => {
  const handle = (options: Record<string, unknown> = {}) => processCache('test', { maxSize: 100, sizeOf: (value) => String(value).length, ...options })!
  beforeEach(() => resetProcessCache())

  it('keeps a scope within maxSize: expired entries go first, then the least recently used', () => {
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    const cache = handle()
    cache.set('a', 'x'.repeat(40), 1)
    cache.set('b', 'x'.repeat(40), 300)
    // Reading a moves it to the most recently used end.
    expect(cache.get('a')).toBeDefined()
    now.mockReturnValue(1500)
    cache.set('c', 'x'.repeat(40), 300)
    // a, b and c are 120 bytes and none has expired yet, so the least recently used goes: b, as a was read after it.
    expect([cache.get('a'), cache.get('b'), cache.get('c')].map((value) => !!value)).toEqual([true, false, true])
    // Past its lifetime a is gone whatever the size, so an expired entry is evicted before a live one.
    now.mockReturnValue(1000)
    const second = handle()
    second.set('a', 'x'.repeat(40), 1)
    second.set('b', 'x'.repeat(40), 300)
    now.mockReturnValue(2500)
    second.set('c', 'x'.repeat(40), 300)
    expect([second.get('a'), second.get('b'), second.get('c')].map((value) => !!value)).toEqual([false, true, true])
    now.mockRestore()
  })

  it('never stores a value larger than the whole limit, and an unbounded scope keeps everything', () => {
    const cache = handle()
    cache.set('big', 'x'.repeat(101), 300)
    expect(cache.get('big')).toBeUndefined()
    const unbounded = processCache('free', { sizeOf: (value) => String(value).length })!
    for (let i = 0; i < 20; i++) unbounded.set(`k${i}`, 'x'.repeat(1000), 300)
    expect(unbounded.get('k0')).toBeDefined()
  })

  it('forgets the entries a test names, for every consumer, without moving the generation', () => {
    const anonymous = processCache('content')!
    const consumer = processCache('content', { consumer: 'abc' })!
    anonymous.set('["a","/jsonapi/node/page/1"]', 'one', 300)
    anonymous.set('["a","/jsonapi/node/page/2"]', 'two', 300)
    consumer.set('["a","/jsonapi/node/page/1"]', 'one', 300)
    const before = anonymous.generation
    expect(forgetProcessCache('content', (key) => key.includes('/page/1'))).toBe(2)
    expect(anonymous.get('["a","/jsonapi/node/page/1"]')).toBeUndefined()
    expect(anonymous.get('["a","/jsonapi/node/page/2"]')).toBe('two')
    expect(consumer.get('["a","/jsonapi/node/page/1"]')).toBeUndefined()
    expect(processCache('content')!.generation).toBe(before)
  })

  it('refuses a value started before the last forget, and stores one started after', () => {
    const cache = processCache('content')!
    const before = nextRequest()
    forgetProcessCache('content', () => true)
    cache.set('stale', 'old', 300, undefined, before)
    expect(cache.get('stale')).toBeUndefined()
    const after = nextRequest()
    cache.set('fresh', 'new', 300, undefined, after)
    expect(cache.get('fresh')).toBe('new')
    // A forget of another scope says nothing about this one.
    const other = nextRequest()
    forgetProcessCache('menu', () => true)
    cache.set('other', 'kept', 300, undefined, other)
    expect(cache.get('other')).toBe('kept')
  })

  it('numbers requests in the order they start, and measures text in UTF-8 bytes', () => {
    const first = nextRequest()
    expect(nextRequest()).toBe(first + 1)
    expect(byteSize('abc')).toBe(3)
    expect(byteSize('é')).toBe(2)
    expect(byteSize('€')).toBe(3)
    expect(byteSize('😀')).toBe(4)
  })

  it('counts Druxt\'s token cookie as credentials, with Drupal\'s session cookie', () => {
    expect(headersHaveCredentials({ cookie: 'druxt.auth.access_token=abc' })).toBe(true)
    expect(headersHaveCredentials({ cookie: 'druxt.auth.session=1700000000' })).toBe(false)
    expect(headersHaveCredentials({ cookie: 'SESS0123456789abcdef0123456789abcdef=abc' })).toBe(true)
  })

  it('counts Druxt\'s token cookies whatever the site\'s session cookie pattern', () => {
    expect(headersHaveCredentials({ cookie: 'druxt.auth.access_token=abc' }, 'site_session_[a-f0-9]+')).toBe(true)
    expect(headersHaveCredentials({ cookie: 'theme=dark; druxt.auth.refresh_token=abc' }, 'site_session_[a-f0-9]+')).toBe(true)
    expect(headersHaveCredentials({ cookie: 'site_session_abc=1' }, 'site_session_[a-f0-9]+')).toBe(true)
    // The custom pattern replaces Drupal's default session cookie name, and the session marker is no credential.
    expect(headersHaveCredentials({ cookie: 'SESS0123456789abcdef=abc' }, 'site_session_[a-f0-9]+')).toBe(false)
    expect(headersHaveCredentials({ cookie: 'druxt.auth.session=1700000000' }, 'site_session_[a-f0-9]+')).toBe(false)
  })
})

describe('the process cache handle', () => {
  beforeEach(() => resetProcessCache())

  it('keeps nothing and reads nothing with a ttl of 0', () => {
    processCache('index', { ttl: 0 })!.set('key', 'value', 300)
    expect(processCache('index')!.get('key')).toBeUndefined()
    processCache('index')!.set('key', 'value', 300)
    expect(processCache('index', { ttl: 0 })!.get('key')).toBeUndefined()
    expect(processCache('index')!.get('key')).toBe('value')
  })

  it('caps an entry by the ttl, for the writer and the reader, and never extends one', () => {
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    processCache('index', { ttl: 60 })!.set('capped', 'value', 300)
    processCache('index', { ttl: 600 })!.set('short', 'value', 30)
    processCache('index')!.set('uncapped', 'value', 300)
    now.mockReturnValue(1000 + 61 * 1000)
    expect(processCache('index')!.get('capped')).toBeUndefined()
    expect(processCache('index')!.get('short')).toBeUndefined()
    expect(processCache('index', { ttl: 60 })!.get('uncapped')).toBeUndefined()
    expect(processCache('index')!.get('uncapped')).toBe('value')
    now.mockRestore()
  })

  it('is one cache per process, whichever copy of the module wrote it', async () => {
    processCache('index')!.set('key', 'value', 300)
    vi.resetModules()
    const copy = await import('../../packages/client/src/processCache')
    expect(copy.processCache).not.toBe(processCache)
    expect(copy.processCache('index')!.get('key')).toBe('value')
    // The generation is shared, so a clear through the copy refuses an older handle's write.
    const before = processCache('index')!
    copy.resetProcessCache()
    processCache('index')!.set('later', 'fetched before the clear', 300, before.generation)
    expect(processCache('index')!.get('later')).toBeUndefined()
  })

  it('measures values by their JSON unless sizeOf is given', () => {
    const json = processCache('bounded', { maxSize: 10 })!
    // {"n":1} is 7 bytes, so a second one does not fit beside it.
    json.set('a', { n: 1 }, 60)
    json.set('b', { n: 2 }, 60)
    expect(json.get('a')).toBeUndefined()
    expect(json.get('b')).toEqual({ n: 2 })
    resetProcessCache()
    const measured = processCache('bounded', { maxSize: 10, sizeOf: (value) => (value as { size: number }).size })!
    measured.set('a', { size: 5 }, 60)
    measured.set('b', { size: 5 }, 60)
    expect(measured.get('a')).toEqual({ size: 5 })
    expect(measured.get('b')).toEqual({ size: 5 })
  })

  it('removes an expired entry when it is read, and its size with it', () => {
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    const cache = processCache('bounded', { maxSize: 8 })!
    cache.set('a', 'aaaa', 10)
    cache.set('b', 'bbbb', 600)
    now.mockReturnValue(1000 + 11 * 1000)
    expect(cache.get('a')).toBeUndefined()
    // The room a held is free again, so a later entry is stored without evicting b.
    cache.set('c', 'cccc', 600)
    expect(cache.get('b')).toBe('bbbb')
    expect(cache.get('c')).toBe('cccc')
    now.mockRestore()
  })

  it('keeps a value JSON cannot hold, counting it for nothing', () => {
    const cache = processCache('bounded', { maxSize: 4 })!
    const circular: Record<string, unknown> = {}
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

  it('empties the sizes with the entries on a clear', () => {
    const cache = () => processCache('bounded', { maxSize: 8 })!
    cache().set('a', 'aaaaaaaa', 60)
    resetProcessCache()
    cache().set('b', 'bbbbbbbb', 60)
    expect(cache().get('b')).toBe('bbbbbbbb')
  })
})
