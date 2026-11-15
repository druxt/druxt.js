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

const MarkdownIt = require('markdown-it')

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

// CommonMark, so a summary is read the way it renders. An escape stays a
// token of its own, so an escaped `\#123` never reads as plain text.
const md = new MarkdownIt('commonmark').disable('text_join')

// Each `#123` is tagged with a character from the private use area before
// parsing, so the tokens show which refs are plain text and which sit in a
// link, an autolink, code or HTML.
const MARK = 0xe000

const linkIssues = (text, env) => {
  const refs = [...text.matchAll(/#(\d+)\b/g)]
  if (!refs.length) return text
  let tagged = ''
  let last = 0
  refs.forEach((ref, i) => {
    tagged += text.slice(last, ref.index + 1) + String.fromCharCode(MARK + i)
    last = ref.index + 1
  })
  tagged += text.slice(last)

  const plain = new Set()
  let depth = 0
  for (const token of md.parseInline(tagged, env)[0].children) {
    if (token.type === 'link_open') depth++
    else if (token.type === 'link_close') depth--
    else if (token.type === 'text' && !depth) {
      for (const tag of token.content.matchAll(/#([-])/g)) plain.add(tag[1].charCodeAt(0) - MARK)
    }
  }

  let out = ''
  last = 0
  refs.forEach((ref, i) => {
    // `[#123]` reads as a label someone meant to write.
    if (!plain.has(i) || text[ref.index - 1] === '[') return
    out += text.slice(last, ref.index) + `[#${ref[1]}](${REPO}/issues/${ref[1]})`
    last = ref.index + ref[0].length
  })
  return out + text.slice(last)
}

// The Conventional Commits types. Any other word before a colon, such as
// "Windows: ", is part of the sentence.
const TYPES = 'build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test'
const PREFIX = new RegExp(`^(${TYPES})(?:\\(([^)]*)\\))?(!)?:\\s*`)

/**
 * One changeset summary line to one changelog sentence.
 *
 * @param {string} summary - The changeset's first line.
 * @param {object} [env] - The markdown-it environment the rest of the summary
 *   was parsed in, so a reference link defined there resolves.
 * @returns {{ text: string, issues: string[], breaking: boolean }} The
 *   rewritten sentence plus any issue refs found in the prefix.
 */
const rewrite = (summary, env = {}) => {
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

  text = linkIssues(text, env).replace(/\.+$/, '') + '.'
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
 * @param {object} env - Collects the link reference definitions found.
 * @returns {boolean[]} True for each line outside a fenced or indented code
 *   block or an HTML block.
 */
const proseLines = (lines, env) => {
  const prose = lines.map(() => true)
  for (const token of md.parse(lines.join('\n'), env)) {
    if (['fence', 'code_block', 'html_block'].includes(token.type) && token.map) {
      for (let i = token.map[0]; i < token.map[1]; i++) prose[i] = false
    }
  }
  return prose
}

const getReleaseLine = async (changeset) => {
  const [first, ...lines] = changeset.summary.split('\n')
  const env = {}
  const prose = proseLines(lines, env)
  const override = lines.map((line, i) => prose[i] && COMMIT.exec(line)).find(Boolean)
  const rest = lines.filter((line, i) => !(prose[i] && COMMIT.test(line)))
  const commit = override ? override[1] : changeset.commit
  const result = rewrite(first, env)
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
