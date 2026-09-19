// Loads a route in Chrome over the DevTools protocol and records what hydration did to the server-rendered page.
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Runs in the page before its own scripts.
export const INIT_SCRIPT = `(() => {
  const probe = { shifts: [], serverNodes: [] }
  window.__perfAuditHydration = probe
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) probe.shifts.push(entry.value)
  }).observe({ type: 'layout-shift', buffered: true })
  document.addEventListener('DOMContentLoaded', () => {
    probe.serverNodes = [...document.querySelectorAll('[data-fetch-key]')]
  })
})()`

const READ_SCRIPT = `(() => {
  const probe = window.__perfAuditHydration
  return {
    serverNodes: probe.serverNodes.length,
    discardedNodes: probe.serverNodes.filter((node) => !node.isConnected).length,
    layoutShift: probe.shifts.reduce((sum, value) => sum + value, 0),
  }
})()`

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) / 2)]

export function summariseLoads(loads) {
  return {
    serverNodes: median(loads.map((load) => load.serverNodes)),
    discardedNodes: median(loads.map((load) => load.discardedNodes)),
    layoutShift: Number(median(loads.map((load) => load.layoutShift)).toFixed(3)),
  }
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), 'perf-audit-chrome-'))
  const child = spawn(chromePath, ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${userDataDir}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
  const close = async () => { child.kill('SIGKILL'); await rm(userDataDir, { recursive: true, force: true }).catch(() => {}) }
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let stderr = ''
      const timer = setTimeout(() => reject(new Error('Chrome did not report a DevTools endpoint')), 30000)
      const fail = (err) => { clearTimeout(timer); reject(err) }
      child.stderr.on('data', (chunk) => {
        stderr += chunk
        const match = /DevTools listening on (ws:\/\/\S+)/.exec(stderr)
        if (match) { clearTimeout(timer); resolve(match[1]) }
      })
      // A path that cannot be spawned reports here, and an unheard error event would end the process.
      child.once('error', (err) => fail(new Error(`Chrome did not start: ${err.message}`)))
      child.once('exit', (code) => fail(new Error(`Chrome exited with ${code}`)))
    })
    return { endpoint, close }
  } catch (err) {
    await close()
    throw err
  }
}

async function connect(endpoint) {
  const socket = new WebSocket(endpoint)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = () => reject(new Error('DevTools socket failed')) })
  let nextId = 0
  const pending = new Map()
  const listeners = new Set()
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) reject(new Error(message.error.message))
      else resolve(message.result)
    } else for (const listener of listeners) listener(message)
  }
  return {
    send: (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    }),
    on: (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
    close: () => socket.close(),
  }
}

async function loadOnce(cdp, url, { settleMs, timeoutMs }) {
  const { browserContextId } = await cdp.send('Target.createBrowserContext')
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId })
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
  const send = (method, params) => cdp.send(method, params, sessionId)
  // Keyed by request id: a redirect reuses the id and never reports the first leg as finished.
  const inFlight = new Set()
  let lastActivity = Date.now()
  let loaded = false
  const off = cdp.on((message) => {
    if (message.sessionId !== sessionId) return
    if (message.method === 'Network.requestWillBeSent') { inFlight.add(message.params.requestId); lastActivity = Date.now() }
    if (message.method === 'Network.loadingFinished' || message.method === 'Network.loadingFailed') { inFlight.delete(message.params.requestId); lastActivity = Date.now() }
    if (message.method === 'Page.loadEventFired') loaded = true
  })
  try {
    await send('Page.enable')
    await send('Network.enable')
    await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 823, deviceScaleFactor: 1, mobile: true })
    await send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
    await send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await send('Page.addScriptToEvaluateOnNewDocument', { source: INIT_SCRIPT })
    await send('Page.navigate', { url })
    const started = Date.now()
    while (!(loaded && inFlight.size === 0 && Date.now() - lastActivity > 500)) {
      if (Date.now() - started > timeoutMs) throw new Error(`${url} did not settle within ${timeoutMs} ms`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    await new Promise((resolve) => setTimeout(resolve, settleMs))
    const { result } = await send('Runtime.evaluate', { expression: READ_SCRIPT, returnByValue: true })
    return result.value
  } finally {
    off()
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
    await cdp.send('Target.disposeBrowserContext', { browserContextId }).catch(() => {})
  }
}

export async function probeHydration(url, { loads = 3, chromePath = process.env.CHROME_PATH, settleMs = 3000, timeoutMs = 120000 } = {}) {
  if (!chromePath) throw new Error('CHROME_PATH is not set; the hydration layer needs Chrome')
  if (typeof WebSocket === 'undefined') throw new Error('the hydration layer needs Node 22 or later for its WebSocket client')
  const chrome = await launchChrome(chromePath)
  try {
    const cdp = await connect(chrome.endpoint)
    const results = []
    for (let i = 0; i < loads; i++) results.push(await loadOnce(cdp, url, { settleMs, timeoutMs }))
    cdp.close()
    return summariseLoads(results)
  } finally {
    await chrome.close()
  }
}
