import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Plan conformance for a pull request.
 *
 * A change that alters a published package has to be part of the plan: a
 * changeset so it reaches a release, an issue so the work is tracked, and the
 * current milestone so it reaches the release it was planned for. Everything
 * else is left alone, because gating documentation, CI or a private package
 * only teaches people to work around the gate.
 */

/** Directory names under packages/ whose package.json is not private. */
export const publishedDirs = (root) =>
  fs
    .readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      const manifest = path.join(root, 'packages', entry.name, 'package.json')
      if (!fs.existsSync(manifest)) return false
      return JSON.parse(fs.readFileSync(manifest, 'utf8')).private !== true
    })
    .map((entry) => entry.name)

/**
 * Whether these changed files alter what a published package ships.
 *
 * Source only. A README publishes too, but a wording fix is not a release, and
 * treating it as one is how a gate loses the room.
 */
export const altersPublished = (files, dirs) =>
  files.some((file) => dirs.some((dir) => file.startsWith(`packages/${dir}/src/`)))

/** A changeset, ignoring the directory's own README. */
export const hasChangeset = (files) =>
  files.some((file) => file.startsWith('.changeset/') && file.endsWith('.md') && !file.endsWith('/README.md'))

/**
 * The milestone a release line is currently working towards: the lowest open
 * one sharing the line's major. Computed rather than declared, because a line
 * moves on to the next milestone every release and a declaration goes stale
 * silently, gating against the wrong one while appearing to work.
 */
export const currentMilestone = (openTitles, branch) => {
  const major = /^(\d+)\./.exec(branch)?.[1]
  if (major === undefined) return null
  const key = (title) => title.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const candidates = openTitles
    .filter((title) => /^\d+\.\d+\.\d+$/.test(title) && title.startsWith(`${major}.`))
    .sort((a, b) => {
      const [x, y] = [key(a), key(b)]
      return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]
    })
  return candidates[0] ?? null
}

/** Problems with a pull request, as plain sentences. Empty means it conforms. */
export const checkPlan = ({ files, milestone, issues, openMilestones, baseBranch, dirs }) => {
  if (!altersPublished(files, dirs)) return []
  const problems = []
  if (!hasChangeset(files)) {
    problems.push('changes a published package but adds no changeset, so it would never reach a release.')
  }
  if (!issues || issues.length === 0) {
    problems.push('has no linked issue. Add a closing keyword such as "Closes #123" to the description.')
  }
  const current = currentMilestone(openMilestones, baseBranch)
  if (!milestone) {
    problems.push(
      current
        ? `has no milestone. The ${baseBranch} line is working towards ${current}.`
        : `has no milestone, and no open milestone matches the ${baseBranch} line.`
    )
  } else if (current && milestone !== current) {
    problems.push(
      `is milestoned ${milestone}, but ${baseBranch} is working towards ${current}. ` +
        `Merging it now would ship it in ${current} instead. Move the issue, or hold the pull request.`
    )
  }
  return problems
}

const main = () => {
  const root = process.cwd()
  const read = (name) => {
    const value = process.env[name]
    if (!value) throw new Error(`${name} is not set.`)
    return value
  }
  const input = JSON.parse(fs.readFileSync(read('PLAN_INPUT'), 'utf8'))
  const problems = checkPlan({
    files: input.files,
    milestone: input.milestone,
    issues: input.issues,
    openMilestones: input.openMilestones,
    baseBranch: input.baseBranch,
    dirs: publishedDirs(root),
  })
  if (problems.length === 0) {
    console.log('Plan conformance: this pull request is in the plan, or does not need to be.')
    return
  }
  for (const problem of problems) console.error(`plan: this pull request ${problem}`)
  process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`plan: ${error.message}`)
    process.exit(1)
  }
}
