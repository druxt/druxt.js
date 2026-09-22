/**
 * Pre-publish gate: refuses a release set that would publish broken or
 * skewed packages. Run after `changeset version` and `yarn build`, before
 * any `changeset publish`.
 *
 *   node scripts/release/check.mjs [--offline] [--skip-files]
 *
 * --offline     skip the npm registry comparison.
 * --skip-files  skip the built-files check (no build has run).
 */
import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

const DEPENDENCY_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies']

const REGISTRY_TIMEOUT = 15000

// Specifiers that only resolve inside this repository or off the registry.
const UNPUBLISHABLE = /^(workspace|link|file|portal|git|git\+ssh|git\+https|github|https?):/

/**
 * Reads every package manifest under a packages directory.
 *
 * @param {string} root - The repository root.
 * @returns {object[]} One `{ dir, manifest }` entry per package.
 */
export function readPackages(root) {
  const base = path.join(root, 'packages')
  return fs.readdirSync(base)
    .map((name) => path.join(base, name))
    .filter((dir) => fs.existsSync(path.join(dir, 'package.json')))
    .map((dir) => ({ dir, manifest: JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) }))
}

/**
 * Checks a release set.
 *
 * @param {object} options - The check input.
 * @param {object[]} options.packages - `{ dir, manifest }` entries, private packages included.
 * @param {object} [options.registry] - Package name to `{ latest, versions }`, or `null` when unpublished. Omit to skip the registry rules.
 * @param {boolean} [options.files] - Whether to check that each `files` entry was built.
 * @returns {string[]} One message per problem. Empty when the set can publish.
 */
export function checkPackages({ packages, registry, files = true }) {
  const problems = []
  const workspace = new Map(packages.map(({ manifest }) => [manifest.name, manifest]))
  const published = packages.filter(({ manifest }) => !manifest.private)

  for (const { dir, manifest } of published) {
    const { name, version } = manifest

    if (!semver.valid(version)) {
      problems.push(`${name}: "${version}" is not a valid version.`)
      continue
    }

    for (const field of DEPENDENCY_FIELDS) {
      for (const [dep, range] of Object.entries(manifest[field] || {})) {
        if (UNPUBLISHABLE.test(range)) {
          problems.push(`${name}: ${field}.${dep} is "${range}", which does not resolve from npm.`)
          continue
        }

        const sibling = workspace.get(dep)
        if (!sibling) {
          if (range === 'latest' || semver.validRange(range) === '*') {
            problems.push(`${name}: ${field}.${dep} is "${range}", which accepts any future release. State the range the package supports.`)
          }
          continue
        }

        if (sibling.private) {
          problems.push(`${name}: ${field}.${dep} names a private package, so an install from npm cannot resolve it.`)
        } else if (!semver.satisfies(sibling.version, range, { includePrerelease: true })) {
          problems.push(`${name}: ${field}.${dep} is "${range}", but this release carries ${dep}@${sibling.version}.`)
        }
      }
    }

    const record = registry && registry[name]
    if (record && !record.versions.includes(version)) {
      const base = `${semver.major(version)}.${semver.minor(version)}.${semver.patch(version)}`
      if (semver.prerelease(version) && !semver.gt(base, record.latest)) {
        problems.push(`${name}: ${version} sorts below the published ${record.latest}. Raise the version in package.json to the published one.`)
      } else if (!semver.prerelease(version) && !semver.gt(version, record.latest)) {
        problems.push(`${name}: ${version} is not above the published ${record.latest}.`)
      }
    }

    if (files) {
      for (const entry of manifest.files || []) {
        const target = path.join(dir, entry)
        if (!fs.existsSync(target)) {
          problems.push(`${name}: files entry "${entry}" does not exist. Run yarn build first.`)
        } else if (fs.statSync(target).isDirectory() && fs.readdirSync(target).length === 0) {
          problems.push(`${name}: files entry "${entry}" is empty.`)
        }
      }
    }
  }

  // Siblings install together, so one sibling's copy of an outside package must satisfy another's peer range.
  for (const { manifest: peer } of published) {
    for (const [dep, peerRange] of Object.entries(peer.peerDependencies || {})) {
      if (workspace.has(dep) || !semver.validRange(peerRange)) continue
      for (const { manifest: other } of published) {
        const range = (other.dependencies || {})[dep]
        if (other === peer || !range || !semver.validRange(range)) continue
        if (!semver.intersects(range, peerRange)) {
          problems.push(`${other.name}: dependencies.${dep} is "${range}", outside ${peer.name}'s peerDependencies.${dep} "${peerRange}".`)
        }
      }
    }
  }

  return problems
}

/**
 * Fetches a package's published versions from the npm registry.
 *
 * @param {string} name - The package name.
 * @returns {Promise<object|null>} `{ latest, versions }`, or `null` when the package is unpublished.
 */
export function fetchRecord(name) {
  const url = `https://registry.npmjs.org/${name.replace(/\//g, '%2f')}`
  const headers = { accept: 'application/vnd.npm.install-v1+json' }

  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers, timeout: REGISTRY_TIMEOUT }, (response) => {
      if (response.statusCode === 404) {
        response.resume()
        return resolve(null)
      }
      if (response.statusCode !== 200) {
        response.resume()
        return reject(new Error(`npm registry answered ${response.statusCode} for ${name}.`))
      }

      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => {
        const data = JSON.parse(body)
        resolve({ latest: data['dist-tags'].latest, versions: Object.keys(data.versions) })
      })
    })

    // Without this a stalled connection holds the job until its own timeout.
    request.on('timeout', () => request.destroy(new Error(`npm registry did not answer for ${name} within ${REGISTRY_TIMEOUT / 1000}s.`)))
    request.on('error', reject)
  })
}

async function main() {
  const args = process.argv.slice(2)
  const unknown = args.filter((arg) => !['--offline', '--skip-files'].includes(arg))
  if (unknown.length) throw new Error(`Unknown option: ${unknown.join(', ')}`)

  const packages = readPackages(process.cwd())
  let registry
  if (!args.includes('--offline')) {
    registry = {}
    for (const { manifest } of packages.filter(({ manifest }) => !manifest.private)) {
      registry[manifest.name] = await fetchRecord(manifest.name)
    }
  }

  const problems = checkPackages({ packages, registry, files: !args.includes('--skip-files') })
  for (const problem of problems) console.error(`release-check: ${problem}`)

  const count = packages.filter(({ manifest }) => !manifest.private).length
  if (problems.length) {
    console.error(`release-check: ${problems.length} problem(s) across ${count} published package(s).`)
    process.exit(1)
  }
  console.log(`release-check: ${count} published package(s) can publish.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`release-check: ${error.message}`)
    process.exit(1)
  })
}
