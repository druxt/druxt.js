#!/usr/bin/env node
// Performance audit of the example applications. See README.md.
import { parseArgs } from './args.mjs'
import { config } from './config.mjs'

const major = Number(process.versions.node.split('.')[0])
if (major < 18) {
  console.error(`perf-audit needs Node 18 or later, found ${process.version}. Run it with: mise exec node@22 -- yarn perf:audit`)
  process.exit(2)
}

export async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv)
  const examples = config.examples.filter((e) => !opts.examples || opts.examples.includes(e.name))
  if (!examples.length) throw new Error(`No example matches ${opts.examples.join(', ')}`)
  // Later tasks fill in the run.
  return { opts, examples }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { console.error(err.message); process.exit(1) })
}
