#!/usr/bin/env node
// Reports whether a refreshed baseline moved on anything but run to run noise.
//
// The automatic refresh calls this before it opens a pull request. Without it
// every merge raises one, because the baseline holds timings and Lighthouse
// scores that differ between runs of the same commit.
//
// Usage: node scripts/perf-audit/baseline-changed.mjs <committed.json> <refreshed.json>
//
// Prints each moved metric, then `changed=true` or `changed=false`, and writes
// the same to GITHUB_OUTPUT when GitHub Actions sets it. Exits non-zero only
// when it cannot answer, so a broken run never reads as "nothing moved".
import { appendFile, readFile } from 'node:fs/promises'
import { movedMetrics } from './baseline.mjs'

const read = async (file) => {
  const contents = await readFile(file, 'utf8')
  try {
    return JSON.parse(contents)
  } catch (err) {
    throw new Error(`${file} is not valid JSON: ${err.message}`)
  }
}

export async function baselineChanged([committed, refreshed]) {
  if (!committed || !refreshed) throw new Error('Usage: baseline-changed.mjs <committed.json> <refreshed.json>')
  const moved = movedMetrics(await read(committed), await read(refreshed))

  for (const row of moved) {
    console.log(`${row.example} ${row.route} ${row.metric}: ${row.before} -> ${row.after}`)
  }
  console.log(`changed=${moved.length > 0}`)

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${moved.length > 0}\n`)
  }

  return moved
}

if (import.meta.url === `file://${process.argv[1]}`) {
  baselineChanged(process.argv.slice(2)).catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
