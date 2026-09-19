import { test } from 'node:test'
import assert from 'node:assert/strict'
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
