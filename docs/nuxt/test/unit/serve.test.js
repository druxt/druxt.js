import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

const { createHandler } = require('~/scripts/serve')

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
})
