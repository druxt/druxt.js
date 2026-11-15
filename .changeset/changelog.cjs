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
      // npm's bare shorthand ("owner/repo") also means GitHub.
      || url.match(/^([\w.-]+\/[\w.-]+)$/)
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

// Code spans, links and autolinks keep their text as written, so a `#123`
// in a URL or in code is not turned into an issue link. A link's destination
// may hold balanced parentheses, as in `[guide](guide(v2)#123)`.
const LITERAL = /(`+)[\s\S]*?\1|!?\[[^\]]*\]\((?:[^()]|\([^()]*\))*\)|<[^>\s]+>/g

const linkPlainIssues = (text) => text.replace(/(^|[^[])#(\d+)\b/g, `$1[#$2](${REPO}/issues/$2)`)

const linkIssues = (text) => {
  let out = ''
  let last = 0
  for (const match of text.matchAll(LITERAL)) {
    out += linkPlainIssues(text.slice(last, match.index)) + match[0]
    last = match.index + match[0].length
  }
  return out + linkPlainIssues(text.slice(last))
}

// The Conventional Commits types. Any other word before a colon, such as
// "Windows: ", is part of the sentence.
const TYPES = 'build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test'
const PREFIX = new RegExp(`^(${TYPES})(?:\\(([^)]*)\\))?(!)?:\\s*`)

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

  const prefix = text.match(PREFIX)
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

// A `Commit: <sha>` line names the change when the changeset file was added later.
const COMMIT = /^ {0,3}Commit:\s*([0-9a-f]{7,40})\s*$/i
// Conventional commits also declare breakage in a footer.
const BREAKING = /^ {0,3}BREAKING[ -]CHANGE:/

/**
 * Which lines are prose rather than code, so an example of a `Commit:` line
 * or a breaking-change footer stays an example.
 *
 * @param {string[]} lines - The summary's lines after the first.
 * @returns {boolean[]} True for each line outside a fenced or indented code
 *   block.
 */
const proseLines = (lines) => {
  let fence = null
  return lines.map((line) => {
    if (fence) {
      if (fence.test(line)) fence = null
      return false
    }
    const open = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (open) {
      fence = new RegExp(`^ {0,3}${open[1][0]}{${open[1].length},}\\s*$`)
      return false
    }
    return !/^(?: {4}|\t)/.test(line)
  })
}

const getReleaseLine = async (changeset) => {
  const [first, ...lines] = changeset.summary.split('\n')
  const prose = proseLines(lines)
  const override = lines.map((line, i) => prose[i] && COMMIT.exec(line)).find(Boolean)
  const rest = lines.filter((line, i) => !(prose[i] && COMMIT.test(line)))
  const commit = override ? override[1] : changeset.commit
  const result = rewrite(first)
  const { text, issues } = result
  const breaking = result.breaking || lines.some((line, i) => prose[i] && BREAKING.test(line))

  const refs = issues.map((n) => `[#${n}](${REPO}/issues/${n})`)
  if (commit) {
    refs.push(`[\`${commit.slice(0, 7)}\`](${REPO}/commit/${commit})`)
  }

  let line = `- ${breaking ? '**Breaking:** ' : ''}${text}${refs.length ? ` (${refs.join(', ')})` : ''}`
  // A paragraph of its own under the bullet. Joined straight beneath it, the
  // body ran into the first paragraph and left the links in its middle.
  // Only the blank lines before the body go, so an indented code block that
  // opens it keeps its indent.
  const body = rest.join('\n').replace(/^(?:[ \t]*\n)+/, '').trimEnd()
  if (body) line += '\n\n' + body.replace(/^(?=.)/gm, '  ')
  return line
}

const getDependencyReleaseLine = async (changesets, dependenciesUpdated) => {
  if (!dependenciesUpdated.length) return ''
  const list = dependenciesUpdated.map((dep) => `${dep.name}@${dep.newVersion}`).join(', ')
  return `- Updated dependencies: ${list}.`
}

module.exports = { getReleaseLine, getDependencyReleaseLine, rewrite }
