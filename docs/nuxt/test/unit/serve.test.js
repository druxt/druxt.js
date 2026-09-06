import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

const { createHandler, parseRedirects, loadRedirects, REDIRECTS_MAPS } = require('~/scripts/serve')

const request = (server, urlPath, options = {}) => new Promise((resolve, reject) => {
  const { port } = server.address()
  const req = http.request({ host: '127.0.0.1', port, path: urlPath, ...options }, (res) => {
    let body = ''
    res.on('data', (chunk) => { body += chunk })
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
  })
  req.on('error', reject)
  req.end()
})

describe('scripts/serve', () => {
  let dist
  let server

  beforeAll(async () => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'serve-test-'))
    fs.writeFileSync(path.join(dist, 'index.html'), '<h1>home</h1>')
    fs.writeFileSync(path.join(dist, '404.html'), '<h1>not found</h1>')
    fs.mkdirSync(path.join(dist, 'guide'))
    fs.writeFileSync(path.join(dist, 'guide', 'index.html'), '<h1>guide</h1>')
    fs.mkdirSync(path.join(dist, '_nuxt'))
    fs.writeFileSync(path.join(dist, '_nuxt', 'app.abc123.js'), 'window.app = 1')
    fs.writeFileSync(path.join(dist, 'sitemap.xml'), '<urlset/>')
    server = http.createServer(createHandler(dist))
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  })

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
    fs.rmSync(dist, { recursive: true, force: true })
  })

  test('serves a generated page at its canonical slashless URL', async () => {
    const res = await request(server, '/guide')
    expect(res.status).toBe(200)
    expect(res.body).toBe('<h1>guide</h1>')
    expect(res.headers['content-type']).toBe('text/html; charset=utf-8')
  })

  test('redirects the trailing-slash duplicate to the canonical URL', async () => {
    const res = await request(server, '/guide/')
    expect(res.status).toBe(301)
    expect(res.headers.location).toBe('/guide')
  })

  test('preserves the query string across the redirect', async () => {
    const res = await request(server, '/guide/?q=1')
    expect(res.status).toBe(301)
    expect(res.headers.location).toBe('/guide?q=1')
  })

  test('leaves the bare root alone', async () => {
    const res = await request(server, '/')
    expect(res.status).toBe(200)
    expect(res.body).toBe('<h1>home</h1>')
  })

  test('serves real files directly', async () => {
    const res = await request(server, '/sitemap.xml')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/xml')
  })

  test('unknown paths get the 404 page with a real 404 status', async () => {
    const res = await request(server, '/definitely-missing-page')
    expect(res.status).toBe(404)
    expect(res.body).toBe('<h1>not found</h1>')
  })

  test('hashed assets are immutable, pages must revalidate', async () => {
    const asset = await request(server, '/_nuxt/app.abc123.js')
    expect(asset.headers['cache-control']).toBe('public, max-age=31536000, immutable')
    const page = await request(server, '/guide')
    expect(page.headers['cache-control']).toBe('no-cache')
  })

  test('answers If-Modified-Since with a 304', async () => {
    const first = await request(server, '/guide')
    const res = await request(server, '/guide', { headers: { 'if-modified-since': first.headers['last-modified'] } })
    expect(res.status).toBe(304)
  })

  test('path traversal cannot escape dist', async () => {
    const res = await request(server, '/..%2f..%2fetc%2fpasswd')
    expect(res.status).toBe(404)
  })

  test('non-GET methods are refused', async () => {
    const res = await request(server, '/guide', { method: 'POST' })
    expect(res.status).toBe(405)
  })

  test('a file lost between stat and open gets a 500, not a crash', async () => {
    const { PassThrough } = require('stream')
    jest.spyOn(fs, 'createReadStream').mockImplementationOnce(() => {
      const stream = new PassThrough()
      process.nextTick(() => stream.emit('error', new Error('gone')))
      return stream
    })
    const res = await request(server, '/guide')
    expect(res.status).toBe(500)
    const after = await request(server, '/guide')
    expect(after.status).toBe(200)
  })
})

describe('scripts/serve legacy redirects', () => {
  const conf = [
    '# comment',
    '',
    '~^(www\\.)?druxtjs\\.org/guide/theming/?$ https://druxtjs.org/how-to/theming;',
    '~^(www\\.)?druxtjs\\.org/guide/deprecations\\.html/?$ https://druxtjs.org/modules/druxt/deprecations;',
    '~^(www\\.)?druxtjs\\.org/api/menu\\.html/?$ https://druxtjs.org/api/packages/menu/;',
    '~^blocks.druxtjs.org/api/mixins/block.html https://druxtjs.org/api/packages/blocks/mixins/block;',
    '~^blocks.druxtjs.org https://druxtjs.org$request_uri;',
  ].join('\n')

  let dist
  let server

  beforeAll(async () => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'serve-legacy-test-'))
    fs.writeFileSync(path.join(dist, '404.html'), '<h1>not found</h1>')
    server = http.createServer(createHandler(dist, parseRedirects(conf)))
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  })

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
    fs.rmSync(dist, { recursive: true, force: true })
  })

  test('parses only the druxtjs.org rules, with relative slashless targets', () => {
    expect(parseRedirects(conf)).toEqual([
      { pattern: /^\/guide\/theming\/?$/, target: '/how-to/theming' },
      { pattern: /^\/guide\/deprecations\.html\/?$/, target: '/modules/druxt/deprecations' },
      { pattern: /^\/api\/menu\.html\/?$/, target: '/api/packages/menu' },
    ])
  })

  test('redirects a legacy URL permanently, query preserved', async () => {
    const res = await request(server, '/guide/theming?ref=1')
    expect(res.status).toBe(301)
    expect(res.headers.location).toBe('/how-to/theming?ref=1')
  })

  test('the slashed and .html forms land in one hop', async () => {
    const slashed = await request(server, '/guide/theming/')
    expect(slashed.headers.location).toBe('/how-to/theming')
    const html = await request(server, '/guide/deprecations.html')
    expect(html.headers.location).toBe('/modules/druxt/deprecations')
  })

  test('a rule is anchored, not a prefix', async () => {
    const res = await request(server, '/guide/theming-extra')
    expect(res.status).toBe(404)
  })

  test('the repo map loads every druxtjs.org rule', () => {
    const map = REDIRECTS_MAPS.find((file) => file.endsWith(path.join('.lagoon', 'redirects-map.conf')))
    const rules = fs.readFileSync(map, 'utf8').split('\n')
      .filter((line) => line.startsWith('~^(www\\.)?druxtjs\\.org'))
    expect(rules.length).toBeGreaterThan(0)
    const redirects = loadRedirects(map)
    expect(redirects).toHaveLength(rules.length)
    const legacy = (pathname) => (redirects.find(({ pattern }) => pattern.test(pathname)) || {}).target
    expect(legacy('/guide')).toBe('/tutorials')
    expect(legacy('/guide/getting-started')).toBe('/tutorials/getting-started')
    expect(legacy('/guide/theming')).toBe('/how-to/theming')
    expect(legacy('/guide/deprecations')).toBe('/modules/druxt/deprecations')
    expect(legacy('/guides/node-client')).toBe('/how-to/use-the-druxt-client')
    expect(legacy('/api/stores/schema.html')).toBe('/api/packages/schema/stores/schema')
  })

  test('no map means no redirects, not a crash', () => {
    expect(loadRedirects(undefined)).toEqual([])
  })
})
