/**
 * Prints the version pull request's body: each release with its changelog
 * section beneath it, so the release can be read before it is merged.
 *
 *   node scripts/release/pr-body.mjs <base-ref>
 *
 * changesets/action writes this body itself, but it looks for a heading that
 * reads exactly the version. scripts/changelog-dates.mjs adds the date to
 * every heading, so the action found no section, fell back to the whole file
 * and then left every changelog out as too long.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPackages } from './check.mjs'
import { extractNotes } from './notes.mjs'

// GitHub refuses a body over 65,536 characters. The rest is kept for the intro.
const LIMIT = 60000

const INTRO = [
  'This pull request versions the packages with pending changesets. Merging it releases them: while the repository variable `NPM_PUBLISH` is `true`, the release job publishes each version below to npm and creates its GitHub Release from the same notes. Otherwise the run packs them as a dry run and publishes nothing.',
  '',
  'It is kept up to date while changesets are pending, so merge it last.',
].join('\n')

/**
 * Builds the body from the releases.
 *
 * @param {object[]} releases - `{ name, version, notes, changelog }` entries, `notes` the section text and `changelog` a link to the file.
 * @param {number} [limit] - Characters the body may use.
 * @returns {string} The body.
 */
export function buildBody(releases, limit = LIMIT) {
  const section = ({ name, version, notes }) => `## ${name}@${version}\n\n${notes}`
  const full = [INTRO, '# Releases', ...releases.map(section)].join('\n\n')
  if (full.length <= limit) return `${full}\n`

  // Too long to show whole: each release keeps an equal share, and links the rest.
  const share = Math.floor((limit - INTRO.length) / Math.max(releases.length, 1)) - 200
  const trimmed = releases.map((release) => {
    if (section(release).length <= share) return section(release)
    const cut = release.notes.slice(0, Math.max(share, 0)).replace(/\n[^\n]*$/, '')
    return `## ${release.name}@${release.version}\n\n${cut}\n\n[The whole ${release.version} section](${release.changelog}) is too long for this description.`
  })
  return `${[INTRO, '# Releases', ...trimmed].join('\n\n')}\n`
}

/**
 * The packages whose version differs from the base, with their notes.
 *
 * @param {string} root - The repository root.
 * @param {string} base - The ref the version commit was made on.
 * @param {string} blob - The URL prefix of a file on the version branch.
 * @returns {object[]} `{ name, version, notes, changelog }` entries.
 */
export function readReleases(root, base, blob) {
  return readPackages(root)
    .filter(({ manifest }) => !manifest.private)
    .filter(({ dir }) => {
      const file = path.relative(root, path.join(dir, 'package.json'))
      try {
        const before = JSON.parse(execFileSync('git', ['show', `${base}:${file}`], { cwd: root, encoding: 'utf8' }))
        return before.version !== JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version
      } catch (error) {
        // A package the base does not have is new, so it is a release.
        return true
      }
    })
    .map(({ dir, manifest }) => {
      const changelog = path.join(dir, 'CHANGELOG.md')
      const notes = fs.existsSync(changelog) ? extractNotes(fs.readFileSync(changelog, 'utf8'), manifest.version) : null
      return {
        name: manifest.name,
        version: manifest.version,
        notes: notes || '_No changelog section for this version._',
        changelog: `${blob}/${path.relative(root, changelog)}`,
      }
    })
}

function main() {
  const base = process.argv[2]
  if (!base) throw new Error('Pass the ref the version commit was made on, such as origin/0.x.')
  const repo = process.env.GITHUB_REPOSITORY || 'druxt/druxt.js'
  // changesets/action pushes the version commit to this branch through the API,
  // so the local checkout's own branch name says nothing about it.
  const branch = `changeset-release/${process.env.GITHUB_REF_NAME || '0.x'}`
  const releases = readReleases(process.cwd(), base, `https://github.com/${repo}/blob/${branch}`)
  if (!releases.length) throw new Error(`No package version differs from ${base}.`)
  process.stdout.write(buildBody(releases))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`pr-body: ${error.message}`)
    process.exit(1)
  }
}
