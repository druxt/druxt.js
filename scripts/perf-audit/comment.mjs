#!/usr/bin/env node
// Posts the audit summary as one comment on the merge request or pull request the job belongs to.
import { readFile, appendFile } from 'node:fs/promises'
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
    '| Example | Route | Backend cold | Backend warm | Performance | Layout shift | API calls after load | `__NUXT__` bytes | Breach |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const { example, route, rows } of byRoute.values()) {
    const breach = Object.values(rows).map((r) => r.breach).filter(Boolean).join(', ')
    lines.push(`| ${example} | ${route} | ${withDelta(rows['backendCold.total'])} | ${withDelta(rows['backendWarm.total'])} | ${withDelta(rows['lighthouse.performance'])} | ${withDelta(rows['lighthouse.clsScore'])} | ${withDelta(rows['lighthouse.postLoadApiCalls'])} | ${withDelta(rows['ssr.nuxtBytes'])} | ${breach} |`)
  }
  for (const e of errors) lines.push('', `Error on ${e.example}: ${e.message}`)
  lines.push('', `Deltas are against \`${report.meta.baseline}\`. The full report is in the job artifact under \`.perf/\`.`)
  return lines.join('\n')
}

export function detectTarget(env) {
  if (env.CI_MERGE_REQUEST_IID && env.CI_PROJECT_ID && env.CI_API_V4_URL && env.GITLAB_API_TOKEN) {
    return { host: 'gitlab', api: env.CI_API_V4_URL, project: env.CI_PROJECT_ID, iid: env.CI_MERGE_REQUEST_IID, token: env.GITLAB_API_TOKEN }
  }
  const branch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME
  if (env.GITHUB_TOKEN && env.GITHUB_REPOSITORY && branch) {
    // A pull request run names its number in the ref, which also covers a head branch on a fork.
    const pull = /^refs\/pull\/(\d+)\//.exec(env.GITHUB_REF || '')?.[1] || null
    return { host: 'github', repo: env.GITHUB_REPOSITORY, branch, pull, token: env.GITHUB_TOKEN }
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
  let number = target.pull
  if (!number) {
    const [owner] = target.repo.split('/')
    const pulls = await request(doFetch, `https://api.github.com/repos/${target.repo}/pulls?state=open&head=${encodeURIComponent(`${owner}:${target.branch}`)}`, {}, headers)
    if (!pulls.length) { console.log(`no pull request for ${target.branch}`); return false }
    number = pulls[0].number
  }
  const base = `https://api.github.com/repos/${target.repo}/issues/${number}/comments`
  const existing = await findMarked(doFetch, base, headers)
  if (existing) await request(doFetch, `https://api.github.com/repos/${target.repo}/issues/comments/${existing.id}`, { method: 'PATCH', body: JSON.stringify({ body }) }, headers)
  else await request(doFetch, base, { method: 'POST', body: JSON.stringify({ body }) }, headers)
  return true
}

async function main(file, env) {
  const body = summarise(JSON.parse(await readFile(file, 'utf8')))
  // The run page always gets the summary, which covers a fork's read-only token.
  if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, `${body}\n`)
  const target = detectTarget(env)
  if (!target && env.CI_MERGE_REQUEST_IID) return console.log('GITLAB_API_TOKEN is not set; not commenting on the merge request')
  if (!target) return console.log('no merge request or pull request target in the environment; not commenting')
  const posted = await postComment(target, body)
  console.log(posted ? `commented on the ${target.host === 'gitlab' ? 'merge request' : 'pull request'}` : 'nothing to comment on')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2]
  if (!file) { console.error('usage: comment.mjs <report.json>'); process.exit(0) }
  main(file, process.env)
    .catch((err) => console.error(`comment failed: ${err.message}`))
    .finally(() => process.exit(0))
}
