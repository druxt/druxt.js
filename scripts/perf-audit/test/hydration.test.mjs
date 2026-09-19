import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { summariseLoads, probeHydration, INIT_SCRIPT } from '../hydration.mjs'

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
