import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runAudit } from '../index.mjs'

test('runAudit measures cold and warm per route and writes the report', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  let offset = 0
  const log = ['[x] 1 [200]: GET /jsonapi\n[x] 1 [200]: GET /router/translate-path?path=/\n', '[x] 1 [200]: GET /router/translate-path?path=/\n']
  const deps = {
    probe: async () => ({ status: 200, ttfbMs: 10, totalMs: 20, htmlBytes: 100, nuxtBytes: 40, fetchKeys: 1, errorState: null }),
    logSize: async () => 0,
    readNewLines: async () => ({ text: log.shift() || '', offset: (offset += 1) }),
    waitForSettle: async () => offset,
    runUnlighthouse: async () => {},
    readUnlighthouseResults: async () => ({ '/': { performance: 90, lcpMs: 1, clsScore: 0, tbtMs: 0, fcpMs: 1, requests: 1, bytes: 1, postLoadApiCalls: 0 } }),
    loadBaseline: async () => ({}),
    saveBaseline: async () => { throw new Error('should not save') },
    checkServer: async () => true,
    now: () => new Date('2026-09-18T00:00:00Z'),
    commit: () => 'abc1234',
  }
  const examples = [{ name: 'druxt-site', port: 3200, routes: ['/'] }]
  const result = await runAudit({ examples: null, skipLighthouse: false, updateBaseline: false, outDir }, deps, examples)
  assert.equal(result.breaches, 0)
  assert.equal(result.run['druxt-site']['/'].backendCold.total, 2)
  assert.equal(result.run['druxt-site']['/'].backendWarm.total, 1)
  assert.equal(result.run['druxt-site']['/'].lighthouse.performance, 90)
  const md = await readFile(join(outDir, 'report.md'), 'utf8')
  assert.match(md, /## druxt-site/)
})

test('runAudit saves the baseline when asked and skips lighthouse when asked', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  let saved = null
  const deps = {
    probe: async () => ({ status: 200, ttfbMs: 1, totalMs: 2, htmlBytes: 1, nuxtBytes: 1, fetchKeys: 0, errorState: null }),
    logSize: async () => 0,
    readNewLines: async () => ({ text: '', offset: 0 }),
    waitForSettle: async () => 0,
    runUnlighthouse: async () => { throw new Error('should be skipped') },
    readUnlighthouseResults: async () => ({}),
    loadBaseline: async () => ({}),
    saveBaseline: async (file, run) => { saved = run },
    checkServer: async () => true,
    now: () => new Date('2026-09-18T00:00:00Z'),
    commit: () => 'abc1234',
  }
  const examples = [{ name: 'druxt-site', port: 3200, routes: ['/'] }]
  const result = await runAudit({ examples: null, skipLighthouse: true, updateBaseline: true, outDir }, deps, examples)
  assert.equal(result.run['druxt-site']['/'].lighthouse, null)
  assert.ok(saved)
})

test('runAudit records a rejected probe instead of aborting the run', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'perf-audit-'))
  let calls = 0
  const deps = {
    // Rejects once, on the second (warm) pass, so the recorded ssr reflects the catch.
    probe: async () => {
      calls += 1
      if (calls === 2) throw new Error('connect ECONNREFUSED')
      return { status: 200, ttfbMs: 1, totalMs: 2, htmlBytes: 1, nuxtBytes: 1, fetchKeys: 0, errorState: null }
    },
    logSize: async () => 0,
    readNewLines: async () => ({ text: '', offset: 0 }),
    waitForSettle: async () => 0,
    runUnlighthouse: async () => {},
    readUnlighthouseResults: async () => ({}),
    loadBaseline: async () => ({}),
    saveBaseline: async () => {},
    checkServer: async () => true,
    now: () => new Date('2026-09-18T00:00:00Z'),
    commit: () => 'abc1234',
  }
  const examples = [{ name: 'druxt-site', port: 3200, routes: ['/'] }]
  const result = await runAudit({ examples: null, skipLighthouse: true, updateBaseline: false, outDir }, deps, examples)
  assert.deepEqual(result.run['druxt-site']['/'].ssr, {
    status: 0, ttfbMs: null, totalMs: null, htmlBytes: 0, nuxtBytes: 0, fetchKeys: 0, errorState: 'connect ECONNREFUSED',
  })
})
