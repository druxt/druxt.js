/**
 * Prints the changelog section for one released version, for a GitHub Release.
 *
 *   node scripts/release/notes.mjs druxt-site@0.15.0
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPackages } from './check.mjs'

/**
 * Extracts one version's section from a changelog.
 *
 * @param {string} changelog - The changelog source.
 * @param {string} version - The version to extract.
 * @returns {string|null} The section body, or `null` when the version has no heading.
 */
export function extractNotes(changelog, version) {
  const lines = changelog.split('\n')
  const isHeading = (line) => /^## \S/.test(line)
  const start = lines.findIndex((line) => isHeading(line) && line.slice(3).split(' ')[0] === version)
  if (start === -1) return null

  const rest = lines.slice(start + 1)
  const end = rest.findIndex(isHeading)
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim()
}

function main() {
  const tag = process.argv[2] || ''
  const at = tag.lastIndexOf('@')
  if (at < 1) throw new Error('Pass a release tag, such as druxt-site@0.15.0.')

  const [name, version] = [tag.slice(0, at), tag.slice(at + 1)]
  const found = readPackages(process.cwd()).find(({ manifest }) => manifest.name === name)
  if (!found) throw new Error(`No package named ${name}.`)

  const notes = extractNotes(fs.readFileSync(path.join(found.dir, 'CHANGELOG.md'), 'utf8'), version)
  if (notes === null) throw new Error(`${name} has no changelog section for ${version}.`)
  console.log(notes)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`release-notes: ${error.message}`)
    process.exit(1)
  }
}
