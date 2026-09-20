import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { METRICS, COUNT_METRICS, BYTE_METRICS, NOISY_METRICS, movedMetrics } from '../baseline.mjs'
import { baselineChanged } from '../baseline-changed.mjs'

const route = (over = {}) => ({
  backendCold: { total: 10, index: 2, collections: 4, resources: 0, router: 1, menu: 3 },
  backendWarm: { total: 10, index: 2, collections: 4, resources: 0, router: 1, menu: 3 },
  ssr: { status: 200, errorState: null, ttfbMs: 551, nuxtBytes: 220717, fetchKeys: 129 },
  lighthouse: { performance: 77, lcpMs: 6167, clsScore: 0, tbtMs: 14, postLoadApiCalls: 0 },
  hydration: { serverNodes: 129, discardedNodes: 0, layoutShift: 0.215 },
  ...over,
})
const baseline = (over = {}) => ({ 'druxt-site': { '/': route(over) } })

test('every reported metric is classified once, so a new one cannot fall through', () => {
  const classified = [...COUNT_METRICS, ...BYTE_METRICS, ...NOISY_METRICS]
  assert.deepEqual([...classified].sort(), [...METRICS].sort())
  assert.equal(new Set(classified).size, classified.length)
})

test('a run that only moved timings and Lighthouse scores did not move', () => {
  // The numbers a real automatic refresh produced with no code change at all.
  const after = baseline({
    ssr: { status: 200, errorState: null, ttfbMs: 689, nuxtBytes: 220734, fetchKeys: 129 },
    lighthouse: { performance: 78, lcpMs: 5864, clsScore: 0, tbtMs: 28, postLoadApiCalls: 0 },
    hydration: { serverNodes: 129, discardedNodes: 0, layoutShift: 0.19 },
  })
  assert.deepEqual(movedMetrics(baseline(), after), [])
})

test('a backend request count moved', () => {
  const after = baseline({ backendCold: { total: 9, index: 1, collections: 4, resources: 0, router: 1, menu: 3 } })
  const moved = movedMetrics(baseline(), after).map((row) => row.metric)
  assert.deepEqual(moved, ['backendCold.total', 'backendCold.index'])
})

test('API calls after load and discarded nodes each move on their own', () => {
  const calls = movedMetrics(baseline(), baseline({ lighthouse: { performance: 77, lcpMs: 6167, clsScore: 0, tbtMs: 14, postLoadApiCalls: 6 } }))
  assert.deepEqual(calls.map((row) => row.metric), ['lighthouse.postLoadApiCalls'])

  const nodes = movedMetrics(baseline(), baseline({ hydration: { serverNodes: 129, discardedNodes: 117, layoutShift: 0.215 } }))
  assert.deepEqual(nodes.map((row) => row.metric), ['hydration.discardedNodes'])
})

test('a byte count moves only past the tolerance', () => {
  const drift = baseline({ ssr: { status: 200, errorState: null, ttfbMs: 551, nuxtBytes: 220734, fetchKeys: 129 } })
  assert.deepEqual(movedMetrics(baseline(), drift), [])

  const real = baseline({ ssr: { status: 200, errorState: null, ttfbMs: 551, nuxtBytes: 260000, fetchKeys: 129 } })
  assert.deepEqual(movedMetrics(baseline(), real).map((row) => row.metric), ['ssr.nuxtBytes'])
})

test('a route the committed baseline has never held moved', () => {
  const moved = movedMetrics({}, baseline())
  assert.ok(moved.length > 0)
  assert.ok(moved.every((row) => row.before === null))
})

test('a failed render moved, even with every count unchanged', () => {
  const after = baseline({ ssr: { status: 500, errorState: 'statusCode:500', ttfbMs: 551, nuxtBytes: 220717, fetchKeys: 129 } })
  assert.deepEqual(movedMetrics(baseline(), after).map((row) => row.metric), ['ssr.status', 'ssr.errorState'])
})

test('the command reports both outcomes and writes the GitHub output', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'baseline-changed-'))
  const committed = join(dir, 'committed.json')
  const refreshed = join(dir, 'refreshed.json')
  const output = join(dir, 'github-output')
  await writeFile(committed, JSON.stringify(baseline()))
  process.env.GITHUB_OUTPUT = output
  t.after(() => { delete process.env.GITHUB_OUTPUT })

  const lines = []
  t.mock.method(console, 'log', (line) => lines.push(line))

  // Noise only.
  await writeFile(refreshed, JSON.stringify(baseline({ ssr: { status: 200, errorState: null, ttfbMs: 999, nuxtBytes: 220717, fetchKeys: 129 } })))
  assert.deepEqual(await baselineChanged([committed, refreshed]), [])
  assert.ok(lines.includes('changed=false'))

  // A real move.
  await writeFile(refreshed, JSON.stringify(baseline({ lighthouse: { performance: 77, lcpMs: 6167, clsScore: 0, tbtMs: 14, postLoadApiCalls: 6 } })))
  const moved = await baselineChanged([committed, refreshed])
  assert.equal(moved.length, 1)
  assert.ok(lines.includes('changed=true'))
  assert.ok(lines.some((line) => line.includes('lighthouse.postLoadApiCalls: 0 -> 6')))

  assert.equal(await readFile(output, 'utf8'), 'changed=false\nchanged=true\n')
})

test('a missing or unreadable file fails instead of reporting no change', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'baseline-changed-'))
  const broken = join(dir, 'broken.json')
  const good = join(dir, 'good.json')
  await writeFile(broken, '{ not json')
  await writeFile(good, JSON.stringify(baseline()))

  await assert.rejects(() => baselineChanged([join(dir, 'missing.json'), good]), /ENOENT/)
  await assert.rejects(() => baselineChanged([broken, good]), /not valid JSON/)
  await assert.rejects(() => baselineChanged([good]), /Usage/)
})
