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

const linkPlainIssues = (text) => text.replace(/(^|[^[])#(\d+)\b/g, `$1[#$2](${REPO}/issues/$2)`)

/**
 * Where the bracket that closes the one at `start` is, past escapes and
 * nested pairs.
 *
 * @param {string} text - The text to scan.
 * @param {number} start - The index of the opening bracket.
 * @param {string} open - The opening bracket.
 * @param {string} close - The closing bracket.
 * @returns {number} The index of the closing bracket, or -1.
 */
const closing = (text, start, open, close) => {
  let depth = 0
  for (let i = start; i < text.length; i++) {
    if (text[i] === '\\') i++
    else if (text[i] === open) depth++
    else if (text[i] === close && --depth === 0) return i
  }
  return -1
}

/**
 * Where the literal text that starts at `i` ends: an escape, a code span, an
 * autolink, or a link with its label and its destination or reference.
 *
 * @param {string} text - The text to scan.
 * @param {number} i - The index to look at.
 * @returns {number} The index after the literal, or `i` when none starts there.
 */
const literalEnd = (text, i) => {
  if (text[i] === '\\') return Math.min(i + 2, text.length)
  if (text[i] === '`') {
    // A code span closes on a run of exactly as many backticks.
    const run = (j) => {
      let end = j
      while (text[end] === '`') end++
      return end
    }
    const open = run(i)
    for (let j = open; j < text.length; ) {
      if (text[j] !== '`') {
        j++
        continue
      }
      const end = run(j)
      if (end - j === open - i) return end
      j = end
    }
    return open
  }
  if (text[i] === '<') {
    const autolink = /^<[^<>\s]+>/.exec(text.slice(i))
    return autolink ? i + autolink[0].length : i
  }
  const start = text[i] === '!' ? i + 1 : i
  if (text[start] !== '[') return i
  const label = closing(text, start, '[', ']')
  if (label < 0) return i
  const next = text[label + 1]
  if (next === '(' || next === '[') {
    const end = closing(text, label + 1, next, next === '(' ? ')' : ']')
    if (end >= 0) return end + 1
  }
  return label + 1
}

// Code spans, links and autolinks keep their text as written, so a `#123`
// in a URL, a link label or code is not turned into an issue link.
const linkIssues = (text) => {
  let out = ''
  let plain = ''
  for (let i = 0; i < text.length; ) {
    const end = literalEnd(text, i)
    if (end > i) {
      out += linkPlainIssues(plain) + text.slice(i, end)
      plain = ''
      i = end
    } else {
      plain += text[i++]
    }
  }
  return out + linkPlainIssues(plain)
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
    // A fence may open a list item, as in `- ~~~`. A backtick fence's info
    // string holds no backticks, so a line such as ```a``` is a code span.
    const open = line.match(/^(?: *(?:[-+*]|\d{1,9}[.)]) +| {0,3})(`{3,}|~{3,})(.*)$/)
    if (open && !(open[1][0] === '`' && open[2].includes('`'))) {
      // It closes at any indent, so a fence in a list item closes too.
      fence = new RegExp(`^\\s*${open[1][0]}{${open[1].length},}\\s*$`)
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
