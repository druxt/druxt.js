// Reads and rewrites the committed baseline and compares a run against it under the budgets.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

export const METRICS = [
  'backendCold.total', 'backendWarm.total',
  'backendCold.index', 'backendCold.collections', 'backendCold.resources', 'backendCold.router', 'backendCold.menu',
  'backendWarm.index', 'backendWarm.collections', 'backendWarm.resources', 'backendWarm.router', 'backendWarm.menu',
  'ssr.status', 'ssr.errorState', 'ssr.ttfbMs', 'ssr.nuxtBytes', 'ssr.fetchKeys',
  'lighthouse.performance', 'lighthouse.lcpMs', 'lighthouse.clsScore', 'lighthouse.tbtMs', 'lighthouse.postLoadApiCalls',
]

function read(entry, metric) {
  const [group, key] = metric.split('.')
  const value = entry?.[group]?.[key]
  return value === undefined ? null : value
}

function breachFor(metric, current, baseline, budgets) {
  if (metric === 'ssr.status' && current !== 200) return `status ${current}`
  if (metric === 'ssr.errorState' && current) return 'error state'
  if (current === null || baseline === null) return null
  // The no-increase budget applies to the two totals only; the endpoint group rows carry no budget.
  if (metric.endsWith('.total') && budgets.backendRequests === 'no-increase' && current > baseline) return 'more backend requests'
  if (metric === 'lighthouse.performance' && baseline - current > budgets.performanceDrop) return `performance down ${baseline - current}`
  if (metric === 'ssr.nuxtBytes' && baseline > 0 && (current - baseline) / baseline * 100 > budgets.payloadGrowthPercent) return 'payload grew'
  return null
}

export function compare(run, baseline, budgets) {
  const rows = []
  for (const [example, routes] of Object.entries(run)) {
    for (const [route, entry] of Object.entries(routes)) {
      const base = baseline?.[example]?.[route]
      for (const metric of METRICS) {
        const current = read(entry, metric)
        const previous = base ? read(base, metric) : null
        const numeric = typeof current === 'number' && typeof previous === 'number'
        rows.push({ example, route, metric, current, baseline: previous, delta: numeric ? Number((current - previous).toFixed(3)) : null, breach: breachFor(metric, current, previous, budgets) })
      }
    }
  }
  return { rows, breaches: rows.filter((row) => row.breach).length }
}

export async function loadBaseline(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw err
  }
}

export async function saveBaseline(file, run) {
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(run, null, 2) + '\n')
}

// Merges a run into the existing baseline instead of replacing it: examples and
// routes the run didn't touch are kept, and a skipped (null) lighthouse result
// doesn't erase a previously measured one.
export function mergeBaseline(existing, run) {
  const merged = { ...existing }
  for (const [example, routes] of Object.entries(run)) {
    const existingRoutes = merged[example] || {}
    const mergedRoutes = { ...existingRoutes }
    for (const [route, entry] of Object.entries(routes)) {
      const previous = existingRoutes[route] || {}
      mergedRoutes[route] = {
        ...previous,
        backendCold: entry.backendCold,
        backendWarm: entry.backendWarm,
        ssr: entry.ssr,
        lighthouse: entry.lighthouse !== null ? entry.lighthouse : (previous.lighthouse ?? null),
      }
    }
    merged[example] = mergedRoutes
  }
  return merged
}
