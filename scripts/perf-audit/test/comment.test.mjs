import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summarise, detectTarget, postComment } from '../comment.mjs'

const report = {
  meta: { generatedAt: '2026-09-18T00:00:00Z', commit: 'abc1234' },
  breaches: 1, errors: [],
  rows: [
    { example: 'druxt-site', route: '/', metric: 'backendCold.total', current: 10, baseline: 11, delta: -1, breach: null },
    { example: 'druxt-site', route: '/', metric: 'backendWarm.total', current: 10, baseline: 11, delta: -1, breach: null },
    { example: 'druxt-site', route: '/', metric: 'ssr.nuxtBytes', current: 220723, baseline: 220727, delta: -4, breach: null },
    { example: 'druxt-site', route: '/', metric: 'lighthouse.performance', current: 60, baseline: 76, delta: -16, breach: 'performance down 16' },
  ],
  run: {},
}

test('summarise renders the marker, the heading and one row per route', () => {
  const md = summarise(report)
  assert.ok(md.startsWith('<!-- perf-audit -->'))
  assert.match(md, /abc1234/)
  assert.match(md, /1 budget breach/)
  assert.match(md, /\| druxt-site \| \/ \| 10 \(-1\) \| 10 \(-1\) \| 60 \(-16\) \| 220723 \(-4\) \| performance down 16 \|/)
})

test('detectTarget picks gitlab, github, or nothing', () => {
  assert.deepEqual(detectTarget({ CI_MERGE_REQUEST_IID: '88', CI_PROJECT_ID: '239', CI_API_V4_URL: 'http://gl/api/v4', PERF_AUDIT_GITLAB_TOKEN: 't' }),
    { host: 'gitlab', api: 'http://gl/api/v4', project: '239', iid: '88', token: 't' })
  assert.deepEqual(detectTarget({ GITHUB_TOKEN: 't', GITHUB_REPOSITORY: 'o/r', GITHUB_REF_NAME: 'feature/x' }),
    { host: 'github', repo: 'o/r', branch: 'feature/x', token: 't' })
  assert.equal(detectTarget({ CI_MERGE_REQUEST_IID: '88' }), null)
  assert.equal(detectTarget({}), null)
})

test('postComment updates an existing gitlab note or creates one', async () => {
  const calls = []
  const fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', body: init.body })
    if (url.endsWith('/notes?per_page=100')) return { ok: true, status: 200, json: async () => [{ id: 7, body: '<!-- perf-audit -->\nold' }], text: async () => '' }
    return { ok: true, status: 200, json: async () => ({}), text: async () => '' }
  }
  const target = { host: 'gitlab', api: 'http://gl/api/v4', project: '239', iid: '88', token: 't' }
  await postComment(target, '<!-- perf-audit -->\nnew', { fetch })
  assert.equal(calls[1].method, 'PUT')
  assert.match(calls[1].url, /\/notes\/7$/)
})

test('postComment finds the github pull request by branch and creates a comment', async () => {
  const calls = []
  const fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET' })
    if (url.includes('/pulls?')) return { ok: true, status: 200, json: async () => [{ number: 843 }], text: async () => '' }
    if (url.endsWith('/issues/843/comments?per_page=100')) return { ok: true, status: 200, json: async () => [], text: async () => '' }
    return { ok: true, status: 201, json: async () => ({}), text: async () => '' }
  }
  const target = { host: 'github', repo: 'druxt/druxt.js', branch: 'perf/shared-client-caches', token: 't' }
  await postComment(target, '<!-- perf-audit -->\nnew', { fetch })
  assert.equal(calls.at(-1).method, 'POST')
  assert.match(calls.at(-1).url, /\/issues\/843\/comments$/)
})

test('postComment without a pull request does nothing and does not throw', async () => {
  const fetch = async () => ({ ok: true, status: 200, json: async () => [], text: async () => '' })
  const target = { host: 'github', repo: 'o/r', branch: 'nothing', token: 't' }
  assert.equal(await postComment(target, 'x', { fetch }), false)
})
