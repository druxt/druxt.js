import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeUnlighthouseConfig, runUnlighthouse, readUnlighthouseResults } from '../lighthouse.mjs'

const example = { name: 'druxt-daisyui', port: 3201, routes: ['/', '/recipes'] }

test('writeUnlighthouseConfig pins the site, routes and browser', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  const file = await writeUnlighthouseConfig(example, dir)
  const text = await readFile(file, 'utf8')
  assert.match(text, /http:\/\/localhost:3201/)
  assert.match(text, /"\/recipes"/)
  assert.match(text, /crawler: false/)
  assert.match(text, /samples: 3/)
  assert.match(text, /maxConcurrency: 1/)
  assert.match(text, /--no-sandbox/)
})

test('runUnlighthouse spawns the pinned CLI with CHROME_PATH', async () => {
  const calls = []
  const spawn = (cmd, args, opts) => { calls.push({ cmd, args, opts }); return { exitCode: 0 } }
  await runUnlighthouse(example, '/tmp/out', { spawn, chromePath: '/opt/chrome' })
  assert.equal(calls.length, 1)
  assert.match(calls[0].args.join(' '), /unlighthouse-ci@0\.18\.0/)
  assert.match(calls[0].args.join(' '), /--site http:\/\/localhost:3201/)
  assert.equal(calls[0].opts.env.CHROME_PATH, '/opt/chrome')
})

test('readUnlighthouseResults merges scores, vitals and post-load API calls', async () => {
  const results = await readUnlighthouseResults(new URL('./fixtures/unlighthouse/', import.meta.url).pathname)
  assert.deepEqual(results['/recipes'], {
    performance: 88, lcpMs: 1831, clsScore: 0.012, tbtMs: 120, fcpMs: 900,
    requests: 5, bytes: 165500, postLoadApiCalls: 2,
  })
})
