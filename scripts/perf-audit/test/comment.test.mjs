import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summarise, detectTarget, postComment } from '../comment.mjs'

const report = {
  meta: { generatedAt: '2026-09-18T00:00:00Z', commit: 'abc1234', baseline: 'perf/baseline.github.json' },
  breaches: 1, errors: [],
  rows: [
    { example: 'druxt-site', route: '/', metric: 'backendCold.total', current: 10, baseline: 11, delta: -1, breach: null },
    { example: 'druxt-site', route: '/', metric: 'backendWarm.total', current: 10, baseline: 11, delta: -1, breach: null },
    { example: 'druxt-site', route: '/', metric: 'ssr.nuxtBytes', current: 220723, baseline: 220727, delta: -4, breach: null },
    { example: 'druxt-site', route: '/', metric: 'lighthouse.performance', current: 60, baseline: 76, delta: -16, breach: 'performance down 16' },
    { example: 'druxt-site', route: '/', metric: 'lighthouse.clsScore', current: 0.2, baseline: 1.8, delta: -1.6, breach: null },
    { example: 'druxt-site', route: '/', metric: 'lighthouse.postLoadApiCalls', current: 0, baseline: 6, delta: -6, breach: null },
    { example: 'druxt-site', route: '/', metric: 'hydration.discardedNodes', current: 0, baseline: 117, delta: -117, breach: null },
  ],
  run: {},
}

test('summarise renders the marker, the heading and one row per route', () => {
  const md = summarise(report)
  assert.ok(md.startsWith('<!-- perf-audit -->'))
  assert.match(md, /abc1234/)
  assert.match(md, /1 budget breach/)
  assert.match(md, /Deltas are against `perf\/baseline\.github\.json`/)
  assert.match(md, /\| druxt-site \| \/ \| 10 \(-1\) \| 10 \(-1\) \| 60 \(-16\) \| 0\.2 \(-1\.6\) \| 0 \(-117\) \| 0 \(-6\) \| 220723 \(-4\) \| performance down 16 \|/)
})

test('detectTarget picks gitlab, github, or nothing', () => {
  assert.deepEqual(detectTarget({ CI_MERGE_REQUEST_IID: '88', CI_PROJECT_ID: '239', CI_API_V4_URL: 'http://gl/api/v4', GITLAB_API_TOKEN: 't' }),
    { host: 'gitlab', api: 'http://gl/api/v4', project: '239', iid: '88', token: 't' })
  assert.deepEqual(detectTarget({ GITHUB_TOKEN: 't', GITHUB_REPOSITORY: 'o/r', GITHUB_REF_NAME: 'feature/x' }),
    { host: 'github', repo: 'o/r', branch: 'feature/x', pull: null, token: 't' })
  assert.deepEqual(detectTarget({ GITHUB_TOKEN: 't', GITHUB_REPOSITORY: 'o/r', GITHUB_REF: 'refs/pull/845/merge', GITHUB_REF_NAME: '845/merge', GITHUB_HEAD_REF: 'feature/x' }),
    { host: 'github', repo: 'o/r', branch: 'feature/x', pull: '845', token: 't' })
  assert.equal(detectTarget({ CI_MERGE_REQUEST_IID: '88' }), null)
  assert.equal(detectTarget({}), null)
})

test('postComment updates an existing gitlab note or creates one', async () => {
  const calls = []
  const fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', body: init.body })
    if (url.endsWith('/notes?per_page=100&page=1')) return { ok: true, status: 200, json: async () => [{ id: 7, body: '<!-- perf-audit -->\nold' }], text: async () => '' }
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
    if (url.endsWith('/issues/843/comments?per_page=100&page=1')) return { ok: true, status: 200, json: async () => [], text: async () => '' }
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

test('postComment finds the marker past the first page of notes', async () => {
  const calls = []
  const page1 = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, body: `note ${i}` }))
  const fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET' })
    if (url.endsWith('/notes?per_page=100&page=1')) return { ok: true, status: 200, json: async () => page1, text: async () => '' }
    if (url.endsWith('/notes?per_page=100&page=2')) return { ok: true, status: 200, json: async () => [{ id: 101, body: '<!-- perf-audit -->\nold' }], text: async () => '' }
    return { ok: true, status: 200, json: async () => ({}), text: async () => '' }
  }
  const target = { host: 'gitlab', api: 'http://gl/api/v4', project: '239', iid: '88', token: 't' }
  await postComment(target, '<!-- perf-audit -->\nnew', { fetch })
  assert.equal(calls.at(-1).method, 'PUT')
  assert.match(calls.at(-1).url, /\/notes\/101$/)
})

test('postComment uses the pull request number from the ref without a branch lookup', async () => {
  const calls = []
  const fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET' })
    return { ok: true, status: 200, json: async () => [], text: async () => '' }
  }
  const target = { host: 'github', repo: 'o/r', branch: 'feature/on-a-fork', pull: '782', token: 't' }
  assert.equal(await postComment(target, '<!-- perf-audit -->\nnew', { fetch }), true)
  assert.ok(calls.every((call) => !call.url.includes('/pulls?')))
  assert.match(calls.at(-1).url, /\/issues\/782\/comments$/)
  assert.equal(calls.at(-1).method, 'POST')
})
