/**
 * Pre-commit checks for staged files (run by .husky/pre-commit).
 *
 * Each check here also runs in CI, so a commit that passes these is not
 * refused later for the same reason. File-level tools get the staged files.
 * Repository-wide checks (the prose lint and the skill checks) take no file
 * arguments, so they are written as functions that ignore the file list.
 */
const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ')

const cspell = (files) => `cspell lint --no-progress --no-must-find-files ${quote(files)}`

// Vale reads the files prettier and eslint have just rewritten, so it runs
// after them in the same task list, and lint-staged runs with concurrency off.
const prose = 'yarn lint:prose'

module.exports = {
  '*.{js,vue}': (files) => [
    `eslint --fix --fix-type problem,layout,suggestion ${quote(files)}`,
    cspell(files),
    prose,
  ],
  '*.mjs': (files) => [cspell(files), prose],
  '*.{json,yml,yaml}': (files) => [`prettier --write ${quote(files)}`, cspell(files)],
  '*.md': (files) => [`prettier --write ${quote(files)}`, `markdownlint-cli2 ${quote(files)}`, cspell(files), prose],
  '{.agents/skills/**,.claude/skills,scripts/skills/**,AGENTS.md}': () => ['yarn lint:skills', 'yarn lint:skills:test'],
  'scripts/commits/**': () => 'yarn lint:commits:test',
}
