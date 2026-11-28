import { test } from 'node:test'
import assert from 'node:assert/strict'
import { environment, baselinePath } from '../config.mjs'

test('environment follows the CI host and falls back to local', () => {
  assert.equal(environment({}), 'local')
  assert.equal(environment({ GITHUB_ACTIONS: 'true' }), 'github')
  assert.equal(environment({ GITLAB_CI: 'true' }), 'gitlab')
})

test('PERF_AUDIT_ENV overrides the detected environment and is validated', () => {
  assert.equal(environment({ GITHUB_ACTIONS: 'true', PERF_AUDIT_ENV: 'arm-laptop' }), 'arm-laptop')
  assert.throws(() => environment({ PERF_AUDIT_ENV: '../etc' }), /Invalid PERF_AUDIT_ENV/)
})

test('baselinePath names one file per environment', () => {
  assert.equal(baselinePath('github'), 'perf/baseline.github.json')
})

test('druxt-site is audited twice: as built, and with the content cache on', async () => {
  const { config } = await import('../config.mjs')
  const plain = config.examples.find((example) => example.name === 'druxt-site')
  const cached = config.examples.find((example) => example.name === 'druxt-site-cached')
  assert.ok(cached, 'no druxt-site-cached example')
  assert.deepEqual(cached.routes, plain.routes)
  assert.notEqual(cached.port, plain.port)
  assert.equal(cached.backendOnly, true)
})
