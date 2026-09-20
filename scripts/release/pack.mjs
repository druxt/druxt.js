/**
 * Packs the release set into tarballs, so a later job can publish them
 * without checking out or running any repository code.
 *
 *   node scripts/release/pack.mjs <out dir> [name@version ...]
 *
 * With no `name@version` arguments every published package is packed. The
 * output directory gets one tarball per package and a `manifest.json` that
 * lists them in publish order: a package always follows the siblings it
 * depends on, so an install never finds a version whose dependency is not
 * there yet.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPackages } from './check.mjs'

const DEPENDENCY_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies']

/**
 * Orders published packages so each follows its workspace dependencies.
 *
 * @param {object[]} packages - `{ dir, manifest }` entries, private packages included.
 * @returns {object[]} The published entries, dependencies first.
 */
export function publishOrder(packages) {
  const published = packages.filter(({ manifest }) => !manifest.private)
  const byName = new Map(published.map((entry) => [entry.manifest.name, entry]))
  const ordered = []
  const state = new Map()

  const visit = (entry, trail) => {
    const { name } = entry.manifest
    if (state.get(name) === 'done') return
    if (state.get(name) === 'visiting') {
      throw new Error(`Dependency cycle: ${[...trail, name].join(' -> ')}`)
    }

    state.set(name, 'visiting')
    const deps = DEPENDENCY_FIELDS.flatMap((field) => Object.keys(entry.manifest[field] || {}))
    for (const dep of [...new Set(deps)].sort()) {
      if (byName.has(dep)) visit(byName.get(dep), [...trail, name])
    }
    state.set(name, 'done')
    ordered.push(entry)
  }

  for (const entry of [...published].sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))) {
    visit(entry, [])
  }
  return ordered
}

function main() {
  const [out, ...only] = process.argv.slice(2)
  if (!out) throw new Error('Pass an output directory.')

  const destination = path.resolve(out)
  fs.mkdirSync(destination, { recursive: true })

  const ordered = publishOrder(readPackages(process.cwd()))
  const known = new Set(ordered.map(({ manifest }) => `${manifest.name}@${manifest.version}`))
  const unknown = only.filter((tag) => !known.has(tag))
  if (unknown.length) throw new Error(`Not in this release set: ${unknown.join(', ')}`)

  const manifest = []
  for (const { dir, manifest: pkg } of ordered) {
    if (only.length && !only.includes(`${pkg.name}@${pkg.version}`)) continue

    const output = execFileSync('npm', ['pack', '--json', '--pack-destination', destination], { cwd: dir, encoding: 'utf8' })
    const [{ filename }] = JSON.parse(output)
    // npm 8 reports a scoped tarball as "@scope/name-1.0.0.tgz" and writes "scope-name-1.0.0.tgz".
    const file = filename.replace(/^@/, '').replace(/\//g, '-')
    if (!fs.existsSync(path.join(destination, file))) throw new Error(`npm pack did not write ${file}.`)

    manifest.push({ name: pkg.name, version: pkg.version, file })
    console.log(`release-pack: ${pkg.name}@${pkg.version} -> ${file}`)
  }

  fs.writeFileSync(path.join(destination, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`release-pack: ${manifest.length} tarball(s) in ${out}.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`release-pack: ${error.message}`)
    process.exit(1)
  }
}
