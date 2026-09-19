#!/usr/bin/env node
// Performance audit of the example applications. See README.md.
import { mkdir, writeFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import net from 'node:net'
import { parseArgs } from './args.mjs'
import { config, environment, baselinePath } from './config.mjs'
import * as backendLog from './backend-log.mjs'
import * as ssr from './ssr.mjs'
import * as lighthouse from './lighthouse.mjs'
import * as baseline from './baseline.mjs'
import { toMarkdown, toJson } from './report.mjs'


const major = Number(process.versions.node.split('.')[0])
if (major < 18) {
  console.error(`perf-audit needs Node 18 or later, found ${process.version}. Run it with: mise exec node@22 -- yarn perf:audit`)
  process.exit(2)
}

// Readiness is a TCP connect because a route fetched here would count as the cold pass.
export function checkServer(port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port, timeout: timeoutMs })
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('error', () => resolve(false))
    socket.once('timeout', () => { socket.destroy(); resolve(false) })
  })
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
  checkServer,
  environment,
  now: () => new Date(),
  commit: () => {
    try {
      return execSync('git rev-parse --short HEAD').toString().trim()
    } catch {
      return 'unknown'
    }
  },
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
    const start = await deps.waitForSettle(config.backendLog, { quietMs: 100, timeoutMs: 1000 })
    probed = await probeRoute(deps, url)
    await deps.waitForSettle(config.backendLog, {})
    const { text } = await deps.readNewLines(config.backendLog, start)
    backend.push(backendLog.groupByEndpoint(backendLog.parseLogLines(text)))
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
  const errors = []
  for (const example of selected) {
    try {
      if (!(await d.checkServer(example.port))) {
        throw new Error(`${example.name} is not answering on port ${example.port}; start it with scripts/perf-audit/serve-examples.sh`)
      }
      run[example.name] = {}
      for (const route of example.routes) run[example.name][route] = await measureRoute(example, route, d)
      if (!opts.skipLighthouse) {
        const dir = join(outDir, example.name)
        await mkdir(dir, { recursive: true })
        await d.runUnlighthouse(example, dir)
        const results = await d.readUnlighthouseResults(join(dir, 'unlighthouse'))
        for (const route of example.routes) {
          if (!results[route]) throw new Error(`${example.name} ${route}: no Lighthouse result`)
          run[example.name][route].lighthouse = results[route]
        }
      }
    } catch (err) {
      run[example.name] = run[example.name] || {}
      errors.push({ example: example.name, message: err.message })
      console.error(err.message)
    }
  }

  const baselineName = baselinePath(d.environment())
  const baselineFile = resolve(baselineName)
  const meta = { generatedAt: d.now().toISOString(), commit: d.commit(), baseline: baselineName }
  const existingBaseline = await d.loadBaseline(baselineFile)
  const comparison = baseline.compare(run, existingBaseline, config.budgets)
  const md = toMarkdown(comparison, meta)
  await writeFile(join(outDir, 'report.json'), JSON.stringify(toJson(run, comparison, meta, errors), null, 2))
  await writeFile(join(outDir, 'report.md'), md)
  console.log(md)
  const unhealthy = Object.values(run).some((routes) => Object.values(routes).some(({ ssr }) => ssr.status !== 200 || ssr.errorState))
  if (opts.updateBaseline && (errors.length || unhealthy)) console.error('Baseline not updated: the audit recorded errors or a route did not render cleanly.')
  else if (opts.updateBaseline) await d.saveBaseline(baselineFile, baseline.mergeBaseline(existingBaseline, run))
  return { run, breaches: comparison.breaches, outDir, errors }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAudit(parseArgs(process.argv.slice(2)))
    .then(({ breaches, outDir, errors }) => { console.error(`Report written to ${outDir}`); process.exit(breaches || errors.length ? 1 : 0) })
    .catch((err) => { console.error(err.message); process.exit(1) })
}
