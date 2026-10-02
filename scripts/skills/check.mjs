/**
 * Static gate for the contributor skills in `.agents/skills/`. Deterministic,
 * offline and fast, so it runs on every pull request. Live behaviour is
 * tested separately by `scripts/skills/eval.mjs`.
 *
 *   node scripts/skills/check.mjs
 *
 * Exits 1 and prints one line per problem when a skill fails a rule.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

export const SKILLS_DIR = '.agents/skills'
export const CLAUDE_LINK = '.claude/skills'

// The fields the Agent Skills specification (agentskills.io) defines. Tools
// other than Claude Code refuse a skill with any other field.
const FIELDS = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/

const MAX_LINES = 500

// Yarn's own commands, which are not package.json scripts.
const YARN_BUILTINS = new Set([
  'add', 'bin', 'cache', 'config', 'constraints', 'dedupe', 'dlx', 'exec', 'explain',
  'info', 'init', 'install', 'link', 'node', 'npm', 'pack', 'patch', 'rebuild', 'remove',
  'run', 'set', 'unlink', 'up', 'why', 'workspace', 'workspaces',
])

// Commands a skill must never tell an agent to run. Checked in fenced code
// blocks only, so prose can still name a command to forbid it.
const FORBIDDEN_COMMANDS = [
  [/\b(curl|wget)\b[^\n|]*\|\s*(ba|z)?sh\b/, 'pipes a download into a shell'],
  [/--dangerously-skip-permissions/, 'skips the permission checks'],
  [/--no-verify\b/, 'skips the git hooks'],
  [/\bgit\s+push\b[^\n]*(--force\b|\s-f\b)/, 'force pushes'],
  [/\b(cat|less|head|tail)\s+[^\n]*(\.npmrc|\.ssh\/|\.env\b)/, 'reads credentials'],
]

// Anywhere in the file: tool grants and Claude Code's `!` command
// injection, which runs a shell command when the skill loads.
const FORBIDDEN_ANYWHERE = [
  [/Bash\(\*\)/, 'grants every shell command'],
  [/!`[^`]+`/, 'runs a shell command when the skill loads'],
]

/**
 * Splits a SKILL.md into its frontmatter and body.
 *
 * @param {string} text - The file contents.
 * @returns {{ data: object|null, body: string, error: string|null }} The parsed frontmatter, the body, and a parse error when there is one.
 */
export function parseSkill(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: null, body: text, error: 'has no frontmatter block' }
  try {
    const data = yaml.safeLoad(match[1], { schema: yaml.JSON_SCHEMA })
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { data: null, body: match[2], error: 'frontmatter is not a mapping' }
    }
    return { data, body: match[2], error: null }
  } catch (error) {
    return { data: null, body: match[2], error: `frontmatter does not parse: ${error.reason || error.message}` }
  }
}

/**
 * Checks frontmatter against the Agent Skills specification.
 *
 * @param {object} data - The parsed frontmatter.
 * @param {string} dir - The skill's directory name.
 * @returns {string[]} One message per problem.
 */
export function checkFrontmatter(data, dir) {
  const problems = []
  for (const key of Object.keys(data)) {
    if (!FIELDS.includes(key)) problems.push(`frontmatter field "${key}" is not in the Agent Skills specification`)
  }

  const { name, description, compatibility, metadata } = data
  if (typeof name !== 'string' || !name) {
    problems.push('frontmatter has no name')
  } else {
    if (name.length > 64 || !NAME.test(name)) problems.push(`name "${name}" must be 1-64 lowercase letters, digits and single hyphens`)
    if (name !== dir) problems.push(`name "${name}" does not match its directory "${dir}"`)
  }

  if (typeof description !== 'string' || !description.trim()) {
    problems.push('frontmatter has no description')
  } else {
    if (description.length > 1024) problems.push(`description is ${description.length} characters, over the 1024 limit`)
    if (!/\bUse when\b/.test(description)) problems.push('description does not say when to use the skill ("Use when ...")')
  }

  if (compatibility !== undefined && (typeof compatibility !== 'string' || compatibility.length > 500)) {
    problems.push('compatibility must be a string of at most 500 characters')
  }
  if (metadata !== undefined) {
    const valid = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      && Object.values(metadata).every((value) => typeof value === 'string')
    if (!valid) problems.push('metadata must map strings to strings')
  }
  if (data['allowed-tools'] !== undefined && typeof data['allowed-tools'] !== 'string') {
    problems.push('allowed-tools must be a space-separated string')
  }
  return problems
}

/**
 * Collects the code a skill shows: fenced blocks and inline code spans.
 *
 * @param {string} body - The SKILL.md body.
 * @returns {{ blocks: string[], spans: string[] }} The fenced block contents and the inline spans outside them.
 */
export function extractCode(body) {
  const blocks = []
  const prose = body.replace(/^```[^\n]*\n([\s\S]*?)^```/gm, (_, code) => {
    blocks.push(code)
    return ''
  })
  const spans = [...prose.matchAll(/`([^`\n]+)`/g)].map((match) => match[1])
  return { blocks, spans }
}

/**
 * Checks that what a skill tells an agent to run or open exists.
 *
 * @param {object} options - The check input.
 * @param {string} options.body - The SKILL.md body.
 * @param {string} options.root - The repository root.
 * @param {string} options.skillDir - The skill's directory, absolute.
 * @param {Set<string>} options.scripts - The root package.json script names.
 * @param {Set<string>} options.skills - Every skill name in the repository.
 * @returns {string[]} One message per problem.
 */
export function checkReferences({ body, root, skillDir, scripts, skills }) {
  const problems = []
  const { blocks, spans } = extractCode(body)

  // Each block and span on its own, so two adjacent spans never read as one command.
  for (const code of [...blocks, ...spans]) {
    for (const [, script] of code.matchAll(/(?:^|[\s;&|(])yarn[ \t]+([a-z][\w:-]*)/gm)) {
      if (!YARN_BUILTINS.has(script) && !scripts.has(script)) problems.push(`runs "yarn ${script}", which is not a package.json script`)
    }
  }

  const makefile = path.join(root, 'Makefile')
  const targets = fs.existsSync(makefile)
    ? new Set([...fs.readFileSync(makefile, 'utf8').matchAll(/^([\w-]+):/gm)].map((match) => match[1]))
    : new Set()
  for (const block of blocks) {
    for (const [, line] of block.matchAll(/^\s*(?:\$\s*)?make\s+([\w-]+)/gm)) {
      // `cd examples/drupal && make build` runs another directory's Makefile.
      if (!targets.has(line) && !/cd\s+\S+\s*&&\s*make/.test(block)) problems.push(`runs "make ${line}", which is not a Makefile target`)
    }
  }

  // A span is a repository path when its first segment is a top-level entry,
  // so `packages/router/src` is checked and `upstream/develop` is not.
  const topLevel = new Set(fs.readdirSync(root))
  for (const span of spans) {
    if (!/^\.?[\w.-]+\/[\w./-]*$/.test(span) || !topLevel.has(span.split('/')[0])) continue
    if (!fs.existsSync(path.join(root, span))) problems.push(`names "${span}", which does not exist`)
  }

  for (const [, target] of body.matchAll(/\]\(([^)\s#]+)(?:#[^)]*)?\)/g)) {
    if (/^[a-z]+:/i.test(target)) continue
    if (!fs.existsSync(path.resolve(skillDir, target))) problems.push(`links to "${target}", which does not exist`)
  }

  for (const [, other] of body.matchAll(/`([a-z0-9-]+)` skill\b/g)) {
    if (!skills.has(other)) problems.push(`refers to the "${other}" skill, which does not exist`)
  }
  return problems
}

/**
 * Checks for commands and grants a skill must not carry.
 *
 * @param {string} text - The whole SKILL.md.
 * @returns {string[]} One message per problem.
 */
export function checkGuardrails(text) {
  const problems = []
  const { blocks } = extractCode(parseSkill(text).body)
  for (const block of blocks) {
    for (const [pattern, why] of FORBIDDEN_COMMANDS) {
      const hit = block.match(pattern)
      if (hit) problems.push(`shows "${hit[0].trim()}", which ${why}`)
    }
  }
  for (const [pattern, why] of FORBIDDEN_ANYWHERE) {
    const hit = text.match(pattern)
    if (hit) problems.push(`contains "${hit[0]}", which ${why}`)
  }
  return problems
}

/**
 * Checks a skill's evals: behaviour cases and trigger queries.
 *
 * @param {string} skillDir - The skill's directory, absolute.
 * @param {string} name - The skill's name.
 * @returns {string[]} One message per problem.
 */
export function checkEvals(skillDir, name) {
  const problems = []
  const read = (file) => {
    const full = path.join(skillDir, 'evals', file)
    if (!fs.existsSync(full)) {
      problems.push(`has no evals/${file}`)
      return null
    }
    try {
      return JSON.parse(fs.readFileSync(full, 'utf8'))
    } catch (error) {
      problems.push(`evals/${file} is not valid JSON: ${error.message}`)
      return null
    }
  }

  const evals = read('evals.json')
  if (evals) {
    if (evals.skill_name !== name) problems.push(`evals/evals.json skill_name is "${evals.skill_name}", expected "${name}"`)
    const cases = Array.isArray(evals.evals) ? evals.evals : []
    if (cases.length < 2) problems.push('evals/evals.json needs at least 2 cases')
    const ids = new Set()
    for (const item of cases) {
      const label = `evals/evals.json case ${item.id}`
      if (!Number.isInteger(item.id) || ids.has(item.id)) problems.push(`${label} needs a unique integer id`)
      ids.add(item.id)
      if (typeof item.prompt !== 'string' || !item.prompt.trim()) problems.push(`${label} has no prompt`)
      if (!Array.isArray(item.expectations) || !item.expectations.length) problems.push(`${label} has no expectations`)
      problems.push(...checkChecks(item.checks).map((problem) => `${label} ${problem}`))
    }
  }

  const triggers = read('triggers.json')
  if (triggers) {
    const list = Array.isArray(triggers) ? triggers : []
    const valid = list.every((item) => typeof item.query === 'string' && typeof item.should_trigger === 'boolean')
    if (!valid) problems.push('evals/triggers.json entries need a query string and a should_trigger boolean')
    const yes = list.filter((item) => item.should_trigger === true).length
    const no = list.filter((item) => item.should_trigger === false).length
    if (yes < 3 || no < 3) problems.push(`evals/triggers.json needs at least 3 queries each way (has ${yes} that should trigger, ${no} that should not)`)
  }
  return problems
}

/**
 * Checks the deterministic transcript assertions of one eval case.
 *
 * @param {object} [checks] - The case's `checks` object.
 * @returns {string[]} One message per problem.
 */
export function checkChecks(checks) {
  if (checks === undefined) return []
  if (!checks || typeof checks !== 'object' || Array.isArray(checks)) return ['checks must be an object']
  const problems = []
  const known = ['skill_called', 'tools_forbidden_before_skill', 'commands_forbidden', 'commands_required']
  for (const key of Object.keys(checks)) {
    if (!known.includes(key)) problems.push(`checks has an unknown key "${key}"`)
  }
  if (checks.skill_called !== undefined && typeof checks.skill_called !== 'boolean' && checks.skill_called !== 'optional') {
    problems.push('checks.skill_called must be true, false or "optional"')
  }
  for (const key of ['tools_forbidden_before_skill', 'commands_forbidden', 'commands_required']) {
    const value = checks[key]
    if (value === undefined) continue
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
      problems.push(`checks.${key} must be a list of strings`)
      continue
    }
    if (key !== 'tools_forbidden_before_skill') {
      for (const pattern of value) {
        try {
          new RegExp(pattern)
        } catch {
          problems.push(`checks.${key} has an invalid pattern "${pattern}"`)
        }
      }
    }
  }
  return problems
}

/**
 * Checks that `.claude/skills` points at `.agents/skills`, so Claude Code
 * and every tool that reads `.agents/skills` see the same files.
 *
 * @param {string} root - The repository root.
 * @returns {string[]} One message per problem.
 */
export function checkLink(root) {
  const link = path.join(root, CLAUDE_LINK)
  const expected = path.relative(path.dirname(link), path.join(root, SKILLS_DIR))
  let stat
  try {
    stat = fs.lstatSync(link)
  } catch {
    return [`${CLAUDE_LINK} is missing; it must be a symlink to ${expected}`]
  }
  if (!stat.isSymbolicLink()) return [`${CLAUDE_LINK} must be a symlink to ${expected}`]
  const target = path.resolve(path.dirname(link), fs.readlinkSync(link))
  if (target !== path.join(root, SKILLS_DIR)) return [`${CLAUDE_LINK} points at ${path.relative(root, target)}, not ${SKILLS_DIR}`]
  return []
}

/**
 * Checks that the AGENTS.md skills table lists every skill, linked to its
 * SKILL.md, and nothing else.
 *
 * @param {string} root - The repository root.
 * @param {string[]} names - The skill names on disk.
 * @returns {string[]} One message per problem.
 */
export function checkIndex(root, names) {
  const file = path.join(root, 'AGENTS.md')
  if (!fs.existsSync(file)) return ['AGENTS.md is missing']
  const section = fs.readFileSync(file, 'utf8').split(/^## /m).find((part) => part.startsWith('Skills'))
  if (!section) return ['AGENTS.md has no "## Skills" section']
  // Each row links the skill's SKILL.md, which is how agents without skill
  // discovery of their own find it: | [`name`](.agents/skills/name/SKILL.md) |
  const rows = [...section.matchAll(/^\|\s*\[`([a-z0-9-]+)`\]\(([^)]+)\)\s*\|/gm)]
  const listed = new Set(rows.map((match) => match[1]))
  const problems = []
  for (const [, name, target] of rows) {
    const expected = `${SKILLS_DIR}/${name}/SKILL.md`
    if (target !== expected) problems.push(`AGENTS.md links "${name}" to ${target}, expected ${expected}`)
  }
  for (const name of names) if (!listed.has(name)) problems.push(`AGENTS.md does not list the "${name}" skill`)
  for (const name of listed) if (!names.includes(name)) problems.push(`AGENTS.md lists "${name}", which is not a skill`)
  return problems
}

/**
 * Runs every rule over a repository.
 *
 * @param {string} root - The repository root.
 * @returns {string[]} One `<location>: <problem>` message per problem.
 */
export function checkRepository(root) {
  const base = path.join(root, SKILLS_DIR)
  if (!fs.existsSync(base)) return [`${SKILLS_DIR} is missing`]

  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  const scripts = new Set(Object.keys(manifest.scripts || {}))
  const names = fs.readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  const skills = new Set(names)

  const problems = checkLink(root)
  for (const name of names) {
    const skillDir = path.join(base, name)
    const where = `${SKILLS_DIR}/${name}`
    const file = path.join(skillDir, 'SKILL.md')
    if (!fs.existsSync(file)) {
      problems.push(`${where}: has no SKILL.md`)
      continue
    }
    const text = fs.readFileSync(file, 'utf8')
    const { data, body, error } = parseSkill(text)
    const found = []
    if (error) found.push(error)
    else found.push(...checkFrontmatter(data, name))
    const lines = text.split('\n').length
    if (lines > MAX_LINES) found.push(`SKILL.md is ${lines} lines, over ${MAX_LINES}; move detail into references/`)
    found.push(...checkReferences({ body, root, skillDir, scripts, skills }))
    found.push(...checkGuardrails(text))
    found.push(...checkEvals(skillDir, name))
    problems.push(...found.map((problem) => `${where}: ${problem}`))
  }
  problems.push(...checkIndex(root, names))
  return problems
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
  const problems = checkRepository(root)
  if (problems.length) {
    for (const problem of problems) console.error(`✖ ${problem}`)
    console.error(`\n${problems.length} problem(s). See scripts/skills/README.md.`)
    process.exit(1)
  }
  const count = fs.readdirSync(path.join(root, SKILLS_DIR), { withFileTypes: true }).filter((entry) => entry.isDirectory()).length
  console.log(`✔ ${count} skills pass the static checks.`)
}
