import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ALLOWED_TOOLS, claudeArgs, grade, loadsSkill, planRuns, stripHeredocs, toolCalls } from '../eval.mjs'

// One stream-json event per assistant tool call, the way `claude -p
// --output-format stream-json` records them.
const assistant = (...blocks) => JSON.stringify({ type: 'assistant', message: { content: blocks } })
const use = (name, input) => ({ type: 'tool_use', id: name, name, input })
const transcript = (...lines) => lines.join('\n') + '\n'

test('tool calls are read from assistant events, in order', () => {
  const text = transcript(
    JSON.stringify({ type: 'system', subtype: 'init' }),
    assistant({ type: 'text', text: 'Looking.' }, use('Skill', { skill: 'open-pr' })),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result' }] } }),
    'not json',
    assistant(use('Bash', { command: 'git status' })),
  )
  assert.deepEqual(toolCalls(text), [
    { name: 'Skill', input: { skill: 'open-pr' } },
    { name: 'Bash', input: { command: 'git status' } },
  ])
})

test('a skill loads through the Skill tool, namespaced or not, or by reading its SKILL.md', () => {
  assert.ok(loadsSkill({ name: 'Skill', input: { skill: 'open-pr' } }, 'open-pr'))
  assert.ok(loadsSkill({ name: 'Skill', input: { skill: 'druxt:open-pr' } }, 'open-pr'))
  assert.ok(loadsSkill({ name: 'Read', input: { file_path: '/repo/.agents/skills/open-pr/SKILL.md' } }, 'open-pr'))
  assert.ok(loadsSkill({ name: 'Read', input: { file_path: '/repo/.claude/skills/open-pr/SKILL.md' } }, 'open-pr'))
  assert.ok(!loadsSkill({ name: 'Skill', input: { skill: 'open-prs' } }, 'open-pr'))
  assert.ok(!loadsSkill({ name: 'Read', input: { file_path: '/repo/.agents/skills/open-pr/evals/evals.json' } }, 'open-pr'))
})

test('a case passes when the skill loads and no check fails', () => {
  const calls = [{ name: 'Skill', input: { skill: 'verify-change' } }, { name: 'Bash', input: { command: 'yarn lint' } }]
  assert.deepEqual(grade(calls, 'verify-change', { commands_required: ['^yarn lint'], commands_forbidden: ['git push'] }), [])
})

test('a case fails when the skill never loads', () => {
  assert.deepEqual(grade([{ name: 'Read', input: { file_path: 'README.md' } }], 'open-pr'), ['the open-pr skill was not loaded'])
})

test('a trigger query that should not load the skill fails when it does', () => {
  const calls = [{ name: 'Skill', input: { skill: 'open-pr' } }]
  assert.deepEqual(grade(calls, 'open-pr', { skill_called: false }), ['the open-pr skill was loaded, but this prompt should not load it'])
  assert.deepEqual(grade([], 'open-pr', { skill_called: false }), [])
})

test('an optional skill is graded on behaviour alone', () => {
  const calls = [{ name: 'Bash', input: { command: 'git status' } }]
  assert.deepEqual(grade(calls, 'verify-change', { skill_called: 'optional', commands_forbidden: ['Co-Authored-By'] }), [])
  const bad = [{ name: 'Bash', input: { command: 'git commit -m "x\n\nCo-Authored-By: Claude"' } }]
  assert.equal(grade(bad, 'verify-change', { skill_called: 'optional', commands_forbidden: ['Co-Authored-By'] }).length, 1)
})

test('a tool that runs before the skill loads fails the case', () => {
  const calls = [
    { name: 'Edit', input: { file_path: 'a.js' } },
    { name: 'Skill', input: { skill: 'start-work' } },
    { name: 'Write', input: { file_path: 'b.js' } },
  ]
  assert.deepEqual(grade(calls, 'start-work', { tools_forbidden_before_skill: ['Edit', 'Write'] }), ['Edit ran before the skill was loaded'])
})

test('a forbidden command fails the case, even when the session refused it', () => {
  const calls = [{ name: 'Skill', input: { skill: 'open-pr' } }, { name: 'Bash', input: { command: 'git push -u origin feature/x' } }]
  assert.deepEqual(grade(calls, 'open-pr', { commands_forbidden: ['git push'] }), ['ran a forbidden command: git push -u origin feature/x'])
})

test('text a heredoc writes to a file is not read as a command', () => {
  const command = "mkdir -p evals && cat > evals/evals.json <<'EOF'\n{ \"commands_forbidden\": [\"git push\", \"--no-verify\"] }\nEOF\ngit status"
  assert.equal(stripHeredocs(command), "mkdir -p evals && cat > evals/evals.json <<'EOF'\ngit status")
  const calls = [{ name: 'Skill', input: { skill: 'write-skill' } }, { name: 'Bash', input: { command } }]
  assert.deepEqual(grade(calls, 'write-skill', { commands_forbidden: ['git push', '--no-verify'] }), [])
  assert.deepEqual(grade(calls, 'write-skill', { commands_required: ['git status'] }), [])
})

test('a forbidden command after a heredoc still fails the case', () => {
  const command = 'cat > notes.md <<EOF\nnotes\nEOF\ngit push origin feature/x'
  const calls = [{ name: 'Skill', input: { skill: 'open-pr' } }, { name: 'Bash', input: { command } }]
  assert.deepEqual(grade(calls, 'open-pr', { commands_forbidden: ['git push'] }), [`ran a forbidden command: cat > notes.md <<EOF\ngit push origin feature/x`])
})

test('a required command that never ran fails the case', () => {
  const calls = [{ name: 'Skill', input: { skill: 'verify-change' } }]
  assert.deepEqual(grade(calls, 'verify-change', { commands_required: ['yarn test:unit'] }), ['never ran a command matching /yarn test:unit/'])
})

test('eval sessions run in dontAsk mode with the read-only allowlist and project settings only', () => {
  const args = claudeArgs({ prompt: 'Hi', maxTurns: 4, model: 'sonnet' })
  const value = (flag) => args[args.indexOf(flag) + 1]
  assert.equal(value('-p'), 'Hi')
  assert.equal(value('--permission-mode'), 'dontAsk')
  assert.equal(value('--allowedTools'), ALLOWED_TOOLS.join(','))
  assert.equal(value('--setting-sources'), 'project')
  assert.equal(value('--max-turns'), '4')
  assert.equal(value('--model'), 'sonnet')
  assert.ok(!args.some((arg) => /dangerously|bypassPermissions/.test(arg)))
  assert.ok(!ALLOWED_TOOLS.some((tool) => /^(Edit|Write|Bash)$|Bash\(\*\)|git push/.test(tool)))
  assert.ok(!claudeArgs({ prompt: 'Hi', maxTurns: 1 }).includes('--model'))
})

test('runs are planned from each skill\'s cases and trigger queries', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-eval-'))
  const dir = path.join(root, '.agents/skills/open-pr')
  fs.mkdirSync(path.join(dir, 'evals'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'SKILL.md'), '---\nname: open-pr\n---\n')
  fs.writeFileSync(path.join(dir, 'evals/evals.json'), JSON.stringify({
    skill_name: 'open-pr', evals: [{ id: 3, prompt: 'Open it.', expectations: ['x'], checks: { commands_forbidden: ['gh pr merge'] } }],
  }))
  fs.writeFileSync(path.join(dir, 'evals/triggers.json'), JSON.stringify([
    { query: 'Open a PR.', should_trigger: true },
    { query: 'Run the tests.', should_trigger: false },
  ]))

  assert.deepEqual(planRuns(root, { skills: [], cases: true, triggers: true }), [
    { skill: 'open-pr', id: 'case-3', prompt: 'Open it.', checks: { commands_forbidden: ['gh pr merge'] } },
    { skill: 'open-pr', id: 'trigger-1', prompt: 'Open a PR.', checks: { skill_called: true } },
    { skill: 'open-pr', id: 'trigger-2', prompt: 'Run the tests.', checks: { skill_called: false } },
  ])
  assert.equal(planRuns(root, { skills: ['open-pr'], cases: false, triggers: true }).length, 2)
  assert.throws(() => planRuns(root, { skills: ['missing'], cases: true, triggers: false }), /No evals for "missing"/)
})
