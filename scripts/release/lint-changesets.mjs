/**
 * Checks the pending changesets against the project style, so the version pull
 * request needs no clean-up pass before a release.
 *
 *   node scripts/release/lint-changesets.mjs [--preview]
 *
 * --preview  also print each package's changelog section as the version pull
 *            request would write it, so a changeset that names several
 *            packages can be read the way each of their changelogs shows it.
 *
 * Prose is Vale's job (yarn lint:prose covers .changeset/). This covers the
 * shape changesets and the changelog generator need, and how a changeset
 * reads once it is copied into more than one changelog.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { readPackages } from './check.mjs'

const require = createRequire(import.meta.url)

// The conventional prefix the changelog generator turns into the trailing
// issue link: `fix(#836): …`, or `feat(#87)!: …` for a breaking change.
const PREFIX = /^(feat|fix|perf|refactor|docs|revert)\((#\d+(?:, ?#\d+)*)\)(!)?: (.*)$/
// "Fix a …" renders as "Fixed a …": it narrates the patch instead of saying
// what is true for the site now.
const NARRATING = /^(fix|fixes|fixed|fixing)\b/i
const META = /\b(this|the) (PR|pull request|changeset|commit)\b|\bwe\b/i
const DEICTIC = /\b(this|these) (package|module|packages|modules)\b/i
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m

// The package a component belongs to, by its name. Druxt's own core
// (`DruxtClient`, `DruxtModule`, `DruxtWrapper`) is shared by every module,
// so naming it reads correctly in any changelog.
const OWNERS = [
  [/^DruxtBlock/, 'druxt-blocks'],
  [/^DruxtBreadcrumb/, 'druxt-breadcrumb'],
  [/^Druxt(Entity|Field)/, 'druxt-entity'],
  [/^DruxtMenu/, 'druxt-menu'],
  [/^DruxtRouter/, 'druxt-router'],
  [/^DruxtSchema/, 'druxt-schema'],
  [/^DruxtSite/, 'druxt-site'],
  [/^DruxtView/, 'druxt-views'],
]

/**
 * Splits a changeset into its releases and its summary.
 *
 * @param {string} source - The changeset file.
 * @returns {{ releases: object, summary: string }|null} `null` when it has no frontmatter.
 */
export function parseChangeset(source) {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source.replace(/\r\n/g, '\n'))
  if (!match) return null
  const releases = {}
  for (const line of match[1].split('\n').filter((l) => l.trim())) {
    const entry = /^\s*['"]?([^'":]+)['"]?\s*:\s*['"]?(\w+)['"]?\s*$/.exec(line)
    releases[entry ? entry[1] : line.trim()] = entry ? entry[2] : null
  }
  return { releases, summary: match[2].trim() }
}

// The prose of a summary with its code removed, so a rule about wording
// never fires on an identifier or a code sample.
const prose = (text) => text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '`code`')

/**
 * Checks one changeset.
 *
 * @param {string} source - The changeset file.
 * @param {Map<string, object>} packages - Published package name to its manifest.
 * @returns {string[]} One message per problem.
 */
export function lintChangeset(source, packages) {
  const parsed = parseChangeset(source)
  if (!parsed) return ['has no frontmatter naming the packages it releases.']
  const { releases, summary } = parsed
  const problems = []
  const names = Object.keys(releases)

  if (!names.length) problems.push('releases no package. Remove it, or name the packages it changes.')
  for (const name of names) {
    const manifest = packages.get(name)
    const bump = releases[name]
    if (!manifest) {
      problems.push(`names "${name}", which is not a published package here.`)
    } else if (!['patch', 'minor', 'major'].includes(bump)) {
      problems.push(`gives ${name} the bump "${bump}". Use patch, minor or major.`)
    } else if (bump === 'major' && /^0\./.test(manifest.version)) {
      problems.push(`gives ${name} a major bump, which publishes 1.0.0. A breaking change on 0.x is a minor.`)
    }
  }

  const [first = '', ...rest] = summary.split('\n')
  const body = rest.join('\n')
  const prefix = PREFIX.exec(first)
  if (!prefix) {
    problems.push('must start with `type(#N): `, such as `fix(#836): `, where #N is the GitHub issue, or the pull request when there is no issue. The changelog links it.')
  } else {
    const [, , , bang, sentence] = prefix
    if (!/^[a-z`]/.test(sentence)) {
      problems.push('starts its sentence with a capital. Write it lowercase after the colon, or open with code in backticks. The changelog adds the capital.')
    }
    if (NARRATING.test(sentence)) {
      problems.push('opens with "fix", which the changelog renders as "Fixed …". Say what is true for the site now, such as "`getSchema()` resolves `false` …".')
    }
    const breaking = Boolean(bang) || BREAKING_FOOTER.test(body)
    if (breaking && names.some((name) => releases[name] === 'patch')) {
      problems.push('is breaking but releases a patch. A breaking change is a minor on 0.x.')
    }
  }

  // Headings would end the release's section in the changelog.
  const outsideCode = summary.replace(/```[\s\S]*?```/g, '')
  if (/^#{1,6} /m.test(outsideCode)) problems.push('has a Markdown heading, which would cut the changelog section short. Use a paragraph or a list.')
  // Opening fences alternate with closing ones, and only an opening one names a language.
  const openings = (summary.match(/^\s*```.*$/gm) || []).filter((fence, index) => index % 2 === 0)
  if (openings.some((fence) => fence.trim() === '```')) {
    problems.push('has a code block without a language, such as ```js.')
  }
  if (META.test(prose(summary))) {
    problems.push('talks about the change itself ("this PR", "we"). Write for someone upgrading: what changed for their site.')
  }

  if (names.length > 1) {
    const text = prose(summary)
    if (DEICTIC.test(text)) {
      problems.push(`says "this package" while it is copied into ${names.length} changelogs. Name what changed instead.`)
    }
    const components = new Set((summary.match(/\bDruxt[A-Z]\w*/g) || []))
    for (const component of components) {
      const owner = (OWNERS.find(([pattern]) => pattern.test(component)) || [])[1]
      if (owner && names.includes(owner) && !summary.includes(owner)) {
        const others = names.filter((name) => name !== owner).join(', ')
        problems.push(`names \`${component}\` from ${owner}, which reads as off-topic in the changelogs of ${others}. Name ${owner} beside it, or split the changeset per package.`)
      }
    }
  }

  return problems
}

/**
 * Renders each package's changelog section from the pending changesets, as
 * `changeset version` would, without changing any file.
 *
 * @param {object[]} changesets - `{ id, source }` entries.
 * @returns {Promise<Map<string, string>>} Package name to its rendered lines.
 */
export async function previewSections(changesets) {
  const { getReleaseLine } = require(path.resolve('.changeset/changelog.cjs'))
  const sections = new Map()
  for (const { id, source } of changesets) {
    const parsed = parseChangeset(source)
    if (!parsed) continue
    const line = await getReleaseLine({ id, summary: parsed.summary }, 'patch')
    for (const name of Object.keys(parsed.releases)) {
      sections.set(name, [sections.get(name), line].filter(Boolean).join('\n'))
    }
  }
  return sections
}

const readChangesets = (root) => {
  const dir = path.join(root, '.changeset')
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .sort()
    .map((file) => ({ id: file.replace(/\.md$/, ''), file, source: fs.readFileSync(path.join(dir, file), 'utf8') }))
}

async function main() {
  const root = process.cwd()
  const packages = new Map(readPackages(root).filter(({ manifest }) => !manifest.private).map(({ manifest }) => [manifest.name, manifest]))
  const changesets = readChangesets(root)

  let failed = 0
  for (const { file, source } of changesets) {
    for (const problem of lintChangeset(source, packages)) {
      console.error(`.changeset/${file} ${problem}`)
      failed += 1
    }
  }

  if (process.argv.includes('--preview')) {
    for (const [name, lines] of await previewSections(changesets)) console.log(`## ${name}\n\n${lines}\n`)
  }

  if (failed) process.exit(1)
  console.log(`lint-changesets: ${changesets.length} changeset(s) follow the project style.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`lint-changesets: ${error.message}`)
    process.exit(1)
  })
}
