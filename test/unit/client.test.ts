import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DruxtClient, resetProcessCache } from '../../packages/client/src'
import type { DruxtFetch } from '../../packages/client/src'
import { trimEnd, trimStart } from '../../packages/client/src/utils/href'
import { BASE_URL, drupal, index, json, requested } from './fake-drupal'

const article = { type: 'node--article', id: 'a1', attributes: { title: 'Hello' } }

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  resetProcessCache()
  // The omitted-resources warnings are kept per site for the process: each test starts with none.
  new DruxtClient(BASE_URL).clearCache()
})

describe('the client', () => {
  it('requires a base URL', () => {
    expect(() => new DruxtClient('')).toThrow('The \'baseUrl\' parameter is required.')
  })

  it('lets a baseUrl in the options win over the argument, as 1.x did, and requests from it', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index() })
    const client = new DruxtClient('https://ignored.test', { fetch, baseUrl: `${BASE_URL}/` })
    expect(client.options.baseUrl).toBe(BASE_URL)
    await client.getIndex()
    expect(calls.map((call) => call.url)).toEqual([`${BASE_URL}/jsonapi`])
    // Without one in the options, the argument is the base URL.
    expect(new DruxtClient(`${BASE_URL}/`, { baseUrl: undefined }).options.baseUrl).toBe(BASE_URL)
  })

  it('turns auth on only with a clientId', () => {
    expect(new DruxtClient(BASE_URL).auth).toBeUndefined()
    expect(new DruxtClient(BASE_URL, { auth: { type: false } }).auth).toBeUndefined()
    expect(new DruxtClient(BASE_URL, { auth: { clientId: 'druxt' } }).auth).toBeDefined()
  })
})

describe('URL building', () => {
  const client = new DruxtClient(BASE_URL)

  it('resolves a path against the base URL', () => {
    expect(client.url('/jsonapi/node/article')).toBe(`${BASE_URL}/jsonapi/node/article`)
    expect(client.url('es/jsonapi')).toBe(`${BASE_URL}/es/jsonapi`)
    expect(new DruxtClient(`${BASE_URL}/`).url('/jsonapi')).toBe(`${BASE_URL}/jsonapi`)
    expect(client.url('https://cdn.test/image.jpg')).toBe('https://cdn.test/image.jpg')
  })

  it('drops a trailing slash from the base URL', () => {
    expect(new DruxtClient(`${BASE_URL}//`).options.baseUrl).toBe(BASE_URL)
  })

  it('trims every trailing slash from baseUrl and endpoint, in linear time', () => {
    const client = new DruxtClient(`${BASE_URL}///`, { endpoint: '//jsonapi//' })
    expect([client.options.baseUrl, client.options.endpoint]).toEqual([BASE_URL, '/jsonapi'])
    expect(new DruxtClient(BASE_URL, { endpoint: '/' }).options.endpoint).toBe('/')
    expect(new DruxtClient(BASE_URL, { endpoint: '' }).options.endpoint).toBe('/')
    // A run of slashes before another character took seconds to trim with /\/+$/.
    const slashes = '/'.repeat(100_000)
    const started = performance.now()
    expect(new DruxtClient(`${BASE_URL}${slashes}x`, { endpoint: `${slashes}x${slashes}x` }).options.baseUrl).toBe(`${BASE_URL}${slashes}x`)
    expect(performance.now() - started).toBeLessThan(50)
  })

  it('trims a run of slashes from either end of a string, and nothing else', () => {
    expect(['', '///', 'a', '/a/', '//a//b//'].map((value) => [trimStart(value), trimEnd(value)]))
      .toEqual([['', ''], ['', ''], ['a', 'a'], ['a/', '/a'], ['a//b//', '//a//b']])
  })

  it('resolves a path against this origin when the API is proxied', () => {
    vi.stubGlobal('location', { origin: 'https://site.test' })
    expect(new DruxtClient(BASE_URL, { proxy: { api: true } }).url('/jsonapi')).toBe('https://site.test/jsonapi')
  })

  it('leaves the URL alone without a query', () => {
    expect(client.buildQueryUrl('/jsonapi/node/article')).toBe('/jsonapi/node/article')
    expect(client.buildQueryUrl('/jsonapi/node/article', '')).toBe('/jsonapi/node/article')
    expect(client.buildQueryUrl('/jsonapi/node/article', {})).toBe('/jsonapi/node/article')
    expect(client.buildQueryUrl('/jsonapi/node/article', new DrupalJsonApiParams())).toBe('/jsonapi/node/article')
  })

  it('appends a query string, with or without its question mark', () => {
    expect(client.buildQueryUrl('/jsonapi/node/article', 'page[limit]=5')).toBe('/jsonapi/node/article?page[limit]=5')
    expect(client.buildQueryUrl('/jsonapi/node/article', '?page[limit]=5')).toBe('/jsonapi/node/article?page[limit]=5')
  })

  it('joins a query to a URL that already has one with an ampersand', () => {
    const url = '/jsonapi/node/article?page[limit]=5'
    expect(client.buildQueryUrl(url, 'page[offset]=5')).toBe(`${url}&page[offset]=5`)
    expect(client.buildQueryUrl(url, '?page[offset]=5')).toBe(`${url}&page[offset]=5`)
    expect(client.buildQueryUrl(url, { sort: 'title' })).toBe(`${url}&sort=title`)
    expect(client.buildQueryUrl(url, new DrupalJsonApiParams().addSort('title'))).toBe(`${url}&sort=title`)
  })

  it('appends drupal-jsonapi-params\' query string', () => {
    const query = new DrupalJsonApiParams().addFilter('status', '1').addPageLimit(5)
    expect(client.buildQueryUrl('/jsonapi/node/article', query)).toBe('/jsonapi/node/article?filter%5Bstatus%5D=1&page%5Blimit%5D=5')
  })

  it('encodes a nested object in bracket form', () => {
    expect(decodeURIComponent(client.buildQueryUrl('/jsonapi/node/article', { filter: { status: 1 } }))).toBe('/jsonapi/node/article?filter[status]=1')
    // A nested null is left out: an IS NULL condition must have no value.
    expect(decodeURIComponent(client.buildQueryUrl('/jsonapi/node/article', { filter: { draft: { condition: { path: 'field_x', operator: 'IS NULL', value: null } } } })))
      .toBe('/jsonapi/node/article?filter[draft][condition][path]=field_x&filter[draft][condition][operator]=IS NULL')
    expect(client.buildQueryUrl('/jsonapi/node/article', { filter: {} })).toBe('/jsonapi/node/article')
  })

  it('encodes an object as drupal-jsonapi-params does, at any depth', () => {
    const params = new DrupalJsonApiParams()
      .addFilter('status', '1')
      .addFilter('drupal_internal__nid', ['1', '2'], 'IN')
      .addGroup('either', 'OR')
      .addFilter('title', 'Druxt', 'CONTAINS', 'either')
      .addFilter('field_tags', null, 'IS NULL', 'either')
      .addFields('node--article', ['title', 'body'])
      .addInclude(['uid', 'field_image'])
      .addSort('created', 'DESC')
      .addPageLimit(5)
    const url = client.buildQueryUrl('/jsonapi/node/article', params.getQueryObject())
    expect(decodeURIComponent(url)).toBe(`/jsonapi/node/article?${decodeURIComponent(params.getQueryString())}`)
  })

  it('encodes an object, repeating the key for each value of an array', () => {
    expect(client.buildQueryUrl('/jsonapi/node/article', { 'page[limit]': 5, 'include': ['uid', 'field_image'], 'filter[status]': true }))
      .toBe('/jsonapi/node/article?page%5Blimit%5D=5&include=uid&include=field_image&filter%5Bstatus%5D=true')
  })
})

describe('the language prefix', () => {
  const site = () => drupal({
    'GET /jsonapi': index(),
    'GET /es/jsonapi': index('/es'),
    'GET /es/jsonapi/node/article/a1': { data: article },
    'GET /es/jsonapi/node/article?page[limit]=1': { data: [article] },
    'GET /es/jsonapi/node/recipe/r1': { data: { type: 'node--recipe', id: 'r1' } },
    'GET /es/jsonapi/node/recipe/r1/uid': { data: { type: 'user--user', id: 'u1' } },
    'GET /jsonapi/node/recipe/r1': { data: { type: 'node--recipe', id: 'r1' } },
    'GET /jsonapi/node/recipe/r1/uid': { data: { type: 'user--user', id: 'u1' } },
  })

  it('fetches the prefixed index, its links keeping the prefix', async () => {
    const { fetch, calls } = site()
    const client = new DruxtClient(BASE_URL, { fetch })
    expect(await client.getIndex('node--article', '/es')).toEqual({ href: '/es/jsonapi/node/article' })
    expect(await client.getIndex('node--article')).toEqual({ href: '/jsonapi/node/article' })
    expect(requested(calls)).toEqual(['GET /es/jsonapi', 'GET /jsonapi'])
  })

  it('prefixes resource and collection URLs', async () => {
    const { fetch, calls } = site()
    const client = new DruxtClient(BASE_URL, { fetch })
    await client.getResource('node--article', 'a1', undefined, '/es')
    await client.getCollection('node--article', 'page[limit]=1', '/es')
    expect(requested(calls)).toEqual(['GET /es/jsonapi', 'GET /es/jsonapi/node/article/a1', 'GET /es/jsonapi/node/article?page[limit]=1'])
  })

  it('builds the conventional URL for a type the index does not list', async () => {
    const { fetch, calls } = site()
    const client = new DruxtClient(BASE_URL, { fetch })
    expect(await client.getResource('node--recipe', 'r1')).toEqual({ data: { type: 'node--recipe', id: 'r1' } })
    expect(requested(calls)).toEqual(['GET /jsonapi', 'GET /jsonapi/node/recipe/r1'])
  })

  it('keeps the prefix in the fallback resource URL', async () => {
    const { fetch, calls } = site()
    const client = new DruxtClient(BASE_URL, { fetch })
    await client.getResource('node--recipe', 'r1', undefined, '/es')
    expect(requested(calls)).toEqual(['GET /es/jsonapi', 'GET /es/jsonapi/node/recipe/r1'])
  })

  it('keeps the prefix in the fallback related URL', async () => {
    const { fetch, calls } = site()
    const client = new DruxtClient(BASE_URL, { fetch })
    await client.getRelated('node--recipe', 'r1', 'uid', undefined, '/es')
    expect(requested(calls)).toEqual(['GET /es/jsonapi', 'GET /es/jsonapi/node/recipe/r1/uid'])
  })

  it('keeps the prefix in the fallback collection URL', async () => {
    const { fetch, calls } = drupal({ 'GET /es/jsonapi': index('/es'), 'GET /es/jsonapi/node/recipe?page[limit]=1': { data: [] } })
    expect(await new DruxtClient(BASE_URL, { fetch }).getCollection('node--recipe', 'page[limit]=1', '/es')).toEqual({ data: [] })
    expect(requested(calls)).toEqual(['GET /es/jsonapi', 'GET /es/jsonapi/node/recipe?page[limit]=1'])
  })
})

describe('getIndex', () => {
  it('fetches the index once and strips the base URL from its links', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index() })
    const client = new DruxtClient(BASE_URL, { fetch })
    const whole = await client.getIndex()
    expect(whole['node--page']).toEqual({ href: '/jsonapi/node/page' })
    expect(await client.getIndex('node--article')).toEqual({ href: '/jsonapi/node/article' })
    expect(await client.getIndex('node--missing')).toBeUndefined()
    expect(requested(calls)).toEqual(['GET /jsonapi'])
  })

  it('shares one request between concurrent callers', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index() })
    const client = new DruxtClient(BASE_URL, { fetch })
    await Promise.all([client.getIndex(), client.getIndex('node--article'), client.getIndex('node--page')])
    expect(calls).toHaveLength(1)
  })

  it('reads the index from a custom endpoint', async () => {
    const { fetch, calls } = drupal({ 'GET /api': { links: { 'node--article': { href: `${BASE_URL}/api/node/article` } } } })
    const client = new DruxtClient(BASE_URL, { fetch, endpoint: '/api' })
    expect(await client.getIndex('node--article')).toEqual({ href: '/api/node/article' })
    expect(requested(calls)).toEqual(['GET /api'])
  })

  it('takes a bare endpoint, as 1.x did, and joins a prefix to it with a slash', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index(), 'GET /spanish/jsonapi': index('/spanish') })
    const client = new DruxtClient(BASE_URL, { fetch, endpoint: 'jsonapi', prefixes: { es: 'spanish' } })
    expect(await client.getIndex('node--article', 'es')).toEqual({ href: '/spanish/jsonapi/node/article' })
    expect(await client.getIndex('node--article')).toEqual({ href: '/jsonapi/node/article' })
    expect(requested(calls)).toEqual(['GET /spanish/jsonapi', 'GET /jsonapi'])
    expect(client.options.endpoint).toBe('/jsonapi')
  })

  it('drops a trailing slash from the endpoint, so a type the index lacks gets one slash in its URL', async () => {
    // The index answers with and without the slash, so the fallback URL is what the test reads.
    const { fetch, calls } = drupal({ 'GET /jsonapi': index(), 'GET /jsonapi/': index(), 'GET /jsonapi/node/recipe': { data: [] } })
    const client = new DruxtClient(BASE_URL, { fetch, endpoint: '/jsonapi/' })
    await client.getCollection('node--recipe')
    expect(requested(calls)).toEqual(['GET /jsonapi', 'GET /jsonapi/node/recipe'])
    expect(client.options.endpoint).toBe('/jsonapi')
  })

  it('retries after a failed request instead of caching the failure', async () => {
    let attempt = 0
    const { fetch, calls } = drupal({ 'GET /jsonapi': () => (attempt++ ? json(index()) : json({ errors: [{ title: 'Internal Server Error' }] }, 500)) })
    const client = new DruxtClient(BASE_URL, { fetch })
    await expect(client.getIndex()).rejects.toThrow('500: Internal Server Error')
    expect(await client.getIndex('node--article')).toEqual({ href: '/jsonapi/node/article' })
    expect(calls).toHaveLength(2)
  })

  it('refuses a response that is not a JSON:API index', async () => {
    const { fetch } = drupal({ 'GET /jsonapi': { data: [] } })
    await expect(new DruxtClient(BASE_URL, { fetch }).getIndex()).rejects.toThrow(`Invalid JSON:API endpoint\n\nURL: ${BASE_URL}/jsonapi`)
  })

  it('adds JSON:API Extras\' resource config to the index', async () => {
    const resourceFields = { title: { publicName: 'heading', fieldName: 'title' } }
    const { fetch } = drupal({
      'GET /jsonapi': index('', ['node--article', 'jsonapi_resource_config--jsonapi_resource_config']),
      'GET /jsonapi/jsonapi_resource_config/jsonapi_resource_config': {
        data: [{ type: 'jsonapi_resource_config--jsonapi_resource_config', id: 'c1', attributes: { drupal_internal__id: 'node--article', resourceType: 'node--article', resourceFields } }],
      },
    })
    const client = new DruxtClient(BASE_URL, { fetch })
    expect(await client.getIndex('node--article')).toEqual({ href: '/jsonapi/node/article', resourceType: 'node--article', entityType: 'node', bundle: 'article', resourceFields })
  })

  it('fetches the index again after clearCache()', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index() })
    const client = new DruxtClient(BASE_URL, { fetch })
    await client.getIndex()
    client.clearCache()
    await client.getIndex()
    expect(calls).toHaveLength(2)
    expect(client.cacheGeneration).toBe(1)
  })

  it('fetches the unprefixed index once, whether the prefix is undefined or empty', async () => {
    const { fetch, calls } = drupal({
      'GET /jsonapi': index(),
      'GET /jsonapi/node/article/a1': { data: article },
      'GET /jsonapi/node/article/a1/uid': { data: { type: 'user--user', id: 'u1' } },
      'GET /jsonapi/node/article': { data: [article] },
      'PATCH /jsonapi/node/article/a1': { data: article },
    })
    const client = new DruxtClient(BASE_URL, { fetch })
    await client.getResource('node--article', 'a1')
    await client.getRelated('node--article', 'a1', 'uid')
    await client.getCollection('node--article')
    await client.createResource(article)
    await client.getIndex(null, '')
    expect(requested(calls).filter((call) => call === 'GET /jsonapi')).toHaveLength(1)
  })
})

describe('index links', () => {
  // A fetch that records URLs and answers the index with the links given.
  const answer = (links: Record<string, string>) => {
    const urls: string[] = []
    const fetch: DruxtFetch = async (url) => {
      urls.push(url)
      return url.endsWith('/jsonapi') ? json({ links: Object.fromEntries(Object.entries(links).map(([type, href]) => [type, { href }])) }) : json({ data: [] })
    }
    return { fetch, urls }
  }

  it('strips a base URL with a trailing slash, keeping the leading slash', async () => {
    const { fetch, urls } = answer({ 'node--article': `${BASE_URL}/jsonapi/node/article` })
    const client = new DruxtClient(`${BASE_URL}/`, { fetch })
    expect(await client.getIndex('node--article')).toEqual({ href: '/jsonapi/node/article' })
    await client.getCollection('node--article')
    expect(urls).toEqual([`${BASE_URL}/jsonapi`, `${BASE_URL}/jsonapi/node/article`])
  })

  it('strips the base URL only as a prefix', async () => {
    const { fetch, urls } = answer({ 'node--article': `${BASE_URL}.internal/jsonapi/node/article` })
    const client = new DruxtClient(BASE_URL, { fetch })
    expect(await client.getIndex('node--article')).toEqual({ href: '/jsonapi/node/article' })
    await client.getCollection('node--article')
    expect(urls[1]).toBe(`${BASE_URL}/jsonapi/node/article`)
  })

  it('moves a link on an internal host to the base URL, keeping its path and query', async () => {
    const { fetch, urls } = answer({ 'node--article': 'http://drupal:8080/jsonapi/node/article?resourceVersion=id%3A1' })
    const client = new DruxtClient(BASE_URL, { fetch })
    expect(await client.getIndex('node--article')).toEqual({ href: '/jsonapi/node/article?resourceVersion=id%3A1' })
    await client.getCollection('node--article')
    expect(urls[1]).toBe(`${BASE_URL}/jsonapi/node/article?resourceVersion=id%3A1`)
  })

  it('keeps a base URL\'s path', async () => {
    const base = 'https://example.test/drupal'
    const { fetch, urls } = answer({
      'node--article': `${base}/jsonapi/node/article`,
      'node--page': 'http://drupal:8080/drupal/jsonapi/node/page',
      'node--tag': '/jsonapi/node/tag',
    })
    const client = new DruxtClient(base, { fetch })
    expect(await client.getIndex()).toEqual({ 'node--article': { href: '/jsonapi/node/article' }, 'node--page': { href: '/jsonapi/node/page' }, 'node--tag': { href: '/jsonapi/node/tag' } })
    await client.getCollection('node--article')
    await client.getCollection('node--page')
    expect(urls).toEqual([`${base}/jsonapi`, `${base}/jsonapi/node/article`, `${base}/jsonapi/node/page`])
  })
})

describe('the process cache', () => {
  const cacheable = () => drupal({ 'GET /jsonapi': () => json(index(), 200, { 'Cache-Control': 'max-age=300, public' }) })

  it('shares an index Drupal lets be cached between clients', async () => {
    const first = cacheable()
    const second = cacheable()
    await new DruxtClient(BASE_URL, { fetch: first.fetch, cache: {} }).getIndex()
    expect(await new DruxtClient(BASE_URL, { fetch: second.fetch, cache: {} }).getIndex('node--article')).toEqual({ href: '/jsonapi/node/article' })
    expect(second.calls).toHaveLength(0)
  })

  it('is withheld from a client that sends credentials', async () => {
    const first = cacheable()
    const second = cacheable()
    await new DruxtClient(BASE_URL, { fetch: first.fetch, cache: {} }).getIndex()
    await new DruxtClient(BASE_URL, { fetch: second.fetch, cache: {}, headers: { Authorization: 'Basic ZWRpdG9yOnNlY3JldA==' } }).getIndex()
    expect(second.calls).toHaveLength(1)
  })

  it('is off without the cache option', async () => {
    const first = cacheable()
    const second = cacheable()
    await new DruxtClient(BASE_URL, { fetch: first.fetch }).getIndex()
    await new DruxtClient(BASE_URL, { fetch: second.fetch }).getIndex()
    expect(second.calls).toHaveLength(1)
  })

  it('keeps entries of its own for each X-Consumer-ID a client sends, whatever the case of the header', async () => {
    const one = cacheable()
    await new DruxtClient(BASE_URL, { fetch: one.fetch, cache: {}, headers: { 'X-Consumer-ID': 'one' } }).getIndex()
    const same = cacheable()
    await new DruxtClient(BASE_URL, { fetch: same.fetch, cache: {}, headers: { 'x-consumer-id': 'one' } }).getIndex()
    expect(same.calls).toHaveLength(0)
    const two = cacheable()
    await new DruxtClient(BASE_URL, { fetch: two.fetch, cache: {}, headers: { 'X-Consumer-ID': 'two' } }).getIndex()
    expect(two.calls).toHaveLength(1)
    const none = cacheable()
    await new DruxtClient(BASE_URL, { fetch: none.fetch, cache: {} }).getIndex()
    expect(none.calls).toHaveLength(1)

    // A reset empties every consumer's entries.
    resetProcessCache()
    for (const consumer of ['one', 'two']) {
      const after = cacheable()
      await new DruxtClient(BASE_URL, { fetch: after.fetch, cache: {}, headers: { 'X-Consumer-ID': consumer } }).getIndex()
      expect(after.calls).toHaveLength(1)
    }
  })

  it('keeps the merged index no longer than the resource config response allows', async () => {
    // The index says 300 seconds, the resource config it is decorated with says no-store.
    const configured = () => drupal({
      'GET /jsonapi': () => json(index('', ['node--page', 'jsonapi_resource_config--jsonapi_resource_config']), 200, { 'Cache-Control': 'max-age=300, public' }),
      'GET /jsonapi/jsonapi_resource_config/jsonapi_resource_config': () => json({
        data: [{ type: 'jsonapi_resource_config--jsonapi_resource_config', id: 'c1', attributes: { drupal_internal__id: 'node--page', resourceType: 'node--page', resourceFields: {} } }],
      }, 200, { 'Cache-Control': 'no-store' }),
    })
    const first = configured()
    await new DruxtClient(BASE_URL, { fetch: first.fetch, cache: {} }).getIndex()
    expect(first.calls).toHaveLength(2)
    // Nothing was stored, so the next client fetches both again.
    const second = configured()
    await new DruxtClient(BASE_URL, { fetch: second.fetch, cache: {} }).getIndex()
    expect(second.calls).toHaveLength(2)
  })

  it('gives undefined, not null, when the cache must not be used', () => {
    expect(new DruxtClient(BASE_URL).processCache('index')).toBeUndefined()
    expect(new DruxtClient(BASE_URL, { cache: {}, headers: { Authorization: 'Basic ZWRpdG9yOnNlY3JldA==' } }).processCache('index')).toBeUndefined()
    expect(new DruxtClient(BASE_URL, { cache: {} }).processCache('index')).toBeDefined()
  })
})

describe('reading resources', () => {
  it('gets a resource with a query, as the whole document', async () => {
    const document = { data: article, included: [{ type: 'user--user', id: 'u1' }] }
    const { fetch, calls } = drupal({ 'GET /jsonapi': index(), 'GET /jsonapi/node/article/a1?include=uid': document })
    const client = new DruxtClient(BASE_URL, { fetch })
    expect(await client.getResource('node--article', 'a1', { include: 'uid' })).toEqual(document)
    expect(calls[1]).toMatchObject({ method: 'GET', body: undefined, headers: { Accept: 'application/vnd.api+json, application/json;q=0.9, */*;q=0.8' } })
  })

  it('throws on an empty required argument, naming it', async () => {
    const { fetch, calls } = drupal({})
    const client = new DruxtClient(BASE_URL, { fetch })
    await expect(client.getResource('node--page', '')).rejects.toThrow(TypeError)
    await expect(client.getResource('node--page', '')).rejects.toThrow('getResource() needs an id')
    await expect(client.getResource('', 'uuid')).rejects.toThrow('getResource() needs a type')
    await expect(client.getRelated('', 'uuid', 'uid')).rejects.toThrow('getRelated() needs a type')
    await expect(client.getRelated('node--page', '', 'uid')).rejects.toThrow('getRelated() needs an id')
    await expect(client.getRelated('node--page', 'uuid', '')).rejects.toThrow('getRelated() needs a related field name')
    await expect(client.updateResource({ type: '', id: 'u' } as never)).rejects.toThrow('updateResource() needs a type')
    await expect(client.updateResource({ type: 'node--page', id: '' } as never)).rejects.toThrow('updateResource() needs an id')
    await expect(client.createResource({ type: '' })).rejects.toThrow('createResource() needs a type')
    await expect(client.getCollection('')).rejects.toThrow('getCollection() needs a type')
    await expect(client.getCollectionAll('')).rejects.toThrow('getCollectionAll() needs a type')
    expect(calls).toHaveLength(0)
  })

  it('gets a collection with a query', async () => {
    const document = { data: [article], links: {} }
    const { fetch, calls } = drupal({ 'GET /jsonapi': index(), 'GET /jsonapi/node/article?filter%5Bstatus%5D=1': document })
    const client = new DruxtClient(BASE_URL, { fetch })
    expect(await client.getCollection('node--article', new DrupalJsonApiParams().addFilter('status', '1'))).toEqual(document)
    expect(requested(calls)).toEqual(['GET /jsonapi', 'GET /jsonapi/node/article?filter%5Bstatus%5D=1'])
  })

  it('gets a collection the index does not list from its conventional URL', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index(), 'GET /jsonapi/node/recipe': { data: [{ type: 'node--recipe', id: 'r1' }] } })
    const client = new DruxtClient(BASE_URL, { fetch })
    expect(await client.getCollection('node--recipe')).toEqual({ data: [{ type: 'node--recipe', id: 'r1' }] })
    expect(await client.getCollectionAll('node--recipe')).toEqual([{ data: [{ type: 'node--recipe', id: 'r1' }] }])
    expect(requested(calls)).toEqual(['GET /jsonapi', 'GET /jsonapi/node/recipe', 'GET /jsonapi/node/recipe'])
  })

  it('follows links.next across every page of a collection', async () => {
    const page = (offset: number, next?: number) => ({
      data: [{ type: 'node--article', id: `a${offset}` }],
      links: next === undefined ? {} : { next: { href: `${BASE_URL}/jsonapi/node/article?page%5Blimit%5D=1&page%5Boffset%5D=${next}` } },
    })
    const { fetch, calls } = drupal({
      'GET /jsonapi': index(),
      'GET /jsonapi/node/article?page[limit]=1': page(0, 1),
      'GET /jsonapi/node/article?page%5Blimit%5D=1&page%5Boffset%5D=1': page(1, 2),
      'GET /jsonapi/node/article?page%5Blimit%5D=1&page%5Boffset%5D=2': page(2),
    })
    const client = new DruxtClient(BASE_URL, { fetch })
    const collections = await client.getCollectionAll('node--article', 'page[limit]=1')
    expect(collections.map((collection) => collection.data[0]?.id)).toEqual(['a0', 'a1', 'a2'])
    expect(calls).toHaveLength(4)
  })

  it('gets related resources, with the index\'s URL or the conventional one', async () => {
    const { fetch, calls } = drupal({
      'GET /jsonapi': index(),
      'GET /jsonapi/node/article/a1/uid?fields[user--user]=name': { data: { type: 'user--user', id: 'u1' } },
      'GET /jsonapi/node/recipe/r1/field_tags': { data: [] },
    })
    const client = new DruxtClient(BASE_URL, { fetch })
    expect(await client.getRelated('node--article', 'a1', 'uid', 'fields[user--user]=name')).toEqual({ data: { type: 'user--user', id: 'u1' } })
    expect(await client.getRelated('node--recipe', 'r1', 'field_tags')).toEqual({ data: [] })
    expect(requested(calls)).toEqual(['GET /jsonapi', 'GET /jsonapi/node/article/a1/uid?fields[user--user]=name', 'GET /jsonapi/node/recipe/r1/field_tags'])
  })
})

describe('writing resources', () => {
  it('creates a resource with a JSON:API POST', async () => {
    const created = { data: { ...article, id: 'new' } }
    const { fetch, calls } = drupal({ 'GET /jsonapi': index(), 'POST /jsonapi/node/article': () => json(created, 201) })
    const client = new DruxtClient(BASE_URL, { fetch })
    const resource = { type: 'node--article', attributes: { title: 'Hello' } }
    const response = await client.createResource(resource)
    expect(response).toMatchObject({ status: 201, statusText: 'Created', data: created, url: `${BASE_URL}/jsonapi/node/article` })
    expect(calls[1]).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/vnd.api+json' } })
    expect(JSON.parse(String(calls[1]?.body))).toEqual({ data: resource })
  })

  it('creates under the prefix', async () => {
    const { fetch, calls } = drupal({ 'GET /es/jsonapi': index('/es'), 'POST /es/jsonapi/node/article': () => json({ data: article }, 201) })
    await new DruxtClient(BASE_URL, { fetch }).createResource({ type: 'node--article' }, '/es')
    expect(requested(calls)).toEqual(['GET /es/jsonapi', 'POST /es/jsonapi/node/article'])
  })

  it('updates a resource with a JSON:API PATCH', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index(), 'PATCH /jsonapi/node/article/a1': { data: article } })
    const client = new DruxtClient(BASE_URL, { fetch })
    const response = await client.updateResource(article)
    expect(response).toMatchObject({ status: 200, data: { data: article } })
    expect(calls[1]).toMatchObject({ method: 'PATCH', headers: { 'Content-Type': 'application/vnd.api+json' } })
    expect(JSON.parse(String(calls[1]?.body))).toEqual({ data: article })
  })

  it('updates rather than creates a resource that has an id', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index(), 'PATCH /jsonapi/node/article/a1': { data: article } })
    await new DruxtClient(BASE_URL, { fetch }).createResource(article)
    expect(requested(calls)).toEqual(['GET /jsonapi', 'PATCH /jsonapi/node/article/a1'])
  })

  it('answers undefined for a resource type the index does not list', async () => {
    const { fetch } = drupal({ 'GET /jsonapi': index() })
    expect(await new DruxtClient(BASE_URL, { fetch }).getIndex('nothing--here')).toBeUndefined()
  })

  it('creates and updates through the conventional URL for a type the index does not list', async () => {
    const { fetch } = drupal({
      'GET /jsonapi': index(),
      'POST /jsonapi/node/unlisted': () => json({ data: { type: 'node--unlisted', id: 'u1' } }, 201),
      'PATCH /jsonapi/node/unlisted/u1': { data: { type: 'node--unlisted', id: 'u1' } },
    })
    const client = new DruxtClient(BASE_URL, { fetch })
    expect((await client.createResource({ type: 'node--unlisted', attributes: {} })).data.data.type).toBe('node--unlisted')
    expect((await client.updateResource({ type: 'node--unlisted', id: 'u1', attributes: {} } as never)).data.data.id).toBe('u1')
  })

  it('deletes through request(), resolving an empty body to undefined', async () => {
    const { fetch, calls } = drupal({ 'DELETE /jsonapi/node/article/a1': () => new Response(null, { status: 204 }) })
    const response = await new DruxtClient(BASE_URL, { fetch }).request('/jsonapi/node/article/a1', { method: 'DELETE' })
    expect(response).toMatchObject({ status: 204, data: undefined })
    expect(requested(calls)).toEqual(['DELETE /jsonapi/node/article/a1'])
  })
})

describe('request()', () => {
  it('sends a string or URLSearchParams body as it is', async () => {
    const { fetch, calls } = drupal({ 'POST /form': { ok: true } })
    const client = new DruxtClient(BASE_URL, { fetch })
    const params = new URLSearchParams({ a: '1' })
    await client.request('/form', { method: 'POST', body: 'raw' })
    await client.request('/form', { method: 'POST', body: params })
    expect(calls.map((call) => call.body)).toEqual(['raw', params])
    expect(calls.map((call) => call.headers['Content-Type'])).toEqual([undefined, undefined])
  })

  it('sends a Blob, an ArrayBuffer, a Uint8Array and FormData as given, with no JSON:API content type', async () => {
    const { fetch, calls } = drupal({ 'POST /jsonapi/node/article/field_image': () => json({}, 201) })
    const client = new DruxtClient(BASE_URL, { fetch })
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array([1, 2, 3])]))
    const bodies = [new Blob([new Uint8Array([1, 2, 3])]), new ArrayBuffer(3), new Uint8Array([1, 2, 3]), form]
    for (const body of bodies) await client.request('/jsonapi/node/article/field_image', { method: 'POST', body })
    expect(calls.map((call) => call.body)).toEqual(bodies)
    expect(calls.map((call) => call.headers['Content-Type'])).toEqual([undefined, undefined, undefined, undefined])
  })

  it('sends a stream body with duplex half, as fetch requires', async () => {
    const bytes = new TextEncoder().encode('bytes')
    async function* chunks() { yield bytes }
    const stream = () => new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close() } })
    const received: string[] = []
    const duplex: unknown[] = []
    // Node's own Request, as its fetch builds one: it refuses a stream body without duplex.
    const fetch: DruxtFetch = async (url, init) => {
      duplex.push((init as { duplex?: string }).duplex)
      received.push(await new Request(url, init as RequestInit).text())
      return json({}, 201)
    }
    const client = new DruxtClient(BASE_URL, { fetch })
    for (const body of [stream(), chunks(), 'raw', new Blob([bytes])]) {
      await client.request('/jsonapi/file/upload', { method: 'POST', body: body as BodyInit })
    }
    expect(received).toEqual(['bytes', 'bytes', 'raw', 'bytes'])
    // Only a stream needs it.
    expect(duplex).toEqual(['half', 'half', undefined, undefined])
  })

  it('sends a stream from another realm with duplex half, telling it by its shape', async () => {
    const { fetch, calls } = drupal({ 'POST /jsonapi/file/upload': () => json({}, 201) })
    const duplex: unknown[] = []
    const client = new DruxtClient(BASE_URL, { fetch: (url, init) => { duplex.push((init as { duplex?: string }).duplex); return fetch(url, init) } })
    // A stream another realm's ReadableStream made, which this realm's instanceof does not know.
    class ForeignStream { locked = false; getReader() { return new ReadableStream().getReader() } }
    const body = new ForeignStream()
    expect(body instanceof ReadableStream).toBe(false)
    await client.request('/jsonapi/file/upload', { method: 'POST', body })
    expect(duplex).toEqual(['half'])
    expect(calls[0]?.body).toBe(body)
  })

  it('sends an async iterable that is a plain object as it streams, never as JSON', async () => {
    const bytes = new TextEncoder().encode('bytes')
    const received: string[] = []
    const duplex: unknown[] = []
    const fetch: DruxtFetch = async (url, init) => {
      duplex.push((init as { duplex?: string }).duplex)
      received.push(await new Request(url, init as RequestInit).text())
      return json({}, 201)
    }
    const client = new DruxtClient(BASE_URL, { fetch })
    const body = { async *[Symbol.asyncIterator]() { yield bytes } }
    await client.request('/jsonapi/file/upload', { method: 'POST', body: body as never })
    expect(received).toEqual(['bytes'])
    expect(duplex).toEqual(['half'])
  })

  it('sends a JSON document with getReader and locked members as JSON:API, as a stream has methods', async () => {
    const { fetch, calls } = drupal({ 'POST /jsonapi/node/article': () => json({}, 201) })
    const client = new DruxtClient(BASE_URL, { fetch })
    const body = { data: { type: 'node--article' }, getReader: 'reader', locked: false }
    await client.request('/jsonapi/node/article', { method: 'POST', body })
    expect(calls[0]?.body).toBe(JSON.stringify(body))
    expect(calls[0]?.headers['Content-Type']).toBe('application/vnd.api+json')
  })

  it('sends a plain object, an object with no prototype and an array as JSON:API', async () => {
    const { fetch, calls } = drupal({ 'POST /jsonapi/node/article': () => json({}, 201) })
    const client = new DruxtClient(BASE_URL, { fetch })
    const bare = Object.assign(Object.create(null) as object, { data: { type: 'node--article' } })
    for (const body of [{ data: { type: 'node--article' } }, bare, [{ op: 'add' }]]) {
      await client.request('/jsonapi/node/article', { method: 'POST', body })
    }
    expect(calls.map((call) => call.body)).toEqual(['{"data":{"type":"node--article"}}', '{"data":{"type":"node--article"}}', '[{"op":"add"}]'])
    expect(calls.map((call) => call.headers['Content-Type'])).toEqual(Array(3).fill('application/vnd.api+json'))
  })

  it('keeps a body that is not JSON as text', async () => {
    const { fetch } = drupal({ 'GET /robots.txt': () => new Response('User-agent: *') })
    expect((await new DruxtClient(BASE_URL, { fetch }).request('/robots.txt')).data).toBe('User-agent: *')
  })

  it('resolves the statuses validateStatus accepts', async () => {
    const { fetch } = drupal({})
    const response = await new DruxtClient(BASE_URL, { fetch }).request('/missing', { validateStatus: (status) => status < 500 })
    expect(response.status).toBe(404)
  })
})

describe('the request hook', () => {
  it('tells listeners each request\'s method and URL as it starts, then its status and timing, with no headers or body', async () => {
    const { fetch } = drupal({ 'POST /form': { ok: true } })
    const events: unknown[] = []
    const client = new DruxtClient(BASE_URL, { fetch, headers: { 'X-Secret': 'no' }, onRequest: (event) => { events.push(event) } })
    await client.request('/form', { method: 'POST', body: { secret: 'no' } })
    await client.request('/missing', { validateStatus: () => true })
    expect(events).toEqual([
      { type: 'start', id: 1, method: 'POST', url: `${BASE_URL}/form` },
      { type: 'end', id: 1, method: 'POST', url: `${BASE_URL}/form`, status: 200, duration: expect.any(Number) },
      { type: 'start', id: 2, method: 'GET', url: `${BASE_URL}/missing` },
      { type: 'end', id: 2, method: 'GET', url: `${BASE_URL}/missing`, status: 404, duration: expect.any(Number) },
    ])
    expect(JSON.stringify(events)).not.toMatch(/secret/i)
  })

  // Not parsed and written again: a URL written again would encode the quote and the space, and change what is logged.
  it('passes a URL with no query, or with no secret key in it, to a listener exactly as sent', async () => {
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }))
    const urls: string[] = []
    const client = new DruxtClient(BASE_URL, { fetch, onRequest: (event) => { if (event.type === 'start') urls.push(event.url) } })
    await client.request('/jsonapi/node/page', { validateStatus: () => true })
    await client.request("/jsonapi/node/page?filter[title]=Druxt's guide&sort=-created", { validateStatus: () => true })
    expect(urls).toEqual([`${BASE_URL}/jsonapi/node/page`, `${BASE_URL}/jsonapi/node/page?filter[title]=Druxt's guide&sort=-created`])
  })

  it('empties the values of secret query keys in the URL a listener sees, and passes the others as sent', async () => {
    const { fetch } = drupal({})
    const urls: string[] = []
    const client = new DruxtClient(BASE_URL, { fetch, onRequest: (event) => { if (event.type === 'start') urls.push(event.url) } })
    await client.request('/oauth/callback?code=abc&state=xyz&Access_Token=t1&password=p&client_secret=s&token=t2&page=2', { validateStatus: () => true })
    expect(urls).toEqual([`${BASE_URL}/oauth/callback?code=&state=xyz&Access_Token=&password=&client_secret=&token=&page=2`])
  })

  it('marks a response Drupal omitted resources from, with Drupal\'s reason, in the listener\'s end event', async () => {
    const detail = 'Some resources have been omitted because of insufficient authorization.'
    const { fetch } = drupal({ 'GET /jsonapi/view/view': { data: [], meta: { omitted: { detail, links: {} } } }, 'GET /jsonapi/node/page': { data: [] } })
    const ends: unknown[] = []
    const client = new DruxtClient(BASE_URL, { fetch, logger: { info: () => {}, warn: () => {} }, onRequest: (event) => { if (event.type === 'end') ends.push(event) } })
    await client.request('/jsonapi/view/view')
    await client.request('/jsonapi/node/page')
    expect(ends).toEqual([
      expect.objectContaining({ url: `${BASE_URL}/jsonapi/view/view`, status: 200, omitted: detail }),
      expect.not.objectContaining({ omitted: expect.anything() }),
    ])
  })

  it('warns once per resource type, when asked, naming the type and quoting Drupal\'s reason', async () => {
    const detail = 'Some resources have been omitted because of insufficient authorization.'
    const omitted = { data: [], meta: { omitted: { detail, links: {} } } }
    const { fetch } = drupal({ 'GET /jsonapi': index('', ['view--view', 'block--block', 'node--article']), 'GET /jsonapi/view/view': omitted, 'GET /jsonapi/block/block': omitted, 'GET /jsonapi/node/article': { data: [] } })
    const warn = vi.fn()
    const client = new DruxtClient(BASE_URL, { fetch, logger: { info: () => {}, warn }, warnOmitted: true })
    await client.getCollection('view--view')
    await client.getCollection('view--view')
    await client.getCollection('node--article')
    await client.getCollection('block--block')
    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn.mock.calls[0]!.join(' ')).toContain('DRUXT_E01001')
    expect(warn.mock.calls[0]!.join(' ')).toContain('view--view')
    expect(warn.mock.calls[0]!.join(' ')).toContain(`"${detail}"`)
    expect(warn.mock.calls[1]!.join(' ')).toContain('block--block')
    // Not asked, as in production: silent.
    const quiet = vi.fn()
    await new DruxtClient(BASE_URL, { fetch, logger: { info: () => {}, warn: quiet } }).getCollection('view--view')
    expect(quiet).not.toHaveBeenCalled()
  })

  it('warns once per resource type for two clients of one site, and again after either\'s clearCache()', async () => {
    const omitted = { data: [], meta: { omitted: { detail: 'Denied.', links: {} } } }
    const { fetch } = drupal({ 'GET /jsonapi': index('', ['view--view']), 'GET /jsonapi/view/view': omitted })
    const warn = vi.fn()
    const one = new DruxtClient(BASE_URL, { fetch, logger: { info: () => {}, warn }, warnOmitted: true })
    const two = new DruxtClient(BASE_URL, { fetch, logger: { info: () => {}, warn }, warnOmitted: true })
    await one.getCollection('view--view')
    await two.getCollection('view--view')
    expect(warn).toHaveBeenCalledTimes(1)
    one.clearCache()
    await two.getCollection('view--view')
    expect(warn).toHaveBeenCalledTimes(2)
    await one.getCollection('view--view')
    expect(warn).toHaveBeenCalledTimes(2)
    two.clearCache()
    await one.getCollection('view--view')
    expect(warn).toHaveBeenCalledTimes(3)
  })

  it('warns separately for two sites', async () => {
    const other = 'https://other.test'
    const omitted = { data: [], meta: { omitted: { detail: 'Denied.', links: {} } } }
    const here = drupal({ 'GET /jsonapi': index('', ['view--view']), 'GET /jsonapi/view/view': omitted })
    const there = vi.fn(async (input: unknown) => json(String(input) === `${other}/jsonapi` ? { links: { 'view--view': { href: `${other}/jsonapi/view/view` } } } : omitted))
    const warn = vi.fn()
    const one = new DruxtClient(BASE_URL, { fetch: here.fetch, logger: { info: () => {}, warn }, warnOmitted: true })
    const two = new DruxtClient(other, { fetch: there as DruxtFetch, logger: { info: () => {}, warn }, warnOmitted: true })
    await one.getCollection('view--view')
    await two.getCollection('view--view')
    expect(warn).toHaveBeenCalledTimes(2)
    one.clearCache()
    await two.getCollection('view--view')
    expect(warn).toHaveBeenCalledTimes(2)
    two.clearCache()
  })

  it('names the type Drupal omitted, read from each omitted item\'s link, beside the type asked for', async () => {
    const omitted = { data: [], meta: { omitted: { detail: 'Denied.', links: { 'item--a': { href: `${BASE_URL}/jsonapi/user/user/u9`, meta: { rel: 'item' } }, 'item--b': { href: `${BASE_URL}/jsonapi/taxonomy_term/secret_tags/t9`, meta: { rel: 'item' } } } } } }
    const { fetch } = drupal({ 'GET /jsonapi': index('', ['node--event']), 'GET /jsonapi/node/event': omitted })
    const warn = vi.fn()
    await new DruxtClient(BASE_URL, { fetch, logger: { info: () => {}, warn }, warnOmitted: true }).getCollection('node--event')
    const lines = warn.mock.calls.map((args) => args.join(' '))
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('user--user')
    expect(lines[1]).toContain('taxonomy_term--secret_tags')
  })

  it('catches a listener whose promise rejects', async () => {
    const { fetch } = drupal({ 'GET /x': { ok: true } })
    const warn = vi.fn()
    const client = new DruxtClient(BASE_URL, { fetch, logger: { info: () => {}, warn } })
    client.onRequest(async () => { throw new Error('async listener') })
    await client.request('/x')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(warn).toHaveBeenCalledWith('A request listener failed:', expect.objectContaining({ message: 'async listener' }))
  })

  it('adds and removes listeners, marks a request that got no response, and survives a listener that throws', async () => {
    const fetch: DruxtFetch = vi.fn(async () => { throw new TypeError('fetch failed') })
    const client = new DruxtClient('https://user:pass@drupal.test', { fetch, logger: { info: () => {}, warn: () => {} } })
    const ends: unknown[] = []
    client.onRequest(() => { throw new Error('listener') })
    const stop = client.onRequest((event) => { if (event.type === 'end') ends.push(event) })
    await expect(client.request('/x')).rejects.toThrow('fetch failed')
    stop()
    await expect(client.request('/x')).rejects.toThrow('fetch failed')
    expect(ends).toEqual([{ type: 'end', id: 1, method: 'GET', url: 'https://drupal.test/x', duration: expect.any(Number), failed: true }])
  })
})

describe('headers', () => {
  it('sends the headers option with every request', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index() })
    await new DruxtClient(BASE_URL, { fetch, headers: { 'X-Consumer-ID': 'site' } }).getIndex()
    expect(calls[0]?.headers['X-Consumer-ID']).toBe('site')
  })

  it('ignores an axios option, 1.x\'s Axios settings: its headers are not sent', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index() })
    const options = { fetch, axios: { headers: { 'X-One': 'axios', 'X-Two': 'axios' } }, headers: { 'X-Two': 'headers' } }
    await new DruxtClient(BASE_URL, options as ConstructorParameters<typeof DruxtClient>[1]).getIndex()
    expect(calls[0]?.headers['X-Two']).toBe('headers')
    expect(calls[0]?.headers).not.toHaveProperty('X-One')
  })

  it('adds headers to every later request with addHeaders()', async () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index(), 'GET /jsonapi/node/article/a1': { data: article } })
    const client = new DruxtClient(BASE_URL, { fetch })
    await client.getIndex()
    expect(client.addHeaders({ 'Accept-Language': 'es' })).toBeUndefined()
    expect(client.addHeaders()).toBeUndefined()
    await client.getResource('node--article', 'a1')
    expect(calls.map((call) => call.headers['Accept-Language'])).toEqual([undefined, 'es'])
  })

  it('overrides and removes a header whatever the case of its name', async () => {
    const { fetch, calls } = drupal({ 'GET /file': { ok: true } })
    const client = new DruxtClient(BASE_URL, { fetch, headers: { 'Authorization': 'Basic ZWRpdG9yOnNlY3JldA==', 'X-Consumer-ID': 'site', 'accept': 'application/json' } })
    await client.request('/file', { headers: { 'authorization': undefined, 'x-consumer-id': 'other' } })
    expect(calls[0]?.headers).toEqual({ 'x-consumer-id': 'other', 'accept': 'application/json' })
  })

  it('lets one request override or remove a header', async () => {
    const { fetch, calls } = drupal({ 'GET /file': { ok: true } })
    const client = new DruxtClient(BASE_URL, { fetch, headers: { 'X-Consumer-ID': 'site' } })
    await client.request('/file', { headers: { 'X-Consumer-ID': 'other', 'Accept': undefined } })
    expect(calls[0]?.headers).toEqual({ 'X-Consumer-ID': 'other' })
  })
})

describe('the logger', () => {
  // An index whose resource config Drupal refuses: the client warns and carries on.
  const forbiddenConfig = () => drupal({
    'GET /jsonapi': index('', ['node--article', 'jsonapi_resource_config--jsonapi_resource_config']),
    'GET /jsonapi/jsonapi_resource_config/jsonapi_resource_config': () => json({ errors: [{ title: 'Forbidden' }] }, 403),
  })

  it('sends warnings to the logger given, not to the console', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logger = { info: vi.fn(), warn: vi.fn() }
    const client = new DruxtClient(BASE_URL, { fetch: forbiddenConfig().fetch, logger })
    expect(await client.getIndex('node--article')).toEqual({ href: '/jsonapi/node/article' })
    expect(logger.warn).toHaveBeenCalledOnce()
    expect(logger.warn.mock.calls[0]?.[0]).toMatch(/^403: Forbidden\n\nURL: https:\/\/drupal\.test\/jsonapi\/jsonapi_resource_config/)
    expect(warn).not.toHaveBeenCalled()
  })

  it('takes the console as a logger', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await new DruxtClient(BASE_URL, { fetch: forbiddenConfig().fetch, logger: console }).getIndex()
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]?.[0]).toMatch(/^403: Forbidden/)
  })

  it('warns to the console, tagged, without a logger', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await new DruxtClient(BASE_URL, { fetch: forbiddenConfig().fetch }).getIndex()
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]?.[0]).toBe('[DruxtClient]')
    expect(warn.mock.calls[0]?.[1]).toMatch(/^403: Forbidden/)
  })

  it('logs each request URL to the logger in debug mode', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = { info: vi.fn(), warn: vi.fn() }
    const { fetch } = drupal({ 'GET /jsonapi': index(), 'GET /jsonapi/node/article/a1': { data: article } })
    await new DruxtClient(BASE_URL, { fetch, logger, debug: true }).getResource('node--article', 'a1')
    expect(logger.info.mock.calls).toEqual([[`${BASE_URL}/jsonapi`], [`${BASE_URL}/jsonapi/node/article/a1`]])
    expect(info).not.toHaveBeenCalled()
  })
})
