/**
 * @jest-environment node
 *
 * The server process cache, end to end: the real DruxtClient and the real
 * Axios, sending requests over HTTP to the Decoupled Drupal mock. Nothing of
 * Druxt's is mocked, so a breakpoint in packages/druxt/src stops where a
 * server render would. The other process cache suites replace Axios and cover
 * the logic alone.
 *
 * To step through one scenario, see "Debugging a test" in CONTRIBUTING.md.
 * While paused, `dump()` in the debug console shows what the cache holds.
 */
const http = require('http')

const { loadPreset } = require('decoupled-drupal-mock/jest')

const { DruxtClient } = require('../src')
const cache = require('../src/utils/processCache')
// test/__mocks__/axios.js replaces Axios in every test. This is the real one.
const axios = jest.requireActual('axios')

// The response headers and the delay a scenario asks for. The mock answers at
// once and without a Cache-Control or Vary header, so an extension adds the
// headers and the server below waits.
const answers = { headers: {}, delay: 0 }
const cacheable = { 'Cache-Control': 'public, max-age=300' }

let drupal
let server
let baseUrl
let article

beforeAll(async () => {
  // The mock's own HTTP server is an ES module, which this suite cannot load,
  // so this one hands each request to the mock and sends back its answer.
  server = http.createServer((req, res) => {
    const { status, headers, body } = drupal.handle(req.method, `${baseUrl}${req.url}`, req.headers)
    setTimeout(() => {
      res.writeHead(status, headers)
      res.end(typeof body === 'string' ? body : JSON.stringify(body))
    }, answers.delay)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`

  // An engine of this suite's own, so the links it writes name this server.
  drupal = loadPreset('umami', { baseUrl })
  article = drupal.handle('GET', `${baseUrl}/jsonapi/node/article?page[limit]=1`).body.data[0].id
})
afterAll(() => new Promise((resolve) => server.close(resolve)))

beforeEach(() => {
  cache.resetProcessCache()
  answers.headers = cacheable
  answers.delay = 0
  // reset() drops the request log and the extension, so both start again.
  drupal.reset()
  drupal.use({
    name: 'cache-headers',
    answer: (request, next) => {
      const answer = next()
      return { ...answer, headers: { ...answer.headers, ...answers.headers } }
    },
  })
})

// One server render: @nuxtjs/axios makes a new Axios instance for each request
// a visitor sends, and Druxt makes a new DruxtClient on it. `headers` are the
// instance's defaults, where @nuxtjs/axios puts the visitor's own headers.
const render = ({ headers = {}, options = { content: true } } = {}) => {
  const instance = axios.create({ baseURL: baseUrl, headers: { common: headers } })
  return new DruxtClient(baseUrl, { axios: instance, cache: options })
}

const isIndex = ({ path }) => path === '/jsonapi'
// What Drupal was asked for, without the index.
const asked = () => drupal.requests().filter((request) => !isIndex(request))

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

describe('DruxtClient process cache, against a server', () => {
  test('two renders, one request', async () => {
    const first = await render().getResource('node--article', article)
    const second = await render().getResource('node--article', article)
    expect(asked()).toHaveLength(1)
    expect(first.data.id).toBe(article)
    expect(second).toStrictEqual(first)
  })

  test('off without cache.content, apart from the index', async () => {
    await render({ options: {} }).getResource('node--article', article)
    await render({ options: {} }).getResource('node--article', article)
    expect(asked()).toHaveLength(2)
    expect(drupal.requests().filter(isIndex)).toHaveLength(1)
  })

  test('Drupal decides: a response it marks private or no-cache is not kept', async () => {
    // What a Drupal site answers while its page cache maximum age is 0.
    answers.headers = { 'Cache-Control': 'must-revalidate, no-cache, private' }
    await render().getResource('node--article', article)
    await render().getResource('node--article', article)
    expect(asked()).toHaveLength(2)
  })

  test('a response with no Cache-Control is not kept', async () => {
    answers.headers = {}
    await render().getResource('node--article', article)
    await render().getResource('node--article', article)
    expect(asked()).toHaveLength(2)
  })

  test('a signed-in render never reads or writes the cache', async () => {
    const { access } = drupal.tokenFor('admin')
    await render().getResource('node--article', article)
    await render({ headers: { Authorization: `Bearer ${access}` } }).getResource('node--article', article)
    await render().getResource('node--article', article)
    // The anonymous copy was served to the third render, and never to the second.
    expect(asked()).toHaveLength(2)
    expect(asked()[1].headers.authorization).toBe(`Bearer ${access}`)
  })

  test('a clear empties it, and a request in flight at the time is not stored', async () => {
    const client = render()
    await client.getIndex()
    answers.delay = 50
    const inFlight = client.getResource('node--article', article)
    await new Promise((resolve) => setTimeout(resolve, 20))
    client.clearCache()
    await inFlight
    expect(Object.values(dump().content || {}).flat()).toHaveLength(0)
  })

  test('bypassCache asks Drupal and stores the answer', async () => {
    await render().getResource('node--article', article)
    await render().getResource('node--article', article, undefined, undefined, { bypassCache: true })
    await render().getResource('node--article', article)
    expect(asked()).toHaveLength(2)
  })

  test('a response that varies by Accept-Language is not kept', async () => {
    answers.headers = { ...cacheable, Vary: 'Accept-Language' }
    await render({ headers: { 'Accept-Language': 'en' } }).getResource('node--article', article)
    await render({ headers: { 'Accept-Language': 'en' } }).getResource('node--article', article)
    expect(asked()).toHaveLength(2)
  })
})
