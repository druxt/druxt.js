import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkCommits, checkIdentity, checkMessage, pushRanges } from '../check.mjs'

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../check.mjs')

const ZERO = '0'.repeat(40)

test('a person\'s identity passes', () => {
  assert.deepEqual(checkIdentity('Stuart Clark <stu@rtclark.net> 1790939360 +0000', 'author'), [])
  assert.deepEqual(checkIdentity('renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>', 'author'), [])
  assert.deepEqual(checkIdentity('GitHub <noreply@github.com>', 'committer'), [])
})

test('an AI agent\'s identity is refused', () => {
  for (const ident of [
    'Claude <noreply@anthropic.com>',
    'Claude Code <claude-code@anthropic.com>',
    'claude <someone@example.com>',
    'Cursor Agent <cursoragent@cursor.com>',
    'Copilot <198982749+Copilot@users.noreply.github.com>',
    'Codex <codex@openai.com>',
  ]) {
    const problems = checkIdentity(`${ident} 1790939360 +0000`, 'author')
    assert.equal(problems.length, 1, ident)
    assert.match(problems[0], /^the author is .+>, the identity of /)
    assert.doesNotMatch(problems[0], /1790939360/)
  }
})

test('a name that only contains an agent\'s name passes', () => {
  assert.deepEqual(checkIdentity('Claudette Smith <claudette@example.com>', 'author'), [])
})

test('a message with no attribution passes, human co-authors included', () => {
  const message = 'fix(menu): render nothing for an empty menu\n\nCo-authored-by: Jane Doe <jane@example.com>\n'
  assert.deepEqual(checkMessage(message), [])
})

test('AI attribution lines are refused', () => {
  for (const line of [
    'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>',
    'Co-authored-by: Claude Code <claude-code@anthropic.com>',
    'Co-authored-by: Copilot <198982749+Copilot@users.noreply.github.com>',
    'Co-authored-by: Cursor Agent <cursoragent@cursor.com>',
    'Claude-Session: https://claude.ai/code/session_01Eg2KYMHzegnxLEcM41AELb',
    'https://claude.ai/code/session_01Eg2KYMHzegnxLEcM41AELb',
    '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  ]) {
    const problems = checkMessage(`feat: add a thing\n\nBody.\n\n${line}\n`)
    assert.ok(problems.length >= 1, line)
    assert.match(problems[0], /credits an AI tool/)
  }
})

test('the whole offending line is quoted', () => {
  const [problem] = checkMessage('feat: a thing\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n')
  assert.equal(problem, 'the message credits an AI tool ("Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"). Remove the line.')
})

test('comment lines git strips from the message are ignored', () => {
  assert.deepEqual(checkMessage('feat: add a thing\n# Co-Authored-By: Claude <noreply@anthropic.com>\n'), [])
})

test('pre-push input becomes one range per pushed ref, new branches against every remote', () => {
  const input = [
    `refs/heads/feature/a aaaa refs/heads/feature/a bbbb`,
    `refs/heads/feature/new cccc refs/heads/feature/new ${ZERO}`,
    `(delete) ${ZERO} refs/heads/gone dddd`,
    '',
  ].join('\n')
  assert.deepEqual(pushRanges(input), [['bbbb..aaaa'], ['cccc', '--not', '--remotes']])
})

test('problems are reported per commit', () => {
  const commits = [
    { sha: 'a'.repeat(40), author: 'Stuart Clark <stu@rtclark.net>', committer: 'Stuart Clark <stu@rtclark.net>', message: 'feat: one\n' },
    { sha: 'b'.repeat(40), author: 'Claude <noreply@anthropic.com>', committer: 'Claude <noreply@anthropic.com>', message: 'feat: two\n\nClaude-Session: https://claude.ai/code/session_x\n' },
  ]
  const problems = checkCommits(commits)
  assert.equal(problems.length, 3)
  assert.ok(problems.every((problem) => problem.startsWith('bbbbbbbb: ')))
})

// The CLI against a real repository: what the hooks and CI run.
function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'commits-check-'))
  const run = (args, env = {}) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', env: { ...process.env, ...env } })
  run(['init', '-q'])
  run(['config', 'user.name', 'Real Person'])
  run(['config', 'user.email', 'real@example.com'])
  run(['config', 'core.hooksPath', '/dev/null'])
  return { dir, run }
}

const cli = (dir, args, input) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: 'utf8', input })

test('--range refuses a commit made under an agent\'s identity', () => {
  const { dir, run } = repo()
  run(['commit', '-q', '--allow-empty', '-m', 'feat: base'])
  const base = run(['rev-parse', 'HEAD']).trim()
  run(['commit', '-q', '--allow-empty', '-m', 'feat: mine'])
  assert.equal(cli(dir, ['--range', `${base}..HEAD`]).status, 0)

  run(['commit', '-q', '--allow-empty', '-m', 'feat: theirs', '--author', 'Claude <noreply@anthropic.com>'])
  const result = cli(dir, ['--range', `${base}..HEAD`])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /the author is Claude <noreply@anthropic\.com>/)
})

test('--message-file checks the identity git will record and the message', () => {
  const { dir } = repo()
  const file = path.join(dir, 'MSG')
  fs.writeFileSync(file, 'feat: a thing\n')
  assert.equal(cli(dir, ['--message-file', file]).status, 0)

  fs.writeFileSync(file, 'feat: a thing\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n')
  assert.equal(cli(dir, ['--message-file', file]).status, 1)

  fs.writeFileSync(file, 'feat: a thing\n')
  const env = { ...process.env, GIT_COMMITTER_NAME: 'Claude', GIT_COMMITTER_EMAIL: 'noreply@anthropic.com' }
  const result = spawnSync(process.execPath, [SCRIPT, '--message-file', file], { cwd: dir, encoding: 'utf8', env })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /the committer is Claude/)
})

test('--pre-push checks the commits a push would send', () => {
  const { dir, run } = repo()
  run(['commit', '-q', '--allow-empty', '-m', 'feat: base'])
  const base = run(['rev-parse', 'HEAD']).trim()
  run(['commit', '-q', '--allow-empty', '-m', 'feat: theirs\n\nClaude-Session: https://claude.ai/code/session_x'])
  const head = run(['rev-parse', 'HEAD']).trim()
  const result = cli(dir, ['--pre-push'], `refs/heads/x ${head} refs/heads/x ${base}\n`)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /credits an AI tool/)
})

test('an unknown mode prints the usage', () => {
  const result = cli(os.tmpdir(), ['--nope'])
  assert.equal(result.status, 2)
  assert.match(result.stderr, /Usage/)
})
