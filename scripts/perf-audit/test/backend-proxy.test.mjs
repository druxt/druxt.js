import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import net from 'node:net'
import { existsSync, readFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startProxy } from '../backend-proxy.mjs'
import { parseLogLines } from '../backend-log.mjs'

function startUpstream() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url.startsWith('/jsonapi')) {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end('{}')
      } else {
        res.writeHead(404)
        res.end('not found')
      }
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

async function waitForLines(logFile, count, timeoutMs = 2000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const entries = parseLogLines(existsSync(logFile) ? readFileSync(logFile, 'utf8') : '')
    if (entries.length >= count) return entries
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error('timed out waiting for proxy log lines')
}

test('startProxy forwards requests and logs each completed one', async () => {
  const { server: upstream, port: upstreamPort } = await startUpstream()
  const dir = mkdtempSync(join(tmpdir(), 'perf-audit-proxy-'))
  const logFile = join(dir, 'backend-requests.log')
  const proxy = await startProxy({ port: 0, target: `http://127.0.0.1:${upstreamPort}`, logFile })

  const okRes = await fetch(`http://127.0.0.1:${proxy.port}/jsonapi?foo=bar`)
  const missingRes = await fetch(`http://127.0.0.1:${proxy.port}/missing`)
  assert.equal(okRes.status, 200)
  assert.equal(missingRes.status, 404)

  const entries = await waitForLines(logFile, 2)
  assert.equal(entries.length, 2)
  assert.deepEqual(entries[0], { method: 'GET', path: '/jsonapi?foo=bar', status: 200 })
  assert.deepEqual(entries[1], { method: 'GET', path: '/missing', status: 404 })

  await proxy.close()
  await new Promise((resolve) => upstream.close(resolve))
})

test('startProxy answers 502 and logs it when the upstream is unreachable', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'perf-audit-proxy-'))
  const logFile = join(dir, 'backend-requests.log')
  // Nothing listens on this port.
  const proxy = await startProxy({ port: 0, target: 'http://127.0.0.1:1', logFile })

  const res = await fetch(`http://127.0.0.1:${proxy.port}/jsonapi`)
  assert.equal(res.status, 502)

  const entries = await waitForLines(logFile, 1)
  assert.deepEqual(entries[0], { method: 'GET', path: '/jsonapi', status: 502 })

  await proxy.close()
})

test('startProxy answers 504 and logs it when the upstream never responds', async () => {
  // Accepts the TCP connection but never writes an HTTP response, so the
  // proxy's own request to it hangs until the upstream timeout fires.
  const sockets = new Set()
  const upstream = net.createServer((socket) => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)) })
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve))
  const upstreamPort = upstream.address().port

  const dir = mkdtempSync(join(tmpdir(), 'perf-audit-proxy-'))
  const logFile = join(dir, 'backend-requests.log')
  const proxy = await startProxy({ port: 0, target: `http://127.0.0.1:${upstreamPort}`, logFile, upstreamTimeoutMs: 100 })

  const res = await fetch(`http://127.0.0.1:${proxy.port}/jsonapi`)
  assert.equal(res.status, 504)

  const entries = await waitForLines(logFile, 1)
  assert.deepEqual(entries[0], { method: 'GET', path: '/jsonapi', status: 504 })

  await proxy.close()
  for (const socket of sockets) socket.destroy()
  await new Promise((resolve) => upstream.close(resolve))
})
