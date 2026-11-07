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
const path = require('node:path')

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

// CommonMark, so a summary is read the way it renders.
const md = new MarkdownIt('commonmark')

// Records each `#123` the inline parser reaches as plain text, with its
// offset. It runs after every built-in rule, so autolinks, code spans, HTML,
// entities and escapes consume their own text first, and a ref inside one of
// them never gets here. A ref in the text of a Markdown link or an HTML `<a>`
// is reached, but with `linkLevel` raised, so it is skipped.
md.inline.ruler.push('issue_ref', (state, silent) => {
  const ref = /^#(\d+)\b/.exec(state.src.slice(state.pos, state.posMax))
  if (!ref) return false
  if (!silent && !state.linkLevel) {
    const token = state.push('issue_ref', '', 0)
    token.content = ref[1]
    token.meta = { start: state.pos, end: state.pos + ref[0].length }
  }
  state.pos += ref[0].length
  return true
})

/**
 * Where a URL linkify-it found really ends. linkify-it stops at nested
 * parentheses, as in `https://example.org/a(b(c))#123`, so the URL runs on
 * past them, but never past a space, a `<` or `>`, or a `)` it did not open:
 * the `)` that closes a Markdown link, or the `>` that closes an autolink.
 *
 * @param {string} text - The text the URL was found in.
 * @param {{ index: number, lastIndex: number }} url - linkify-it's match.
 * @returns {number} The index after the URL's last character.
 */
const urlEnd = (text, url) => {
  let depth = 0
  for (const char of text.slice(url.index, url.lastIndex)) {
    if (char === '(') depth++
    else if (char === ')') depth--
  }
  let end = url.lastIndex
  for (; end < text.length && !/[\s<>]/.test(text[end]); end++) {
    if (text[end] === '(') depth++
    else if (text[end] === ')') {
      if (depth <= 0) break
      depth--
    }
  }
  return end
}

const linkIssues = (text, env) => {
  // A bare URL, such as `https://example.org/guide#123`, is text to CommonMark,
  // so its refs are found with linkify-it, which markdown-it bundles.
  const urls = (md.linkify.match(text) || []).map((url) => [url.index, urlEnd(text, url)])
  const inUrl = (start) => urls.some(([from, to]) => from <= start && start < to)
  // `[#123]` reads as a label someone meant to write.
  const refs = md
    .parseInline(text, env)[0]
    .children.filter(
      (token) => token.type === 'issue_ref' && text[token.meta.start - 1] !== '[' && !inUrl(token.meta.start),
    )
  let out = ''
  let last = 0
  for (const ref of refs) {
    out += text.slice(last, ref.meta.start) + `[#${ref.content}](${REPO}/issues/${ref.content})`
    last = ref.meta.end
  }
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

  const verb = text.match(/^([a-z]+)\b/i)
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
