/**
 * Commit gate: every commit is made by the person contributing it. Refuses a
 * commit whose author or committer is an AI coding agent's identity, and a
 * commit message that carries an AI attribution trailer or footer. People
 * may use any tool to write a change; the commit is theirs, under their own
 * name.
 *
 *   node scripts/commits/check.mjs --message-file <file>   # commit-msg hook
 *   node scripts/commits/check.mjs --pre-push              # pre-push hook, refs on stdin
 *   node scripts/commits/check.mjs --range <base>..<head>  # CI, every commit in a pull request
 *
 * Exits 1 and prints one line per problem.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Identities coding agents commit under. Bots that open dependency pull
// requests (renovate, dependabot) are not agents writing code, and pass.
export const AGENT_IDENTITIES = [
  [/<(noreply|claude-code)@anthropic\.com>/i, 'Claude'],
  [/^claude( code)?\s*</i, 'Claude'],
  [/<cursoragent@cursor\.com>/i, 'Cursor'],
  [/\+copilot@users\.noreply\.github\.com>/i, 'GitHub Copilot'],
  [/<[^>]*codex[^>]*@openai\.com>/i, 'Codex'],
]

// Lines agents add to commit messages to credit themselves.
export const ATTRIBUTION = [
  /^co-authored-by:.*\b(claude|anthropic|copilot|cursor ?agent|codex|openai|gemini|aider)\b/im,
  /^claude-session:/im,
  /^https:\/\/claude\.ai\/code\/session_/im,
  /generated (with|by) \[?(claude|copilot|cursor|codex|gemini|aider)/im,
]

const ZERO = /^0+$/

/**
 * Checks an identity line ("Name <email>").
 *
 * @param {string} ident - The identity, as `git var` or `git log` prints it.
 * @param {string} role - Which identity it is, for the message (`author` or `committer`).
 * @returns {string[]} One message per problem.
 */
export function checkIdentity(ident, role) {
  const hit = AGENT_IDENTITIES.find(([pattern]) => pattern.test(ident))
  if (!hit) return []
  const who = ident.replace(/>.*$/, '>')
  return [`the ${role} is ${who}, the identity of ${hit[1]}. Commit under your own name: git config user.name and user.email.`]
}

/**
 * Checks a commit message for AI attribution lines.
 *
 * @param {string} message - The full commit message.
 * @returns {string[]} One message per problem.
 */
export function checkMessage(message) {
  // Git strips comment lines from the message it records, so ignore them here.
  const text = message.split('\n').filter((line) => !line.startsWith('#')).join('\n')
  const problems = []
  for (const pattern of ATTRIBUTION) {
    const hit = text.match(pattern)
    if (!hit) continue
    const line = text.slice(text.lastIndexOf('\n', hit.index) + 1).split('\n')[0].trim()
    problems.push(`the message credits an AI tool ("${line}"). Remove the line.`)
  }
  return problems
}

/**
 * Parses pre-push hook input into the commit ranges being pushed.
 *
 * @param {string} input - The hook's stdin: `<local ref> <local sha> <remote ref> <remote sha>` per line.
 * @returns {string[][]} One `git rev-list` argument list per pushed ref. Deletions are skipped.
 */
export function pushRanges(input) {
  const ranges = []
  for (const line of input.split('\n')) {
    const [, local, , remote] = line.trim().split(/\s+/)
    if (!local || ZERO.test(local)) continue
    // A new branch: every commit not already on a remote.
    ranges.push(ZERO.test(remote) ? [local, '--not', '--remotes'] : [`${remote}..${local}`])
  }
  return ranges
}

/**
 * Checks commits given in `git log` format.
 *
 * @param {object[]} commits - `{ sha, author, committer, message }` entries.
 * @returns {string[]} One `<sha>: <problem>` message per problem.
 */
export function checkCommits(commits) {
  const problems = []
  for (const { sha, author, committer, message } of commits) {
    const found = [
      ...checkIdentity(author, 'author'),
      ...checkIdentity(committer, 'committer'),
      ...checkMessage(message),
    ]
    problems.push(...found.map((problem) => `${sha.slice(0, 8)}: ${problem}`))
  }
  return problems
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8' })

function readCommits(revListArgs) {
  const shas = git(['rev-list', ...revListArgs]).split('\n').filter(Boolean)
  return shas.map((sha) => {
    const [author, committer, ...message] = git(['show', '-s', '--format=%an <%ae>%n%cn <%ce>%n%B', sha]).split('\n')
    return { sha, author, committer, message: message.join('\n') }
  })
}

function report(problems, where) {
  if (!problems.length) return
  for (const problem of problems) console.error(`✖ ${where}${problem}`)
  console.error('\nCommits are made by the person contributing them, with no AI attribution. See AGENTS.md.')
  process.exit(1)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const [mode, value] = process.argv.slice(2)
  if (mode === '--message-file') {
    report([
      ...checkIdentity(git(['var', 'GIT_AUTHOR_IDENT']).trim(), 'author'),
      ...checkIdentity(git(['var', 'GIT_COMMITTER_IDENT']).trim(), 'committer'),
      ...checkMessage(fs.readFileSync(value, 'utf8')),
    ], 'commit: ')
  } else if (mode === '--pre-push') {
    const commits = pushRanges(fs.readFileSync(0, 'utf8')).flatMap(readCommits)
    report(checkCommits(commits), '')
  } else if (mode === '--range' && value) {
    report(checkCommits(readCommits([value])), '')
  } else {
    console.error('Usage: check.mjs --message-file <file> | --pre-push | --range <base>..<head>')
    process.exit(2)
  }
}
