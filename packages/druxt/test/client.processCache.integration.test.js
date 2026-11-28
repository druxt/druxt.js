/**
 * @jest-environment node
 *
 * The server process cache, end to end: the real DruxtClient and the real
 * Axios, against a small stand-in for Drupal on a local port. Nothing is
 * mocked, so a breakpoint in packages/druxt/src stops where a server render
 * would. The other process cache suites mock Axios and cover the logic alone.
 *
 * To step through one scenario, see "Debugging a test" in CONTRIBUTING.md.
 * While paused, `dump()` in the debug console shows what the cache holds.
 */
const http = require('http')

const { DruxtClient } = require('../src')
const cache = require('../src/utils/processCache')
// test/__mocks__/axios.js replaces Axios in every test. This is the real one.
const axios = jest.requireActual('axios')

// ---------------------------------------------------------------------------
// The stand-in for Drupal. Change `drupal.headers` in a scenario to change what
// "Drupal" answers with. `drupal.log` lists every request that reached it.
// ---------------------------------------------------------------------------
const drupal = {
  headers: { 'Cache-Control': 'public, max-age=300' },
  log: [],
  pad: 0,
  // Milliseconds "Drupal" takes to answer, to leave time for something to happen meanwhile.
  delay: 0,
}
let server
let baseUrl

beforeAll(async () => {
  server = http.createServer((req, res) => {
    drupal.log.push({ url: req.url, language: req.headers['accept-language'], consumer: req.headers['x-consumer-id'], authorization: req.headers.authorization })
    const body = req.url.replace(/\?.*/, '').endsWith('/jsonapi')
      ? { links: { 'node--page': { href: `${baseUrl}/jsonapi/node/page` } } }
      : { data: { type: 'node--page', id: req.url.split('/').pop(), attributes: { title: `Answer ${drupal.log.length}`, body: 'x'.repeat(drupal.pad) } } }
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/vnd.api+json', ...drupal.headers })
      res.end(JSON.stringify(body))
    }, drupal.delay)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})
afterAll(() => new Promise((resolve) => server.close(resolve)))

beforeEach(() => {
  cache.resetProcessCache()
  drupal.headers = { 'Cache-Control': 'public, max-age=300' }
  drupal.log = []
  drupal.pad = 0
  drupal.delay = 0
})

// One server render: @nuxtjs/axios makes a new Axios instance for each request
// a visitor sends, and Druxt makes a new DruxtClient on it. `headers` are the
// instance's defaults, where @nuxtjs/axios puts the visitor's own headers.
const render = ({ headers = {}, options = { content: true }, setup } = {}) => {
  const instance = axios.create({ baseURL: baseUrl, headers: { common: headers } })
  if (setup) setup(instance)
  return new DruxtClient(baseUrl, { axios: instance, cache: options })
}

// What "Drupal" was asked for, without the index.
const asked = () => drupal.log.filter((entry) => !entry.url.endsWith('/jsonapi'))

// What the cache holds, as scope -> partition -> keys. Call it from the debug console too.
const dump = () => {
  const scopes = global[Symbol.for('druxt.processCache')]
  const out = {}
  for (const [scope, partitions] of scopes) {
    out[scope] = {}
    for (const [partition, entries] of partitions) {
      // A content key is JSON of [the client's index key, the URL]; the URL is the readable part.
      out[scope][partition || '(no consumer)'] = [...entries.keys()].map((key) => {
        try { return JSON.parse(key)[1] } catch { return key }
      })
    }
  }
  return out
}
global.dump = dump


// ---------------------------------------------------------------------------
// The scenarios.
// ---------------------------------------------------------------------------
describe('DruxtClient process cache, against a server', () => {
  test('two renders, one request', async () => {
    // Breakpoints worth setting first:
    //   client.js       DruxtClient.get()            the lookup, the request, the store
    //   processCache.js processCache()               who may use the cache at all
    //   processCache.js parseCacheLifetime()         how long Drupal lets it be kept
    const first = await render().getResource('node--page', 'a')
    const second = await render().getResource('node--page', 'a')
    expect(asked()).toHaveLength(1)
    expect(second.data.attributes.title).toBe(first.data.attributes.title)
  })

  test('off without cache.content, apart from the index', async () => {
    await render({ options: {} }).getResource('node--page', 'a')
    await render({ options: {} }).getResource('node--page', 'a')
    expect(asked()).toHaveLength(2)
    expect(drupal.log.filter((e) => e.url.endsWith('/jsonapi'))).toHaveLength(1)
  })

  test('Drupal decides: a response it marks private or no-cache is not kept', async () => {
    // What a Drupal site answers while its page cache maximum age is 0.
    drupal.headers = { 'Cache-Control': 'must-revalidate, no-cache, private' }
    await render().getResource('node--page', 'a')
    await render().getResource('node--page', 'a')
    expect(asked()).toHaveLength(2)
  })

  test('a signed-in render never reads or writes the cache', async () => {
    await render().getResource('node--page', 'a')
    await render({ headers: { Authorization: 'Bearer token' } }).getResource('node--page', 'a')
    await render().getResource('node--page', 'a')
    // The anonymous copy was served to the third render, and never to the second.
    expect(asked()).toHaveLength(2)
    expect(asked()[1].authorization).toBe('Bearer token')
  })

  test('a clear empties it, and a request in flight at the time is not stored', async () => {
    // Breakpoints: client.js  the `after.set(...)` in DruxtClient.get(); processCache.js  set() and resetProcessCache().
    const client = render()
    await client.getIndex()
    drupal.delay = 50
    const inFlight = client.getResource('node--page', 'a')
    await new Promise((resolve) => setTimeout(resolve, 20))
    client.clearCache()
    await inFlight
    expect(Object.values(dump().content || {}).flat()).toHaveLength(0)
  })

  test('bypassCache asks Drupal and stores the fresh answer', async () => {
    await render().getResource('node--page', 'a')
    const fresh = await render().getResource('node--page', 'a', undefined, undefined, { bypassCache: true })
    const after = await render().getResource('node--page', 'a')
    expect(asked()).toHaveLength(2)
    expect(after.data.attributes.title).toBe(fresh.data.attributes.title)
  })

  test('a response that varies by Accept-Language is not kept', async () => {
    drupal.headers = { 'Cache-Control': 'public, max-age=300', Vary: 'Accept-Language' }
    await render({ headers: { 'Accept-Language': 'en' } }).getResource('node--page', 'a')
    await render({ headers: { 'Accept-Language': 'en' } }).getResource('node--page', 'a')
    expect(asked()).toHaveLength(2)
  })
})
