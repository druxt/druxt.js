import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadBaseline, compare, saveBaseline } from '../baseline.mjs'

const budgets = { backendRequests: 'no-increase', performanceDrop: 10, payloadGrowthPercent: 10 }
const route = (over = {}) => ({
  backendCold: { total: 6 }, backendWarm: { total: 2 },
  ssr: { status: 200, errorState: null, ttfbMs: 120, nuxtBytes: 20000, fetchKeys: 12 },
  lighthouse: { performance: 90, lcpMs: 1500, clsScore: 0.01, tbtMs: 50, postLoadApiCalls: 0 },
  ...over,
})

test('no baseline reports every metric as new without breaches', () => {
  const { rows, breaches } = compare({ 'druxt-site': { '/': route() } }, {}, budgets)
  assert.equal(breaches, 0)
  assert.ok(rows.every((row) => row.baseline === null && row.breach === null))
  assert.equal(rows.find((r) => r.metric === 'backendCold.total').current, 6)
})

test('breaches: more backend requests, performance drop, payload growth, error state', () => {
  const baseline = { 'druxt-site': { '/': route() } }
  const run = { 'druxt-site': { '/': route({
    backendWarm: { total: 3 },
    ssr: { status: 500, errorState: 'statusCode:500', ttfbMs: 100, nuxtBytes: 23000, fetchKeys: 12 },
    lighthouse: { performance: 79, lcpMs: 1500, clsScore: 0.01, tbtMs: 50, postLoadApiCalls: 0 },
  }) } }
  const { rows, breaches } = compare(run, baseline, budgets)
  const breached = rows.filter((r) => r.breach).map((r) => r.metric)
  assert.deepEqual(breached, ['backendWarm.total', 'ssr.status', 'ssr.errorState', 'ssr.nuxtBytes', 'lighthouse.performance'])
  assert.equal(breaches, 5)
  assert.equal(rows.find((r) => r.metric === 'backendWarm.total').delta, 1)
})

test('missing lighthouse data compares as null, not a breach', () => {
  const baseline = { 'druxt-site': { '/': route() } }
  const { rows, breaches } = compare({ 'druxt-site': { '/': route({ lighthouse: null }) } }, baseline, budgets)
  assert.equal(breaches, 0)
  assert.equal(rows.find((r) => r.metric === 'lighthouse.performance').current, null)
})

test('save and load round trip', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  const file = join(dir, 'baseline.json')
  assert.deepEqual(await loadBaseline(file), {})
  await saveBaseline(file, { 'druxt-site': { '/': route() } })
  assert.equal((await loadBaseline(file))['druxt-site']['/'].backendCold.total, 6)
})
