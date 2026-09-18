import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toMarkdown, toJson } from '../report.mjs'

const rows = [
  { example: 'druxt-site', route: '/', metric: 'backendCold.total', current: 6, baseline: 9, delta: -3, breach: null },
  { example: 'druxt-site', route: '/', metric: 'lighthouse.performance', current: 84, baseline: 90, delta: -6, breach: 'performance down 6' },
  { example: 'druxt-site', route: '/', metric: 'lighthouse.lcpMs', current: null, baseline: 1500, delta: null, breach: null },
]

test('toMarkdown renders one table per example with deltas and breaches', () => {
  const md = toMarkdown({ rows, breaches: 1 }, { generatedAt: '2026-09-18T00:00:00Z', commit: 'abc1234' })
  assert.match(md, /^# Performance audit/m)
  assert.match(md, /## druxt-site/)
  assert.match(md, /\| \/ \| backendCold\.total \| 6 \| 9 \| -3 \| \|/)
  assert.match(md, /\| \/ \| lighthouse\.performance \| 84 \| 90 \| -6 \| performance down 6 \|/)
  assert.match(md, /\| \/ \| lighthouse\.lcpMs \| n\/a \| 1500 \| \| \|/)
  assert.match(md, /1 budget breach/)
})

test('toJson carries the run, the rows and the meta', () => {
  const json = toJson({ 'druxt-site': {} }, { rows, breaches: 1 }, { generatedAt: 'x', commit: 'y' })
  assert.deepEqual(Object.keys(json), ['meta', 'breaches', 'rows', 'run'])
})
