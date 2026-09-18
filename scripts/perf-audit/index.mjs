#!/usr/bin/env node
// Performance audit of the example applications. See README.md.
import { mkdir, writeFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { parseArgs } from './args.mjs'
import { config } from './config.mjs'
import * as backendLog from './backend-log.mjs'
import * as ssr from './ssr.mjs'
import * as lighthouse from './lighthouse.mjs'
import * as baseline from './baseline.mjs'
import { toMarkdown, toJson } from './report.mjs'

const BASELINE_FILE = resolve('perf/baseline.json')

const major = Number(process.versions.node.split('.')[0])
if (major < 18) {
  console.error(`perf-audit needs Node 18 or later, found ${process.version}. Run it with: mise exec node@22 -- yarn perf:audit`)
  process.exit(2)
}

const defaults = {
  probe: ssr.probe,
  logSize: backendLog.logSize,
  readNewLines: backendLog.readNewLines,
  waitForSettle: backendLog.waitForSettle,
  runUnlighthouse: lighthouse.runUnlighthouse,
  readUnlighthouseResults: lighthouse.readUnlighthouseResults,
  loadBaseline: baseline.loadBaseline,
  saveBaseline: baseline.saveBaseline,
  checkServer: async (url) => (await fetch(url, { method: 'HEAD' }).catch(() => null))?.ok ?? false,
  now: () => new Date(),
  commit: () => execSync('git rev-parse --short HEAD').toString().trim(),
}

async function probeRoute(deps, url) {
  try {
    return await deps.probe(url)
  } catch (err) {
    return { status: 0, ttfbMs: null, totalMs: null, htmlBytes: 0, nuxtBytes: 0, fetchKeys: 0, errorState: err.message }
  }
}

async function measureRoute(example, route, deps) {
  const url = `http://localhost:${example.port}${route}`
  const backend = []
  let probed
  for (let pass = 0; pass < 2; pass++) {
    const before = await deps.logSize(config.backendLog)
    const start = await deps.waitForSettle(config.backendLog, before, { quietMs: 100, timeoutMs: 1000 })
    probed = await probeRoute(deps, url)
    const end = await deps.waitForSettle(config.backendLog, start)
    const { text } = await deps.readNewLines(config.backendLog, start)
    backend.push(backendLog.groupByEndpoint(backendLog.parseLogLines(text)))
    void end
  }
  return { backendCold: backend[0], backendWarm: backend[1], ssr: probed, lighthouse: null }
}

export async function runAudit(opts, deps = {}, examples = config.examples) {
  const d = { ...defaults, ...deps }
  const selected = examples.filter((e) => !opts.examples || opts.examples.includes(e.name))
  if (!selected.length) throw new Error(`No example matches ${opts.examples?.join(', ')}`)
  const outDir = opts.outDir || resolve('.perf', d.now().toISOString().replace(/[:.]/g, '-'))
  await mkdir(outDir, { recursive: true })

  const run = {}
  for (const example of selected) {
    if (!(await d.checkServer(`http://localhost:${example.port}/`))) {
      throw new Error(`${example.name} is not answering on port ${example.port}; start it with scripts/perf-audit/serve-examples.sh`)
    }
    run[example.name] = {}
    for (const route of example.routes) run[example.name][route] = await measureRoute(example, route, d)
    if (!opts.skipLighthouse) {
      const dir = join(outDir, example.name)
      await mkdir(dir, { recursive: true })
      await d.runUnlighthouse(example, dir)
      const results = await d.readUnlighthouseResults(join(dir, 'unlighthouse'))
      for (const route of example.routes) run[example.name][route].lighthouse = results[route] || null
    }
  }

  const meta = { generatedAt: d.now().toISOString(), commit: d.commit() }
  const existingBaseline = await d.loadBaseline(BASELINE_FILE)
  const comparison = baseline.compare(run, existingBaseline, config.budgets)
  const md = toMarkdown(comparison, meta)
  await writeFile(join(outDir, 'report.json'), JSON.stringify(toJson(run, comparison, meta), null, 2))
  await writeFile(join(outDir, 'report.md'), md)
  console.log(md)
  if (opts.updateBaseline) await d.saveBaseline(BASELINE_FILE, baseline.mergeBaseline(existingBaseline, run))
  return { run, breaches: comparison.breaches, outDir }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAudit(parseArgs(process.argv.slice(2)))
    .then(({ breaches, outDir }) => { console.error(`Report written to ${outDir}`); process.exit(breaches ? 1 : 0) })
    .catch((err) => { console.error(err.message); process.exit(1) })
}
