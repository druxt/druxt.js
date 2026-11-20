/**
 * Adds to a snapshot the packages that depend on the ones it releases, so
 * the published set is one coherent install. Run before
 * `changeset version --snapshot`.
 *
 *   node scripts/release/snapshot.mjs
 *
 * Changesets leaves a dependent at its released version while its range
 * still covers the new version of the sibling. A snapshot is a prerelease,
 * which npm keeps out of a range that does not name one, so the dependent
 * would install a second, released copy of the sibling. This writes a
 * changeset that gives each such dependent a patch, which makes it a snapshot
 * that pins the siblings published beside it.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPackages } from './check.mjs'
import { parseChangeset } from './lint-changesets.mjs'

const DEPENDENCY_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies']

const FILE = 'snapshot-dependents.md'

/**
 * Lists the published packages that depend on a released package, directly
 * or through another dependent, and are not released themselves.
 *
 * @param {object} options - The input.
 * @param {object[]} options.packages - `{ dir, manifest }` entries, private packages included.
 * @param {string[]} options.released - The names of the packages the pending changesets release.
 * @returns {string[]} The names of the dependents, in name order.
 */
export function snapshotDependents({ packages, released }) {
  const published = packages.filter(({ manifest }) => !manifest.private).map(({ manifest }) => manifest)
  const snapshot = new Set(released)

  let size
  do {
    size = snapshot.size
    for (const manifest of published) {
      const deps = DEPENDENCY_FIELDS.flatMap((field) => Object.keys(manifest[field] || {}))
      if (deps.some((dep) => snapshot.has(dep))) snapshot.add(manifest.name)
    }
  } while (snapshot.size > size)

  return published
    .map(({ name }) => name)
    .filter((name) => snapshot.has(name) && !released.includes(name))
    .sort()
}

/**
 * Writes the changeset that brings the dependents into the snapshot.
 *
 * @param {string[]} names - The package names.
 * @returns {string} The changeset file.
 */
export function snapshotChangeset(names) {
  const releases = names.map((name) => `'${name}': patch`).join('\n')
  return `---\n${releases}\n---\n\nBuilt against the snapshot of the packages it depends on.\n`
}

function main() {
  const root = process.cwd()
  const directory = path.join(root, '.changeset')

  const released = new Set()
  for (const file of fs.readdirSync(directory).filter((name) => name.endsWith('.md') && name !== 'README.md' && name !== FILE)) {
    const changeset = parseChangeset(fs.readFileSync(path.join(directory, file), 'utf8'))
    if (!changeset) continue
    for (const [name, bump] of Object.entries(changeset.releases)) {
      if (bump !== 'none') released.add(name)
    }
  }

  const names = snapshotDependents({ packages: readPackages(root), released: [...released] })
  if (!names.length) {
    console.log('release-snapshot: no dependents to add.')
    return
  }

  fs.writeFileSync(path.join(directory, FILE), snapshotChangeset(names))
  console.log(`release-snapshot: added ${names.join(', ')}.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`release-snapshot: ${error.message}`)
    process.exit(1)
  }
}
