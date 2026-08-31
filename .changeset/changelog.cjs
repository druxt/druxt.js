/**
 * Changelog generator for @changesets/cli.
 *
 * Turns changeset summaries written as conventional commit subjects
 * ("feat(#87): add attrs passthrough") into changelog sentences with the
 * issue and commit linked ("Added attrs passthrough ([#87](…), [abc1234](…))").
 * Pure string transforms: no network, no GitHub API, works offline.
 *
 * Repo-agnostic: the link base comes from the root package.json repository
 * field, so the same file serves every Druxt repository.
 */
const path = require('path')

const REPO = (() => {
  try {
    // Changesets runs from the repository root.
    const pkg = require(path.join(process.cwd(), 'package.json'))
    const url = typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository || {}).url || ''
    const match = url.match(/github\.com[/:]([\w.-]+\/[\w.-]+?)(?:\.git)?$/)
      || url.match(/^github:([\w.-]+\/[\w.-]+)$/)
    if (match) return `https://github.com/${match[1]}`
  } catch {
    // Fall through to the default.
  }
  return 'https://github.com/druxt/druxt.js'
})()

// Leading verbs normalized to Keep a Changelog past tense.
const VERBS = {
  add: 'Added',
  added: 'Added',
  adds: 'Added',
  create: 'Added',
  created: 'Added',
  fix: 'Fixed',
  fixed: 'Fixed',
  fixes: 'Fixed',
  remove: 'Removed',
  removed: 'Removed',
  deprecate: 'Deprecated',
  deprecated: 'Deprecated',
  update: 'Updated',
  updated: 'Updated',
  change: 'Changed',
  changed: 'Changed',
  refactor: 'Refactored',
  refactored: 'Refactored',
  improve: 'Improved',
  improved: 'Improved',
  simplify: 'Simplified',
  simplified: 'Simplified',
  prevent: 'Prevented',
  prevented: 'Prevented',
  allow: 'Allowed',
  allowed: 'Allowed',
  ensure: 'Ensured',
  ensured: 'Ensured',
  normalize: 'Normalized',
  normalized: 'Normalized',
  rename: 'Renamed',
  renamed: 'Renamed',
  move: 'Moved',
  moved: 'Moved',
  replace: 'Replaced',
  replaced: 'Replaced',
  disable: 'Disabled',
  disabled: 'Disabled',
  enable: 'Enabled',
  enabled: 'Enabled',
  restore: 'Restored',
  restored: 'Restored',
}

const linkIssues = (text) => text.replace(/(^|[^[])#(\d+)\b/g, `$1[#$2](${REPO}/issues/$2)`)

/**
 * One changeset summary line to one changelog sentence.
 *
 * @param {string} summary - The changeset's first line.
 * @returns {{ text: string, issues: string[], breaking: boolean }} The
 *   rewritten sentence plus any issue refs found in the prefix.
 */
const rewrite = (summary) => {
  let text = summary.trim()
  const issues = []
  let breaking = false

  const prefix = text.match(/^(\w+)(?:\(([^)]*)\))?(!)?:\s*/)
  if (prefix) {
    breaking = Boolean(prefix[3])
    for (const ref of (prefix[2] || '').match(/#\d+/g) || []) issues.push(ref.slice(1))
    text = text.slice(prefix[0].length).trim()
  }

  const verb = text.match(/^([A-Za-z]+)\b/)
  if (verb && VERBS[verb[1].toLowerCase()]) {
    text = VERBS[verb[1].toLowerCase()] + text.slice(verb[1].length)
  } else {
    text = text.charAt(0).toUpperCase() + text.slice(1)
  }

  text = linkIssues(text).replace(/\.+$/, '') + '.'
  return { text, issues, breaking }
}

const getReleaseLine = async (changeset) => {
  const [first, ...rest] = changeset.summary.split('\n')
  const { text, issues, breaking } = rewrite(first)

  const refs = issues.map((n) => `[#${n}](${REPO}/issues/${n})`)
  if (changeset.commit) {
    refs.push(`[\`${changeset.commit.slice(0, 7)}\`](${REPO}/commit/${changeset.commit})`)
  }

  let line = `- ${breaking ? '**Breaking:** ' : ''}${text}${refs.length ? ` (${refs.join(', ')})` : ''}`
  const body = rest.join('\n').trim()
  if (body) line += '\n' + body.replace(/^/gm, '  ')
  return line
}

const getDependencyReleaseLine = async (changesets, dependenciesUpdated) => {
  if (!dependenciesUpdated.length) return ''
  const list = dependenciesUpdated.map((dep) => `${dep.name}@${dep.newVersion}`).join(', ')
  return `- Updated dependencies: ${list}.`
}

module.exports = { getReleaseLine, getDependencyReleaseLine, rewrite }
