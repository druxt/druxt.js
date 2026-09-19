import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadBaseline, compare, saveBaseline, mergeBaseline } from '../baseline.mjs'

const budgets = { backendRequests: 'no-increase', performanceDrop: 10, payloadGrowthPercent: 10 }
const route = (over = {}) => ({
  backendCold: { total: 6, index: 1, collections: 2, resources: 2, router: 1, menu: 0 },
  backendWarm: { total: 2, index: 1, collections: 1, resources: 0, router: 0, menu: 0 },
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

test('breachFor flags every budget', () => {
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

test('endpoint groups reach the comparison rows', () => {
  const { rows } = compare({ 'druxt-site': { '/': route() } }, {}, budgets)
  assert.equal(rows.find((r) => r.metric === 'backendCold.resources').current, 2)
  assert.equal(rows.find((r) => r.metric === 'backendWarm.menu').current, 0)
})

test('a rising endpoint group does not breach while the total holds', () => {
  const baseline = { 'druxt-site': { '/': route() } }
  const run = { 'druxt-site': { '/': route({ backendCold: { total: 6, index: 1, collections: 2, resources: 3, router: 0, menu: 0 } }) } }
  const { rows, breaches } = compare(run, baseline, budgets)
  assert.equal(breaches, 0)
  assert.equal(rows.find((r) => r.metric === 'backendCold.resources').breach, null)
})

test('save and load round trip', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  const file = join(dir, 'baseline.json')
  assert.deepEqual(await loadBaseline(file), {})
  await saveBaseline(file, { 'druxt-site': { '/': route() } })
  assert.equal((await loadBaseline(file))['druxt-site']['/'].backendCold.total, 6)
})

test('mergeBaseline keeps examples and routes the run did not touch', () => {
  const existing = { 'druxt-site': { '/': route() }, 'druxt-daisyui': { '/': route() } }
  const run = { 'druxt-site': { '/': route({ backendCold: { total: 7, index: 2, collections: 2, resources: 2, router: 1, menu: 0 } }) } }
  const merged = mergeBaseline(existing, run)
  assert.equal(merged['druxt-site']['/'].backendCold.total, 7)
  assert.deepEqual(merged['druxt-daisyui'], existing['druxt-daisyui'])
})

test('mergeBaseline preserves a null lighthouse from a skipped run', () => {
  const existing = { 'druxt-site': { '/': route() } }
  const run = { 'druxt-site': { '/': route({ lighthouse: null }) } }
  const merged = mergeBaseline(existing, run)
  assert.deepEqual(merged['druxt-site']['/'].lighthouse, existing['druxt-site']['/'].lighthouse)
})

test('mergeBaseline replaces lighthouse with a measured result', () => {
  const existing = { 'druxt-site': { '/': route({ lighthouse: null }) } }
  const measured = { performance: 95, lcpMs: 900, clsScore: 0, tbtMs: 10, postLoadApiCalls: 0 }
  const run = { 'druxt-site': { '/': route({ lighthouse: measured }) } }
  const merged = mergeBaseline(existing, run)
  assert.deepEqual(merged['druxt-site']['/'].lighthouse, measured)
})

test('compare rounds a fractional delta to three places', () => {
  const entry = (cls) => ({ backendCold: {}, backendWarm: {}, ssr: {}, lighthouse: { clsScore: cls } })
  const { rows } = compare({ a: { '/': entry(0.405) } }, { a: { '/': entry(0.357) } }, {})
  assert.equal(rows.find((row) => row.metric === 'lighthouse.clsScore').delta, 0.048)
})

test('compare breaches when the browser makes more API calls after load', () => {
  const entry = (calls) => ({ backendCold: {}, backendWarm: {}, ssr: { status: 200 }, lighthouse: { postLoadApiCalls: calls } })
  const budgets = { postLoadApiCalls: 'no-increase' }
  assert.equal(compare({ a: { '/': entry(6) } }, { a: { '/': entry(0) } }, budgets).breaches, 1)
  assert.equal(compare({ a: { '/': entry(0) } }, { a: { '/': entry(6) } }, budgets).breaches, 0)
})
