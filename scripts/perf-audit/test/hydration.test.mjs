/* global globalThis */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chmod, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { summariseLoads, probeHydration, connect, loadOnce, INIT_SCRIPT } from '../hydration.mjs'

test('summariseLoads takes the median of each measure', () => {
  const loads = [
    { serverNodes: 129, discardedNodes: 117, layoutShift: 1.7661 },
    { serverNodes: 129, discardedNodes: 117, layoutShift: 1.8247 },
    { serverNodes: 129, discardedNodes: 0, layoutShift: 0.1991 },
  ]
  assert.deepEqual(summariseLoads(loads), { serverNodes: 129, discardedNodes: 117, layoutShift: 1.766 })
})

test('the page script watches layout shifts and the server-rendered fetch keys', () => {
  assert.match(INIT_SCRIPT, /layout-shift/)
  assert.match(INIT_SCRIPT, /\[data-fetch-key\]/)
})

test('probeHydration refuses to run without Chrome', async () => {
  await assert.rejects(probeHydration('http://localhost:1/', { chromePath: '' }), /CHROME_PATH is not set/)
})

test('probeHydration rejects when Chrome cannot start, and leaves no profile behind', async () => {
  const before = (await readdir(tmpdir())).filter((name) => name.startsWith('perf-audit-chrome-')).length
  await assert.rejects(probeHydration('http://localhost:1/', { chromePath: '/nonexistent/chrome', loads: 1 }), /Chrome did not start/)
  const after = (await readdir(tmpdir())).filter((name) => name.startsWith('perf-audit-chrome-')).length
  assert.equal(after, before)
})

// A DevTools socket that opens, records what is sent, and can be closed from the test.
class FakeSocket {
  constructor() { FakeSocket.last = this; this.sent = []; setTimeout(() => this.onopen && this.onopen(), 0) }
  send(data) { this.sent.push(JSON.parse(data)) }
  close() { if (this.onclose) this.onclose() }
}

test('a command pending when the DevTools socket closes is rejected, not left unsettled', async () => {
  const original = globalThis.WebSocket
  globalThis.WebSocket = FakeSocket
  try {
    const cdp = await connect('ws://devtools')
    const pending = cdp.send('Runtime.evaluate', { expression: '1' })
    FakeSocket.last.close()
    await assert.rejects(pending, /DevTools socket closed/)
    await assert.rejects(cdp.send('Page.enable'), /DevTools socket closed/)
  } finally {
    globalThis.WebSocket = original
  }
})

test('a command Chrome never answers is rejected after the command timeout', async () => {
  const original = globalThis.WebSocket
  globalThis.WebSocket = FakeSocket
  try {
    const cdp = await connect('ws://devtools', { commandTimeoutMs: 50 })
    await assert.rejects(cdp.send('Page.navigate', { url: 'http://localhost' }), /Page.navigate did not answer within 50 ms/)
  } finally {
    globalThis.WebSocket = original
  }
})

test('Chrome is started without /dev/shm, which is too small in containers', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'fake-chrome-'))
  const chrome = join(dir, 'chrome')
  await writeFile(chrome, `#!/bin/sh\necho "$@" > ${join(dir, 'args')}\nexit 1\n`)
  await chmod(chrome, 0o755)
  await assert.rejects(probeHydration('http://localhost:1/', { chromePath: chrome, loads: 1 }))
  assert.match(await readFile(join(dir, 'args'), 'utf8'), /--disable-dev-shm-usage/)
})

test('a page that crashes in Chrome fails at once, not after the settle timeout', async () => {
  const listeners = new Set()
  const cdp = {
    on: (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
    send: async (method) => {
      if (method === 'Target.createBrowserContext') return { browserContextId: 'context' }
      if (method === 'Target.createTarget') return { targetId: 'target' }
      if (method === 'Target.attachToTarget') return { sessionId: 'session' }
      if (method === 'Page.navigate') setTimeout(() => { for (const l of listeners) l({ sessionId: 'session', method: 'Inspector.targetCrashed' }) }, 10)
      return {}
    },
  }
  const started = Date.now()
  await assert.rejects(loadOnce(cdp, 'http://localhost:1/', { settleMs: 0, timeoutMs: 60000 }), /crashed/)
  assert.ok(Date.now() - started < 5000)
})
