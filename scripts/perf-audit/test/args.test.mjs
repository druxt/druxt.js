import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseArgs } from '../args.mjs'

test('defaults', () => {
  assert.deepEqual(parseArgs([]), { examples: null, skipLighthouse: false, updateBaseline: false, outDir: null })
})

test('flags', () => {
  const opts = parseArgs(['--example', 'druxt-site', '--example=druxt-daisyui', '--skip-lighthouse', '--update-baseline', '--out', '/tmp/x'])
  assert.deepEqual(opts.examples, ['druxt-site', 'druxt-daisyui'])
  assert.equal(opts.skipLighthouse, true)
  assert.equal(opts.updateBaseline, true)
  assert.equal(opts.outDir, '/tmp/x')
})

test('unknown flag throws', () => {
  assert.throws(() => parseArgs(['--nope']), /Unknown option/)
})
