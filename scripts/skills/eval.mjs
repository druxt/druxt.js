/**
 * Live evals for the contributor skills. Runs each eval prompt through a
 * headless Claude Code session in a throwaway worktree and grades the
 * recorded transcript with deterministic checks: was the skill loaded,
 * did a forbidden tool run before it, did a forbidden command run at all.
 *
 *   node scripts/skills/eval.mjs [skill ...] [--cases] [--triggers]
 *     [--model <id>] [--max-turns <n>] [--dry-run]
 *
 * Needs the `claude` CLI and credentials, so it is not part of the pull
 * request gate: run it locally, or through the "Skills eval" workflow.
 * Sessions run in `dontAsk` mode with a read-only allowlist. A command
 * outside the allowlist is refused, and still recorded for the checks.
 * Transcripts are written to `.artifacts/skills-eval/`.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SKILLS_DIR, CLAUDE_LINK } from './check.mjs'

// What an eval session may do without asking. Everything else is refused.
export const ALLOWED_TOOLS = [
  'Read', 'Grep', 'Glob', 'Skill',
  'Bash(git status:*)', 'Bash(git log:*)', 'Bash(git diff:*)', 'Bash(git branch:*)', 'Bash(ls:*)',
]

const TIMEOUT = 10 * 60 * 1000

/**
 * Parses a stream-json transcript into the tool calls it made, in order.
 *
 * @param {string} text - The JSONL transcript.
 * @returns {object[]} One `{ name, input }` entry per tool call.
 */
export function toolCalls(text) {
  const calls = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    let event
    try {
      event = JSON.parse(line)
    } catch {
      continue
    }
    if (event.type !== 'assistant' || !event.message || !Array.isArray(event.message.content)) continue
    for (const block of event.message.content) {
      if (block.type === 'tool_use') calls.push({ name: block.name, input: block.input || {} })
    }
  }
  return calls
}

/**
 * Whether a tool call loaded the named skill, through Claude Code's Skill
 * tool or by reading the SKILL.md, the way tools without one load it.
 *
 * @param {object} call - A `{ name, input }` tool call.
 * @param {string} skill - The skill name.
 * @returns {boolean} True when the call loaded the skill.
 */
export function loadsSkill(call, skill) {
  if (call.name === 'Skill') {
    const value = String(call.input.skill || call.input.command || '').replace(/^\//, '')
    return value === skill || value.endsWith(`:${skill}`)
  }
  if (call.name === 'Read') {
    const file = String(call.input.file_path || call.input.path || '')
    return file.endsWith(`/skills/${skill}/SKILL.md`)
  }
  return false
}

/**
 * Removes heredoc bodies from a shell command, so text a command writes to a
 * file (an eval that lists `git push` as forbidden, say) is not read as a
 * command it ran.
 *
 * @param {string} command - The shell command.
 * @returns {string} The command with each heredoc body removed.
 */
export function stripHeredocs(command) {
  return command.replace(/(<<-?\s*(['"]?)(\w+)\2[^\n]*)\n[\s\S]*?\n\s*\3(?=\n|$)/g, '$1')
}

/**
 * Grades a transcript against an eval case's checks.
 *
 * @param {object[]} calls - The tool calls, from `toolCalls`.
 * @param {string} skill - The skill under test.
 * @param {object} [checks] - The case's checks. `skill_called` defaults to true.
 * @returns {string[]} One message per failed check. Empty when the case passes.
 */
export function grade(calls, skill, checks = {}) {
  const failures = []
  const expectSkill = checks.skill_called !== false
  const first = calls.findIndex((call) => loadsSkill(call, skill))

  if (expectSkill && first === -1) failures.push(`the ${skill} skill was not loaded`)
  if (!expectSkill && first !== -1) failures.push(`the ${skill} skill was loaded, but this prompt should not load it`)

  const before = first === -1 ? calls : calls.slice(0, first)
  for (const tool of checks.tools_forbidden_before_skill || []) {
    if (before.some((call) => call.name === tool)) failures.push(`${tool} ran before the skill was loaded`)
  }

  const commands = calls.filter((call) => call.name === 'Bash').map((call) => stripHeredocs(String(call.input.command || '')))
  for (const pattern of checks.commands_forbidden || []) {
    const hit = commands.find((command) => new RegExp(pattern).test(command))
    if (hit) failures.push(`ran a forbidden command: ${hit}`)
  }
  for (const pattern of checks.commands_required || []) {
    if (!commands.some((command) => new RegExp(pattern).test(command))) failures.push(`never ran a command matching /${pattern}/`)
  }
  return failures
}

/**
 * Builds the claude CLI arguments for one eval prompt.
 *
 * @param {object} options - The run options.
 * @param {string} options.prompt - The user message.
 * @param {number} options.maxTurns - The turn limit.
 * @param {string} [options.model] - The model id, or the CLI default when omitted.
 * @returns {string[]} The argument list.
 */
export function claudeArgs({ prompt, maxTurns, model }) {
  const args = [
    '-p', prompt,
    '--output-format', 'stream-json', '--verbose',
    '--max-turns', String(maxTurns),
    '--permission-mode', 'dontAsk',
    '--allowedTools', ALLOWED_TOOLS.join(','),
    '--setting-sources', 'project',
    '--no-session-persistence',
  ]
  if (model) args.push('--model', model)
  return args
}

/**
 * Lists the runs for the selected skills.
 *
 * @param {string} root - The repository root.
 * @param {object} options - The selection.
 * @param {string[]} options.skills - Skill names, or every skill when empty.
 * @param {boolean} options.cases - Whether to include the behaviour cases.
 * @param {boolean} options.triggers - Whether to include the trigger queries.
 * @returns {object[]} One `{ skill, id, prompt, checks }` entry per run.
 */
export function planRuns(root, { skills, cases, triggers }) {
  const base = path.join(root, SKILLS_DIR)
  const names = skills.length ? skills : fs.readdirSync(base).filter((name) => fs.existsSync(path.join(base, name, 'SKILL.md')))
  const runs = []
  for (const skill of names) {
    const dir = path.join(base, skill, 'evals')
    if (!fs.existsSync(dir)) throw new Error(`No evals for "${skill}" in ${SKILLS_DIR}.`)
    if (cases) {
      const { evals } = JSON.parse(fs.readFileSync(path.join(dir, 'evals.json'), 'utf8'))
      for (const item of evals) runs.push({ skill, id: `case-${item.id}`, prompt: item.prompt, checks: item.checks || {} })
    }
    if (triggers) {
      const queries = JSON.parse(fs.readFileSync(path.join(dir, 'triggers.json'), 'utf8'))
      queries.forEach((item, index) => runs.push({
        skill, id: `trigger-${index + 1}`, prompt: item.query, checks: { skill_called: item.should_trigger },
      }))
    }
  }
  return runs
}

// A detached worktree of HEAD with the working tree's skills copied in, so
// uncommitted skill edits are what gets tested.
function makeWorktree(root) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'druxt-skills-eval-'))
  const result = spawnSync('git', ['worktree', 'add', '--detach', dir, 'HEAD'], { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git worktree add failed: ${result.stderr}`)
  resetWorktree(root, dir)
  return dir
}

// Discards whatever the last session changed, then copies the skills in again.
function resetWorktree(root, dir) {
  spawnSync('git', ['checkout', '--', '.'], { cwd: dir })
  spawnSync('git', ['clean', '-fdq'], { cwd: dir })
  fs.rmSync(path.join(dir, SKILLS_DIR), { recursive: true, force: true })
  fs.cpSync(path.join(root, SKILLS_DIR), path.join(dir, SKILLS_DIR), { recursive: true })
  const link = path.join(dir, CLAUDE_LINK)
  fs.rmSync(link, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(link), { recursive: true })
  fs.symlinkSync(path.relative(path.dirname(link), path.join(dir, SKILLS_DIR)), link)
}

function removeWorktree(root, dir) {
  spawnSync('git', ['worktree', 'remove', '--force', dir], { cwd: root })
}

function parseArgs(argv) {
  const options = { skills: [], cases: false, triggers: false, model: undefined, maxTurns: 6, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--cases') options.cases = true
    else if (arg === '--triggers') options.triggers = true
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--model') options.model = argv[++i]
    else if (arg === '--max-turns') options.maxTurns = Number(argv[++i])
    else if (arg.startsWith('--')) throw new Error(`Unknown option ${arg}`)
    else options.skills.push(arg)
  }
  if (!options.cases && !options.triggers) options.cases = options.triggers = true
  return options
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
  const options = parseArgs(process.argv.slice(2))
  const runs = planRuns(root, options)

  if (options.dryRun) {
    for (const run of runs) console.log(`${run.skill}/${run.id}: ${run.prompt}`)
    console.log(`\n${runs.length} run(s) planned.`)
    process.exit(0)
  }

  const out = path.join(root, '.artifacts/skills-eval')
  const worktree = makeWorktree(root)
  let failed = 0
  try {
    for (const run of runs) {
      const result = spawnSync('claude', claudeArgs({ prompt: run.prompt, maxTurns: options.maxTurns, model: options.model }), {
        cwd: worktree, encoding: 'utf8', timeout: TIMEOUT, maxBuffer: 64 * 1024 * 1024,
      })
      if (result.error) throw result.error
      fs.mkdirSync(path.join(out, run.skill), { recursive: true })
      fs.writeFileSync(path.join(out, run.skill, `${run.id}.jsonl`), result.stdout)
      resetWorktree(root, worktree)

      const failures = grade(toolCalls(result.stdout), run.skill, run.checks)
      if (failures.length) {
        failed++
        console.log(`✖ ${run.skill}/${run.id}`)
        for (const failure of failures) console.log(`    ${failure}`)
      } else {
        console.log(`✔ ${run.skill}/${run.id}`)
      }
    }
  } finally {
    removeWorktree(root, worktree)
  }
  console.log(`\n${runs.length - failed}/${runs.length} passed. Transcripts: ${path.relative(root, out)}/`)
  process.exit(failed ? 1 : 0)
}
