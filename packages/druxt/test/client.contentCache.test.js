import { DruxtClient } from '../src'
import { resetProcessCache, runtime } from '../src/utils/processCache'

const baseUrl = 'https://demo-api.druxtjs.org'
jest.mock('axios')

const PUBLIC = { 'cache-control': 'public, max-age=300' }
const uuid = '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9'

// Requests that reached Drupal, by URL.
let sent = []

// Each server request gets its own Axios instance from @nuxtjs/axios.
// `added` is what a request interceptor adds on the way out, which the defaults never show.
const requestAxios = ({ common = {}, added = {}, headers = PUBLIC, status = 200 } = {}) => {
  const instance = jest.fn()
  const handlers = []
  instance.defaults = { headers: { common } }
  instance.interceptors = { response: { use: (ok) => handlers.push(ok) } }
  instance.get = jest.fn(async (url, config) => {
    sent.push(url)
    const data = url.endsWith('/jsonapi')
      ? { links: { 'node--page': { href: `${baseUrl}/jsonapi/node/page` } } }
      : { data: { id: uuid, type: 'node--page', attributes: { title: 'Fresh', sent: sent.length } } }
    const response = { status, config: { ...config, headers: { ...common, ...added } }, headers, data }
    return handlers.reduce((result, handler) => handler(result), response)
  })
  return instance
}

const client = (axios = requestAxios(), cache = { content: true }) => new DruxtClient(baseUrl, { axios, cache })
const page = `/jsonapi/node/page/${uuid}`
const fetches = (url = page) => sent.filter((s) => s === url).length

describe('DruxtClient content cache', () => {
  const { isServer } = runtime
  beforeEach(() => {
    resetProcessCache()
    sent = []
    runtime.isServer = () => true
  })
  afterAll(() => { runtime.isServer = isServer })

  test('off unless cache.content is set', async () => {
    await client(requestAxios(), {}).get(page)
    await client(requestAxios(), {}).get(page)
    expect(fetches()).toBe(2)

    await client().get(page)
    await client().get(page)
    expect(fetches()).toBe(3)
  })

  test('never used in a browser', async () => {
    runtime.isServer = () => false
    await client().get(page)
    await client().get(page)
    expect(fetches()).toBe(2)
  })

  test('a second server request is answered without Drupal, per backend', async () => {
    const first = await client().get(page)
    const second = await client().get(page)
    expect(fetches()).toBe(1)
    expect(second.status).toBe(200)
    expect(second.data).toStrictEqual(first.data)

    await new DruxtClient('https://other.example', { axios: requestAxios(), cache: { content: true } }).get(page)
    expect(fetches()).toBe(2)
  })

  test('each caller gets its own copy, so no request can change what the next one reads', async () => {
    const first = await client().get(page)
    // The store and Vue both change the documents they are handed.
    first.data.data.attributes.title = 'Changed by the first request'
    const second = await client().get(page)
    expect(second.data.data.attributes.title).toBe('Fresh')
    second.data.data.attributes.title = 'Changed by the second request'
    expect((await client().get(page)).data.data.attributes.title).toBe('Fresh')
  })

  test('a stored document reports what is left of its lifetime', async () => {
    const now = jest.spyOn(Date, 'now')
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
    now.mockRestore()
  })

  test('credentials on the instance, on the request or from an interceptor keep it out', async () => {
    await client(requestAxios({ common: { Authorization: 'Bearer token' } })).get(page)
    await client(requestAxios({ common: { cookie: 'SESS0123456789abcdef0123456789abcdef=abc' } })).get(page)
    await client(requestAxios({ added: { Authorization: 'Bearer token' } })).get(page)
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

  test('a request with headers of its own is never read or stored, as the key cannot tell its variants apart', async () => {
    await client().get(page)
    // Another language through a request header would be answered with the English document.
    await client().get(page, { headers: { 'Accept-Language': 'es' } })
    expect(fetches()).toBe(2)
    await client().get(page, { headers: { 'X-Consumer-ID': 'other' } })
    await client().get(page, { auth: { username: 'a', password: 'b' } })
    expect(fetches()).toBe(4)

    // The anonymous entry is untouched by those, and options without headers still use it.
    await client().get(page, { validateStatus: () => true })
    expect(fetches()).toBe(4)
  })

  test('only a 200 is stored', async () => {
    const options = { validateStatus: (status) => status < 500 }
    await client(requestAxios({ status: 404 })).get(page, options)
    await client(requestAxios({ status: 404 })).get(page, options)
    expect(fetches()).toBe(2)
  })

  test('a response Drupal will not let a shared cache keep replaces nothing and is not kept', async () => {
    await client().get(page)
    // A bypass that Drupal answers with no-cache removes the earlier entry.
    await client(requestAxios({ headers: { 'cache-control': 'max-age=0, no-cache, must-revalidate' } })).get(page, { bypassCache: true })
    await client().get(page)
    expect(fetches()).toBe(3)
  })

  test('a bypass goes to Drupal and stores the fresh document', async () => {
    await client().get(page)
    const fresh = await client().get(page, { bypassCache: true })
    expect(fetches()).toBe(2)
    expect(fresh.data.data.attributes.sent).toBe(2)

    const read = await client().get(page)
    expect(fetches()).toBe(2)
    expect(read.data.data.attributes.sent).toBe(2)
  })

  test('the bypass flag is not sent to Axios', async () => {
    const axios = requestAxios()
    await client(axios).get(page, { bypassCache: true, validateStatus: () => true })
    const [, config] = axios.get.mock.calls[0]
    expect(config.bypassCache).toBe(undefined)
    expect(typeof config.validateStatus).toBe('function')

    await client(axios).get('/other')
    expect(axios.get.mock.calls[1]).toStrictEqual(['/other', undefined])
  })

  test('a document fetched before a clear is not stored after it', async () => {
    const axios = requestAxios()
    const inFlight = axios.get
    axios.get = jest.fn(async (...args) => {
      const response = await inFlight(...args)
      resetProcessCache()
      return response
    })
    await client(axios).get(page)
    await client().get(page)
    expect(fetches()).toBe(2)
  })

  test('clearCache empties it', async () => {
    const first = client()
    await first.get(page)
    first.clearCache()
    await client().get(page)
    expect(fetches()).toBe(2)
  })

  test('1000 entries are kept when cache.max is not set', async () => {
    const urls = Array.from({ length: 1001 }, (_, i) => `/jsonapi/node/page/${i}`)
    for (const url of urls) await client().get(url)
    // The first is the least recently used, so it went when the 1001st arrived.
    await client().get(urls[0])
    expect(fetches(urls[0])).toBe(2)
    await client().get(urls[1000])
    expect(fetches(urls[1000])).toBe(1)
  })

  test('cache.max bounds the entries kept', async () => {
    const bounded = { content: true, max: 1 }
    await client(requestAxios(), bounded).get('/jsonapi/node/page/a')
    await client(requestAxios(), bounded).get('/jsonapi/node/page/b')
    await client(requestAxios(), bounded).get('/jsonapi/node/page/a')
    expect(fetches('/jsonapi/node/page/a')).toBe(2)
  })

  test('getResource and getCollection read it, and pass a bypass through', async () => {
    // Without baseUrl in its options the client keeps the index's absolute links.
    const resource = `${baseUrl}${page}`
    await client().getResource('node--page', uuid)
    await client().getResource('node--page', uuid)
    expect(fetches(resource)).toBe(1)
    await client().getResource('node--page', uuid, undefined, undefined, { bypassCache: true })
    expect(fetches(resource)).toBe(2)

    const collection = `${baseUrl}/jsonapi/node/page`
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
})
