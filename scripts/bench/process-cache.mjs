/**
 * A benchmark for the process cache in `packages/client/src/processCache.ts`.
 *
 * It drives the real `processCache()` the way the content cache does: each request takes a handle for its consumer,
 * reads the document, and on a miss stores what Drupal would have answered. The workloads are seeded, so every run
 * sends the same requests in the same order, and each one runs at the 50 MB default `maxSize` and at a small one
 * that forces eviction. For each it prints the hit rate overall and per partition, the bytes held (peak and final),
 * the evictions, and the time a get and a set take, median and p99, over several runs to show the machine's spread.
 *
 *     node scripts/bench/process-cache.mjs [--runs 5] [--requests 200000] [--only a,c] [--sizes 50,5] [--json out.json]
 *
 * `--sizes` takes the `maxSize` values to run at, in MB.
 *
 * `--cache <module>` runs the workloads against another module with the same `processCache(scope, options)` and
 * `resetProcessCache()` exports, such as an adapter for an older release. Run each module in its own process: every
 * copy of the cache shares one store on `globalThis`.
 *
 * Values are small objects whose `sizeOf` is the document's size, so a set is timed without measuring a body, and
 * the bytes held are the bytes the cache counts against `maxSize`, not the process's heap.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const { values: args } = parseArgs({
  options: {
    runs: { type: 'string', default: '5' },
    requests: { type: 'string', default: '200000' },
    only: { type: 'string' },
    sizes: { type: 'string', default: '50,5' },
    cache: { type: 'string', default: path.join(root, 'packages/client/src/processCache.ts') },
    label: { type: 'string' },
    json: { type: 'string' },
  },
})
/** A flag's value as a number above zero, or an error naming the flag before any work starts. */
const positive = (flag, value) => {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) throw new Error(`--${flag} takes a number above zero, not "${value}".`)
  return number
}
const RUNS = positive('runs', args.runs)
const REQUESTS = positive('requests', args.requests)
const cache = await import(pathToFileURL(path.resolve(args.cache)).href)

const MB = 1024 * 1024
const KB = 1024
const SIZES = args.sizes.split(',').map((size) => positive('sizes', size) * MB)
const SCOPE = 'content'
// Long enough that nothing expires during a run, so every miss after the first read is an eviction.
const LIFETIME = 3600
// The share of requests a run starts with that warm the cache and count for nothing.
const WARM_UP = 0.25
// How often, in sets, the bytes held are read for the peak.
const SAMPLE_EVERY = 16

/** A seeded generator of numbers in [0, 1): mulberry32. */
const random = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Picks 0 to n - 1, rank r with weight 1 / (r + 1)^s. */
const ranked = (n, s, next) => {
  const cdf = new Float64Array(n)
  let sum = 0
  for (let r = 0; r < n; r++) cdf[r] = sum += 1 / (r + 1) ** s
  return () => {
    const target = next() * sum
    let low = 0
    let high = n - 1
    while (low < high) {
      const mid = (low + high) >> 1
      if (cdf[mid] < target) low = mid + 1
      else high = mid
    }
    return low
  }
}

/** A site's documents: sizes spread evenly on a log scale from 2 KB to 200 KB, popularity independent of size. */
const site = (count, next) => {
  const sizes = Array.from({ length: count }, () => Math.round(2 * KB * 100 ** next()))
  // Rank to document: a shuffle, so the most read document is not the smallest or the largest.
  const order = sizes.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const bySize = order.slice().sort((a, b) => sizes[a] - sizes[b])
  return { sizes, order, smallest: bySize.slice(0, 50), largest: bySize.slice(-20) }
}

const DOCUMENTS = 3000
// How steeply popularity falls with rank: web traffic falls about as 1 / rank.
const POPULARITY = 0.9
// The share of reads that are a bypass, whose answer replaces the stored entry.
const REFRESH = 0.01

/**
 * The workloads. Each request is `[group, consumer, key, size, refresh]`: the group names the partition in the
 * results, and the attacker's thousands of consumers count as one group.
 */
const WORKLOADS = {
  a: {
    title: 'one partition, a realistic site',
    build: (next, docs) => {
      const pick = ranked(DOCUMENTS, POPULARITY, next)
      return () => ['site', '', docs.order[pick()]]
    },
  },
  b: {
    title: '4 partitions, equal traffic (four languages)',
    build: (next, docs) => {
      const pick = ranked(DOCUMENTS, POPULARITY, next)
      return () => {
        const lang = Math.floor(next() * 4)
        return [`lang ${lang}`, `lang-${lang}`, docs.order[pick()]]
      }
    },
  },
  c: {
    title: '4 partitions, one with 90% of traffic',
    build: (next, docs) => {
      const pick = ranked(DOCUMENTS, POPULARITY, next)
      return () => {
        const roll = next()
        const lang = roll < 0.9 ? 0 : 1 + Math.floor((roll - 0.9) / 0.1 * 3)
        return [lang ? 'quiet' : 'busy', `lang-${lang}`, docs.order[pick()]]
      }
    },
  },
  d: {
    title: '32 partitions, a long tail',
    build: (next, docs) => {
      const pick = ranked(DOCUMENTS, POPULARITY, next)
      const partition = ranked(32, 1.2, next)
      return () => {
        const p = partition()
        return [p < 4 ? 'head (1-4)' : p < 12 ? 'middle (5-12)' : 'tail (13-32)', `p-${p}`, docs.order[pick()]]
      }
    },
  },
  e: {
    title: 'an attacker cycling 5000 consumers, one small document each, beside a busy partition',
    build: (next, docs) => {
      const pick = ranked(DOCUMENTS, POPULARITY, next)
      let attack = 0
      return (i) => {
        if (i % 2) return ['site', '', docs.order[pick()]]
        attack = (attack + 1) % 5000
        return ['attacker', `attacker-${attack}`, docs.smallest[attack % docs.smallest.length]]
      }
    },
  },
  f: {
    title: 'as e, but each attacking consumer reads one of the 20 largest documents',
    build: (next, docs) => {
      const pick = ranked(DOCUMENTS, POPULARITY, next)
      let attack = 0
      return (i) => {
        if (i % 2) return ['site', '', docs.order[pick()]]
        attack = (attack + 1) % 5000
        return ['attacker', `attacker-${attack}`, docs.largest[attack % docs.largest.length]]
      }
    },
  },
}

/** The bytes and entries the scope holds, read from the store every copy of the cache keeps on `globalThis`. */
const held = () => {
  const area = globalThis[Symbol.for('druxt.processCache')]?.get(SCOPE)
  const size = Symbol.for('druxt.processCacheSize')
  let bytes = 0
  let entries = 0
  for (const partition of area?.values() || []) {
    bytes += partition[size] || 0
    entries += partition.size
  }
  return { bytes, entries, partitions: area?.size || 0 }
}

const percentile = (values, p) => {
  const sorted = Float64Array.from(values).sort()
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] || 0
}
const median = (values) => percentile(values, 0.5)

/** One run of a workload at one `maxSize`. */
const run = (id, maxSize, seed) => {
  const next = random(seed)
  const docs = site(DOCUMENTS, next)
  const request = WORKLOADS[id].build(next, docs)
  const sizeOf = (value) => value.size
  cache.resetProcessCache()

  const gets = []
  const sets = []
  const groups = {}
  let inserts = 0
  let peak = 0
  let written = 0
  const warm = Math.floor(REQUESTS * WARM_UP)
  for (let i = 0; i < REQUESTS; i++) {
    const [group, consumer, doc] = request(i)
    const key = `["https://drupal.example","/jsonapi/node/page/${doc}"]`
    const counted = i >= warm
    const refresh = next() < REFRESH

    let start = performance.now()
    const value = cache.processCache(SCOPE, { consumer, maxSize, sizeOf }).get(key)
    const read = performance.now() - start
    if (counted) {
      gets.push(read)
      const tally = groups[group] || (groups[group] = { hits: 0, requests: 0 })
      tally.requests++
      if (value) tally.hits++
    }
    if (value && !refresh) continue

    start = performance.now()
    cache.processCache(SCOPE, { consumer, maxSize, sizeOf }).set(key, { doc, size: docs.sizes[doc] }, LIFETIME)
    const wrote = performance.now() - start
    if (counted) sets.push(wrote)
    if (!value) inserts++
    if (++written % SAMPLE_EVERY === 0) peak = Math.max(peak, held().bytes)
  }
  const end = held()
  const all = Object.values(groups).reduce((sum, g) => ({ hits: sum.hits + g.hits, requests: sum.requests + g.requests }), { hits: 0, requests: 0 })
  return {
    hits: Object.fromEntries(Object.entries(groups).map(([name, g]) => [name, g.hits / g.requests])),
    hit: all.hits / all.requests,
    peak: Math.max(peak, end.bytes),
    final: end.bytes,
    evictions: inserts - end.entries,
    partitions: end.partitions,
    get: { p50: median(gets), p99: percentile(gets, 0.99) },
    set: { p50: median(sets), p99: percentile(sets, 0.99) },
  }
}

const ids = args.only ? args.only.split(',') : Object.keys(WORKLOADS)
const results = []
const started = performance.now()
for (const id of ids) {
  for (const maxSize of SIZES) {
    const runs = Array.from({ length: RUNS }, (_, r) => run(id, maxSize, 1000 + r))
    // The workload is seeded per run, so the counts differ only with the seed; the timings differ with the machine.
    const spread = (pick) => ({ median: median(runs.map(pick)), min: Math.min(...runs.map(pick)), max: Math.max(...runs.map(pick)) })
    results.push({
      workload: id,
      title: WORKLOADS[id].title,
      maxSize,
      hit: spread((r) => r.hit),
      hits: Object.fromEntries(Object.keys(runs[0].hits).map((group) => [group, median(runs.map((r) => r.hits[group] ?? 0))])),
      peak: spread((r) => r.peak),
      final: spread((r) => r.final),
      evictions: spread((r) => r.evictions),
      partitions: spread((r) => r.partitions),
      get: { p50: spread((r) => r.get.p50), p99: spread((r) => r.get.p99) },
      set: { p50: spread((r) => r.set.p50), p99: spread((r) => r.set.p99) },
    })
  }
}
const seconds = (performance.now() - started) / 1000

const machine = `${os.cpus()[0]?.model || os.arch()} (${os.cpus().length} cores, ${os.arch()}), ${os.platform()} ${os.release()}, Node ${process.version}`
const label = args.label || path.relative(root, path.resolve(args.cache))
const percent = (n) => `${(n * 100).toFixed(1)}%`
const mb = (n) => (n / MB).toFixed(1)
const us = (s) => `${(s.median * 1000).toFixed(2)} (${(s.min * 1000).toFixed(2)}-${(s.max * 1000).toFixed(2)})`

console.log(`# Process cache benchmark: ${label}\n`)
console.log(`${machine}. ${RUNS} runs of ${REQUESTS} requests per workload, ${seconds.toFixed(0)} s in all.`)
console.log('Times in microseconds, the median over the runs with their range; hit rates after the first')
console.log(`${WARM_UP * 100}% of requests.\n`)
console.log('| workload | maxSize | hit rate | hit rate per partition | peak MB | final MB | evictions | partitions | get p50 | get p99 | set p50 | set p99 |')
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for (const r of results) {
  const groups = Object.entries(r.hits).map(([name, hit]) => `${name} ${percent(hit)}`).join(', ')
  console.log(`| ${r.workload} | ${mb(r.maxSize)} MB | ${percent(r.hit.median)} | ${groups} | ${mb(r.peak.median)} | ${mb(r.final.median)} | ${r.evictions.median} | ${r.partitions.median} | ${us(r.get.p50)} | ${us(r.get.p99)} | ${us(r.set.p50)} | ${us(r.set.p99)} |`)
}
console.log('')
for (const id of ids) console.log(`- ${id}: ${WORKLOADS[id].title}`)

if (args.json) fs.writeFileSync(args.json, `${JSON.stringify({ label, machine, runs: RUNS, requests: REQUESTS, seconds, results }, null, 2)}\n`)
