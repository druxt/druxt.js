import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DruxtClient, forgetProcessCache, resetProcessCache } from '../../packages/client/src'
import type { DruxtFetch } from '../../packages/client/src'
import { BASE_URL, json } from './fake-drupal'

// The content cache: with `cache.content`, a server response to a request without credentials is kept for as long as
// its Cache-Control allows, and the next server request for the same URL is answered from it. 0.25.0's rules.

const PUBLIC = { 'cache-control': 'public, max-age=300' }
const uuid = '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9'
const page = `/jsonapi/node/page/${uuid}`

// Requests that reached Drupal, by URL path.
let sent: string[] = []
const fetches = (url = page) => sent.filter((s) => s === url).length

/** A Drupal answering every URL, with the headers and status given, and `pad` characters more in each document. */
const drupal = ({ headers = PUBLIC, status = 200, pad = 0 }: { headers?: Record<string, string>, status?: number, pad?: number } = {}): DruxtFetch => async (input) => {
  const url = new URL(String(input))
  sent.push(url.pathname)
  const data = url.pathname.endsWith('/jsonapi')
    ? { links: { 'node--page': { href: `${BASE_URL}/jsonapi/node/page` } } }
    : { data: { id: uuid, type: 'node--page', attributes: { title: 'Fresh', sent: sent.length, ...(pad ? { body: 'x'.repeat(pad) } : {}) } } }
  return json(data, status, headers)
}

const client = (fetch: DruxtFetch = drupal(), cache: Record<string, unknown> | false = { content: true }, options: Record<string, unknown> = {}) => new DruxtClient(BASE_URL, { fetch, cache: cache as never, ...options })

describe('the content cache', () => {
  beforeEach(() => {
    resetProcessCache()
    sent = []
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('is off unless cache.content is set', async () => {
    await client(drupal(), {}).get(page)
    await client(drupal(), {}).get(page)
    expect(fetches()).toBe(2)
    await client().get(page)
    await client().get(page)
    expect(fetches()).toBe(3)
  })

  it('is never used in a browser', async () => {
    vi.stubGlobal('window', {})
    await client().get(page)
    await client().get(page)
    expect(fetches()).toBe(2)
  })

  it('answers a second server request without Drupal, per backend', async () => {
    const first = await client().get(page)
    const second = await client().get(page)
    expect(fetches()).toBe(1)
    expect(second.status).toBe(200)
    expect(second.data).toStrictEqual(first.data)
    expect(second.headers.get('cache-control')).toBe('public, max-age=300')
    await new DruxtClient('https://other.example', { fetch: drupal(), cache: { content: true } }).get(page)
    expect(fetches()).toBe(2)
  })

  it('gives each caller its own copy, so no request can change what the next one reads', async () => {
    const first = await client().get<{ data: { attributes: { title: string } } }>(page)
    first.data.data.attributes.title = 'Changed by the first request'
    const second = await client().get<{ data: { attributes: { title: string } } }>(page)
    expect(second.data.data.attributes.title).toBe('Fresh')
  })

  it('reports what is left of a stored document\'s lifetime', async () => {
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    await client().get(page)
    now.mockReturnValue(1000 + 100 * 1000)
    const reader = client()
    const { data } = await reader.get(page)
    expect(fetches()).toBe(1)
    expect(reader.cacheLifetime(data)).toBe(200)
    // Past Drupal's max-age the entry is gone.
    now.mockReturnValue(1000 + 301 * 1000)
    await client().get(page)
    expect(fetches()).toBe(2)
  })

  it('keeps a credentialed client out: a token, a session cookie, Druxt\'s own token cookie, or credentials on the request', async () => {
    await client(drupal(), { content: true }, { headers: { Authorization: 'Bearer token' } }).get(page)
    await client(drupal(), { content: true }, { headers: { cookie: 'SESS0123456789abcdef0123456789abcdef=abc' } }).get(page)
    await client(drupal(), { content: true }, { headers: { cookie: 'druxt.auth.access_token=abc' } }).get(page)
    await client().get(page, { headers: { Authorization: 'Bearer token' } })
    expect(fetches()).toBe(4)
    // None of those were stored, so an anonymous request goes to Drupal and is stored.
    await client().get(page)
    await client().get(page)
    expect(fetches()).toBe(5)
    // A request with its own credentials is never answered from the cache either.
    await client().get(page, { headers: { Authorization: 'Bearer token' } })
    expect(fetches()).toBe(6)
  })

  it('withholds the process cache from a signed-in session-mode client', async () => {
    // Built on the server, as nothing stops a site doing: its requests carry the session a proxy adds.
    const session = () => client(drupal(), { content: true }, { auth: { clientId: 'druxt', session: true } })
    const signedOut = session()
    expect(signedOut.processCache('content')).toBeDefined()
    await client().get(page)
    const signedIn = session()
    signedIn.auth!.setTokens({ access_token: 'held by the site', expires_in: 300 })
    expect(signedIn.processCache('content')).toBeUndefined()
    expect(signedIn.processCache('index')).toBeUndefined()
    // It neither reads the stored answer nor stores its own.
    await signedIn.get(page, { bypassCache: true })
    await signedIn.get(page)
    expect(fetches()).toBe(3)
    expect((await client().get<{ data: { attributes: { sent: number } } }>(page)).data.data.attributes.sent).toBe(1)
  })

  it('keeps Druxt\'s token cookie out under a custom session cookie pattern', async () => {
    const custom = { content: true, sessionCookie: 'site_session_[a-f0-9]+' }
    await client(drupal(), custom, { headers: { cookie: 'druxt.auth.access_token=abc' } }).get(page)
    await client(drupal(), custom).get(page, { headers: { cookie: 'druxt.auth.access_token=abc' } })
    expect(fetches()).toBe(2)
    // Neither was stored, so an anonymous request goes to Drupal.
    await client(drupal(), custom).get(page)
    expect(fetches()).toBe(3)
  })

  it('never reads or stores for a request whose options could change the response', async () => {
    await client().get(page)
    await client().get(page, { headers: { 'Accept-Language': 'es' } })
    await client().get(page, { method: 'GET', body: undefined })
    expect(fetches()).toBe(3)
    // Options that cannot change the response still use the entry.
    await client().get(page, { validateStatus: () => true })
    expect(fetches()).toBe(3)
    // A status check that refuses a 200 never gets the stored one.
    await client().get(page, { validateStatus: (status) => status !== 200 }).catch(() => {})
    expect(fetches()).toBe(4)
  })

  it('keeps a client\'s entries apart from a client with other headers', async () => {
    // A Drupal that answers in the language the request asks for, with no Vary to say so.
    const localized: DruxtFetch = async (input, init = {}) => {
      sent.push(new URL(String(input)).pathname)
      const lang = (init.headers as Record<string, string>)['Accept-Language'] || 'en'
      return json({ data: { id: uuid, type: 'node--page', attributes: { lang } } }, 200, PUBLIC)
    }
    const spanish = client(localized)
    spanish.addHeaders({ 'Accept-Language': 'es' })
    await spanish.get(page)
    const plain = await client(localized).get(page)
    expect(fetches()).toBe(2)
    expect(plain.data).toMatchObject({ data: { attributes: { lang: 'en' } } })
    const again = client(localized, { content: true }, { headers: { 'Accept-Language': 'es' } })
    expect((await again.get(page)).data).toMatchObject({ data: { attributes: { lang: 'es' } } })
    expect(fetches()).toBe(2)
  })

  it('stores no response under headers added while it was in flight', async () => {
    let answer = () => {}
    const fetch: DruxtFetch = async (input, init) => {
      sent.push(new URL(String(input)).pathname)
      const lang = (init?.headers as Record<string, string>)['Accept-Language']
      const response = json({ data: { id: uuid, type: 'node--page', attributes: { lang } } }, 200, PUBLIC)
      if (sent.length === 1) await new Promise<void>((resolve) => { answer = resolve })
      return response
    }
    const shared = client(fetch, { content: true }, { headers: { 'Accept-Language': 'en' } })
    const read = shared.get(page)
    await vi.waitFor(() => expect(sent).toHaveLength(1))
    shared.addHeaders({ 'Accept-Language': 'es' })
    answer()
    await read
    // Neither under the headers the client has now, which may pick another variant, nor under the ones it had.
    const spanish = await client(fetch, { content: true }, { headers: { 'Accept-Language': 'es' } }).get<{ data: { attributes: { lang: string } } }>(page)
    expect(spanish.data.data.attributes.lang).toBe('es')
    await client(fetch, { content: true }, { headers: { 'Accept-Language': 'en' } }).get(page)
    expect(fetches()).toBe(3)
  })

  it('shares entries between clients with the same headers in any case', async () => {
    await client(drupal(), { content: true }, { headers: { 'Accept-Language': 'es', 'X-Site': 'a' } }).get(page)
    await client(drupal(), { content: true }, { headers: { 'x-site': 'a', 'accept-language': 'es' } }).get(page)
    expect(fetches()).toBe(1)
  })

  it('holds maxSize at most in each cache area, however many header sets and consumer ids clients send', async () => {
    const maxSize = 1000
    // The bytes each scope holds, read from the cache the process keeps on globalThis.
    const stored = () => {
      const scopes = (globalThis as Record<symbol, unknown>)[Symbol.for('druxt.processCache')] as Map<string, Map<string, Record<symbol, number>>>
      const size = Symbol.for('druxt.processCacheSize')
      return [...scopes.values()].map((consumers) => [...consumers.values()].reduce((sum, entries) => sum + (entries[size] || 0), 0))
    }
    for (let i = 0; i < 200; i++) {
      const headers = i % 2 ? { 'Accept-Language': `l${i}` } : { 'X-Consumer-ID': `c${i}` }
      await client(drupal({ pad: 300 }), { content: true, maxSize }, { headers }).get(`/jsonapi/node/page/${i % 7}`)
      for (const bytes of stored()) expect(bytes).toBeLessThanOrEqual(maxSize)
    }
    // The most recent header set still reads what it stored, and the first one's entries are gone.
    const before = sent.length
    await client(drupal({ pad: 300 }), { content: true, maxSize }, { headers: { 'Accept-Language': 'l199' } }).get(`/jsonapi/node/page/${199 % 7}`)
    expect(sent.length).toBe(before)
    await client(drupal({ pad: 300 }), { content: true, maxSize }, { headers: { 'X-Consumer-ID': 'c0' } }).get('/jsonapi/node/page/0')
    expect(sent.length).toBeGreaterThan(before)
  })

  it('stores only a 200', async () => {
    const options = { validateStatus: (status: number) => status < 500 }
    await client(drupal({ status: 404 })).get(page, options)
    await client(drupal({ status: 404 })).get(page, options)
    expect(fetches()).toBe(2)
  })

  it('a response Drupal will not let a shared cache keep replaces nothing and is not kept', async () => {
    await client().get(page)
    await client(drupal({ headers: { 'cache-control': 'max-age=0, no-cache, must-revalidate' } })).get(page, { bypassCache: true })
    await client().get(page)
    expect(fetches()).toBe(3)
  })

  it('drops the entry when a bypass is answered with a 404', async () => {
    await client().get(page)
    await expect(client(drupal({ status: 404 })).get(page, { bypassCache: true })).rejects.toMatchObject({ response: { status: 404 } })
    await client().get(page)
    expect(fetches()).toBe(3)
  })

  it('drops the entry when a bypass is answered with anything but a 200 its caller accepts', async () => {
    await client().get(page)
    const answered = await client(drupal({ status: 403 })).get(page, { bypassCache: true, validateStatus: () => true })
    expect(answered.status).toBe(403)
    await client().get(page)
    expect(fetches()).toBe(3)
  })

  it('keeps the entry when a bypass never reaches Drupal', async () => {
    await client().get(page)
    const down: DruxtFetch = async () => { throw new TypeError('fetch failed') }
    await expect(client(down).get(page, { bypassCache: true })).rejects.toThrow('fetch failed')
    await client().get(page)
    expect(fetches()).toBe(1)
  })

  it('a bypass goes to Drupal and stores the fresh document', async () => {
    await client().get(page)
    const fresh = await client().get<{ data: { attributes: { sent: number } } }>(page, { bypassCache: true })
    expect(fetches()).toBe(2)
    expect(fresh.data.data.attributes.sent).toBe(2)
    const read = await client().get<{ data: { attributes: { sent: number } } }>(page)
    expect(fetches()).toBe(2)
    expect(read.data.data.attributes.sent).toBe(2)
  })

  it('an older request that resolves after a bypass does not replace its fresher document', async () => {
    // An ordinary request and a bypass in flight at once, answered in the opposite order to the one they started in.
    const pending: Array<() => void> = []
    const deferred = (): DruxtFetch => {
      const answer = drupal()
      return (...args) => new Promise((resolve) => pending.push(() => resolve(answer(...args))))
    }
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    const ordinary = client(deferred()).get<{ data: { attributes: { sent: number } } }>(page)
    const bypass = client(deferred()).get<{ data: { attributes: { sent: number } } }>(page, { bypassCache: true })
    await new Promise((resolve) => setTimeout(resolve, 0))
    pending[1]!()
    expect((await bypass).data.data.attributes.sent).toBe(1)
    pending[0]!()
    expect((await ordinary).data.data.attributes.sent).toBe(2)
    // The bypass started later, so its answer stays.
    expect((await client().get<{ data: { attributes: { sent: number } } }>(page)).data.data.attributes.sent).toBe(1)
  })

  it('an older request that resolves after a bypass answered with a 404 stores nothing', async () => {
    // As above, but the later bypass's answer removes the entry, and the older request's 200 comes after it.
    const pending: Array<() => void> = []
    const deferred = (status: number): DruxtFetch => {
      const answer = drupal({ status })
      return (...args) => new Promise((resolve) => pending.push(() => resolve(answer(...args))))
    }
    const ordinary = client(deferred(200)).get(page)
    const bypass = client(deferred(404)).get(page, { bypassCache: true })
    await new Promise((resolve) => setTimeout(resolve, 0))
    pending[1]!()
    await expect(bypass).rejects.toMatchObject({ response: { status: 404 } })
    pending[0]!()
    expect((await ordinary).status).toBe(200)
    // The 404 started later, so the older 200 is not kept: the next read goes to Drupal.
    await client(drupal({ status: 404 })).get(page).catch(() => {})
    expect(fetches()).toBe(3)
  })

  it('does not store an answer to a read that was in flight when its entry was forgotten', async () => {
    let answer = () => {}
    let version = 'old'
    const fetch: DruxtFetch = async (input) => {
      sent.push(new URL(String(input)).pathname)
      const body = { data: { id: uuid, type: 'node--page', attributes: { version } } }
      if (sent.length > 1) return json(body, 200, PUBLIC)
      return new Promise<Response>((resolve) => { answer = () => resolve(json(body, 200, PUBLIC)) })
    }
    const inflight = client(fetch).get(page)
    await vi.waitFor(() => expect(fetches()).toBe(1))
    // An editor's save lands, and the proxy forgets the resource, while the read is answered.
    forgetProcessCache('content', (key) => key.includes(page))
    answer()
    await inflight
    version = 'new'
    expect((await client(fetch).get(page)).data).toMatchObject({ data: { attributes: { version: 'new' } } })
    expect(fetches()).toBe(2)
  })

  it('a document fetched before a clear is not stored after it', async () => {
    const answer = drupal()
    const fetch: DruxtFetch = async (...args) => {
      const response = await answer(...args)
      resetProcessCache()
      return response
    }
    await client(fetch).get(page)
    await client().get(page)
    expect(fetches()).toBe(2)
  })

  it('clearCache() empties it', async () => {
    const first = client()
    await first.get(page)
    first.clearCache()
    await client().get(page)
    expect(fetches()).toBe(2)
  })

  it('keeps 50 MB of documents when cache.maxSize is not set', async () => {
    // Just under 1 MB each, so 50 fit and the 51st pushes out the least recently used.
    const big = () => drupal({ pad: 1024 * 1024 - 1000 })
    const urls = Array.from({ length: 51 }, (_, i) => `/jsonapi/node/page/${i}`)
    for (const url of urls) await client(big()).get(url)
    await client(big()).get(urls[1]!)
    expect(fetches(urls[1])).toBe(1)
    await client(big()).get(urls[0]!)
    expect(fetches(urls[0])).toBe(2)
  }, 30_000)

  it('cache.maxSize bounds what is kept, by the size of the stored documents', async () => {
    // One small document is about 110 bytes of JSON, so one fits and two do not.
    const bounded = { content: true, maxSize: 150 }
    await client(drupal(), bounded).get('/jsonapi/node/page/a')
    await client(drupal(), bounded).get('/jsonapi/node/page/b')
    await client(drupal(), bounded).get('/jsonapi/node/page/a')
    expect(fetches('/jsonapi/node/page/a')).toBe(2)
    // A document larger than the whole limit is never kept.
    await client(drupal({ pad: 500 }), bounded).get('/jsonapi/node/page/big')
    await client(drupal({ pad: 500 }), bounded).get('/jsonapi/node/page/big')
    expect(fetches('/jsonapi/node/page/big')).toBe(2)
  })

  it('getResource() and getCollection() read it, and pass a bypass through', async () => {
    await client().getResource('node--page', uuid)
    await client().getResource('node--page', uuid)
    expect(fetches()).toBe(1)
    await client().getResource('node--page', uuid, undefined, undefined, { bypassCache: true })
    expect(fetches()).toBe(2)
    const collection = '/jsonapi/node/page'
    await client().getCollection('node--page')
    await client().getCollection('node--page')
    expect(fetches(collection)).toBe(1)
    await client().getCollection('node--page', undefined, undefined, { bypassCache: true })
    expect(fetches(collection)).toBe(2)
    await client().getCollectionAll('node--page')
    expect(fetches(collection)).toBe(2)
    await client().getCollectionAll('node--page', undefined, undefined, { bypassCache: true })
    expect(fetches(collection)).toBe(3)
  })

  it('getRelated() reads it, and passes a bypass through, so a relationship read after a save is fresh', async () => {
    const related = `${page}/uid`
    await client().getRelated('node--page', uuid, 'uid')
    await client().getRelated('node--page', uuid, 'uid')
    expect(fetches(related)).toBe(1)
    await client().getRelated('node--page', uuid, 'uid', undefined, undefined, { bypassCache: true })
    expect(fetches(related)).toBe(2)
    // The bypass stored the fresh document for the next read.
    await client().getRelated('node--page', uuid, 'uid')
    expect(fetches(related)).toBe(2)
  })
})
