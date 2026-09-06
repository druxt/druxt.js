#!/usr/bin/env node
/**
 * Guards packages/druxtjs/examples/* against the two rot patterns found in
 * the 2026-08-11 examples audit (a `link:` dependency whose target doesn't
 * exist on disk, and an unpinned `latest`/edge-channel version range), plus
 * the per-example structure rules of the examples suite: every example
 * directory except `shared` is a standalone package with a `package.json`
 * declaring how it's run and tested.
 */

const fs = require('fs')
const path = require('path')

const examplesDir = path.join(__dirname, '..', 'examples')

/**
 * Directories that are shared infrastructure, not standalone example apps,
 * and therefore exempt from the structure rules (they have no package.json,
 * dev server, or test command of their own).
 */
const STRUCTURE_EXEMPT = ['shared']

/**
 * @param {string} dir - Directory to search.
 * @returns {string[]} Absolute paths of every package.json found one level
 *   below `dir` (`examples/<name>`).
 */
function findPackageJsonFiles (dir) {
  const found = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const entryPath = path.join(dir, entry.name)
    const pkgPath = path.join(entryPath, 'package.json')
    if (fs.existsSync(pkgPath)) {
      found.push(pkgPath)
      continue
    }
    // One level only: the structure rules below iterate top-level
    // examples/<name>, and a deeper scan would dependency-check nested
    // packages the structure rules never see.
  }
  return found
}

const errors = []

for (const pkgPath of findPackageJsonFiles(examplesDir)) {
  const pkgDir = path.dirname(pkgPath)
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  for (const [name, range] of Object.entries(deps)) {
    if (range.startsWith('link:')) {
      const target = path.join(pkgDir, range.slice('link:'.length))
      if (!fs.existsSync(target)) {
        errors.push(`${path.relative(examplesDir, pkgPath)}: "${name}": "${range}" does not resolve (${target} does not exist)`)
      }
    } else if (range === 'latest' || /-edge(\.|$)/.test(range)) {
      errors.push(`${path.relative(examplesDir, pkgPath)}: "${name}": "${range}" is an unpinned latest/edge-channel range - pin to a specific version`)
    }
  }
}

// Structure rules: every examples/<name> directory except the exempt ones is
// a standalone package with a name and a dev/test entry point. The exact
// script names vary by app type (Nuxt apps: dev/generate; the CLI: just
// test), so only the invariants that hold across all of them are checked.
const expected = fs.readdirSync(examplesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => !STRUCTURE_EXEMPT.includes(name))
  .sort()

for (const name of expected) {
  const dir = path.join(examplesDir, name)
  const pkgPath = path.join(dir, 'package.json')
  const rel = path.relative(examplesDir, pkgPath)

  if (!fs.existsSync(pkgPath)) {
    errors.push(`${name}/: missing package.json (every non-shared example is a standalone package)`)
    continue
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

  if (!pkg.name) {
    errors.push(`${rel}: missing "name"`)
  }

  if (!pkg.private) {
    errors.push(`${rel}: expected "private": true (examples are not published)`)
  }

  if (typeof pkg.scripts !== 'object' || !Object.keys(pkg.scripts).length) {
    errors.push(`${rel}: missing scripts - every example declares at least one command (dev and/or test)`)
  } else if (!pkg.scripts.test) {
    errors.push(`${rel}: missing "test" script - see the root example:* scripts for how tests are invoked`)
  }
}

if (errors.length > 0) {
  console.error(`Found ${errors.length} example issue(s):\n`)
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(`All ${expected.length} examples/* packages resolve, are pinned, and match the structure rules.`)
