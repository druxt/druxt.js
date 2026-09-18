import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { analyseHtml, probe } from '../ssr.mjs'

const page = readFileSync(new URL('./fixtures/page.html', import.meta.url), 'utf8')
const errorPage = readFileSync(new URL('./fixtures/error-page.html', import.meta.url), 'utf8')

test('analyseHtml measures the payload and counts fetch keys', () => {
  const result = analyseHtml(page)
  assert.equal(result.htmlBytes, Buffer.byteLength(page))
  assert.ok(result.nuxtBytes > 50 && result.nuxtBytes < result.htmlBytes)
  assert.equal(result.fetchKeys, 2)
  assert.equal(result.errorState, null)
})

test('analyseHtml surfaces the Nuxt error state', () => {
  const result = analyseHtml(errorPage)
  assert.match(result.errorState, /500/)
  assert.equal(result.fetchKeys, 0)
})

test('probe times a request against a local server', async () => {
  const server = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(page) })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  try {
    const result = await probe(`http://127.0.0.1:${port}/`)
    assert.equal(result.status, 200)
    assert.ok(result.ttfbMs >= 0 && result.totalMs >= result.ttfbMs)
    assert.equal(result.fetchKeys, 2)
  } finally {
    server.close()
  }
})

test('analyseHtml tolerates script tag attributes', () => {
  const html = '<script nonce="abc" type="text/javascript">window.__NUXT__=(function(a){return {error:null}}(null));</script>'
  const result = analyseHtml(html)
  assert.ok(result.nuxtBytes > 0)
  assert.equal(result.errorState, null)
})

test('analyseHtml extracts nested error objects', () => {
  const html = '<script>window.__NUXT__=(function(a){return {layout:"default",error:{statusCode:500,message:"boom",data:{path:"/x"}},state:{}}}(null));</script>'
  const result = analyseHtml(html)
  assert.match(result.errorState, /statusCode:500/)
  assert.match(result.errorState, /data:\{path:"\/x"\}/)
})
