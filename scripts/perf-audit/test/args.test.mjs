import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseArgs } from '../args.mjs'

test('defaults', () => {
  assert.deepEqual(parseArgs([]), { examples: null, skipLighthouse: false, skipHydration: false, updateBaseline: false, outDir: null })
})

test('flags', () => {
  const opts = parseArgs(['--example', 'druxt-site', '--example=druxt-daisyui', '--skip-lighthouse', '--skip-hydration', '--update-baseline', '--out', '/tmp/x'])
  assert.deepEqual(opts.examples, ['druxt-site', 'druxt-daisyui'])
  assert.equal(opts.skipLighthouse, true)
  assert.equal(opts.skipHydration, true)
  assert.equal(opts.updateBaseline, true)
  assert.equal(opts.outDir, '/tmp/x')
})

test('a missing option value throws instead of eating the next flag', () => {
  assert.throws(() => parseArgs(['--out', '--skip-lighthouse']), /Missing value for --out/)
  assert.throws(() => parseArgs(['--example']), /Missing value for --example/)
})

test('unknown flag throws', () => {
  assert.throws(() => parseArgs(['--nope']), /Unknown option/)
})
