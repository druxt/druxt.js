#!/usr/bin/env node
// Posts the audit summary as one comment on the merge request or pull request the job belongs to.
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export const MARKER = '<!-- perf-audit -->'
const cell = (value) => (value === null || value === undefined ? 'n/a' : String(value))
const withDelta = (row) => (row ? `${cell(row.current)}${row.delta === null ? '' : ` (${row.delta > 0 ? '+' : ''}${row.delta})`}` : 'n/a')

export function summarise(report) {
  const byRoute = new Map()
  for (const row of report.rows) {
    const key = `${row.example} ${row.route}`
    if (!byRoute.has(key)) byRoute.set(key, { example: row.example, route: row.route, rows: {} })
    byRoute.get(key).rows[row.metric] = row
  }
  const errors = report.errors || []
  const lines = [
    MARKER,
    `**Performance audit** at ${report.meta.commit}: ${report.breaches} budget breach${report.breaches === 1 ? '' : 'es'}, ${errors.length} error${errors.length === 1 ? '' : 's'}.`,
    '',
    '| Example | Route | Backend cold | Backend warm | Performance | `__NUXT__` bytes | Breach |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const { example, route, rows } of byRoute.values()) {
    const breach = Object.values(rows).map((r) => r.breach).filter(Boolean).join(', ')
    lines.push(`| ${example} | ${route} | ${withDelta(rows['backendCold.total'])} | ${withDelta(rows['backendWarm.total'])} | ${withDelta(rows['lighthouse.performance'])} | ${withDelta(rows['ssr.nuxtBytes'])} | ${breach} |`)
  }
  for (const e of errors) lines.push('', `Error on ${e.example}: ${e.message}`)
  lines.push('', `Deltas are against \`${report.meta.baseline}\`. The full report is in the job artifact under \`.perf/\`.`)
  return lines.join('\n')
}

export function detectTarget(env) {
  if (env.CI_MERGE_REQUEST_IID && env.CI_PROJECT_ID && env.CI_API_V4_URL && env.PERF_AUDIT_GITLAB_TOKEN) {
    return { host: 'gitlab', api: env.CI_API_V4_URL, project: env.CI_PROJECT_ID, iid: env.CI_MERGE_REQUEST_IID, token: env.PERF_AUDIT_GITLAB_TOKEN }
  }
  const branch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME
  if (env.GITHUB_TOKEN && env.GITHUB_REPOSITORY && branch) {
    return { host: 'github', repo: env.GITHUB_REPOSITORY, branch, token: env.GITHUB_TOKEN }
  }
  return null
}

async function request(fetch, url, init, headers) {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...headers, ...(init.headers || {}) } })
  if (!response.ok) throw new Error(`${init.method || 'GET'} ${url} answered ${response.status}: ${await response.text()}`)
  return response.json()
}

async function findMarked(fetch, base, headers) {
  for (let page = 1; ; page++) {
    const items = await request(fetch, `${base}?per_page=100&page=${page}`, {}, headers)
    const found = items.find((item) => (item.body || '').startsWith(MARKER))
    if (found || items.length < 100) return found || null
  }
}

export async function postComment(target, body, { fetch: given } = {}) {
  const doFetch = given || fetch
  if (target.host === 'gitlab') {
    const headers = { 'PRIVATE-TOKEN': target.token }
    const base = `${target.api}/projects/${target.project}/merge_requests/${target.iid}/notes`
    const existing = await findMarked(doFetch, base, headers)
    if (existing) await request(doFetch, `${base}/${existing.id}`, { method: 'PUT', body: JSON.stringify({ body }) }, headers)
    else await request(doFetch, base, { method: 'POST', body: JSON.stringify({ body }) }, headers)
    return true
  }
  const headers = { authorization: `Bearer ${target.token}`, accept: 'application/vnd.github+json' }
  const [owner] = target.repo.split('/')
  const pulls = await request(doFetch, `https://api.github.com/repos/${target.repo}/pulls?state=open&head=${encodeURIComponent(`${owner}:${target.branch}`)}`, {}, headers)
  if (!pulls.length) { console.log(`no pull request for ${target.branch}`); return false }
  const base = `https://api.github.com/repos/${target.repo}/issues/${pulls[0].number}/comments`
  const existing = await findMarked(doFetch, base, headers)
  if (existing) await request(doFetch, `https://api.github.com/repos/${target.repo}/issues/comments/${existing.id}`, { method: 'PATCH', body: JSON.stringify({ body }) }, headers)
  else await request(doFetch, base, { method: 'POST', body: JSON.stringify({ body }) }, headers)
  return true
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2]
  const target = detectTarget(process.env)
  if (!file) { console.error('usage: comment.mjs <report.json>'); process.exit(0) }
  if (!target) { console.log('no merge request or pull request target in the environment; not commenting'); process.exit(0) }
  readFile(file, 'utf8')
    .then((text) => postComment(target, summarise(JSON.parse(text))))
    .then((posted) => console.log(posted ? `commented on the ${target.host === 'gitlab' ? 'merge request' : 'pull request'}` : 'nothing to comment on'))
    .catch((err) => console.error(`comment failed: ${err.message}`))
    .finally(() => process.exit(0))
}
