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

/** Dependency sections whose contents reach a consumer's install. */
const shippedSections = ['dependencies', 'peerDependencies', 'optionalDependencies']

/**
 * Shipped dependency changes in published packages, as
 * `[{ pkg, section, name, from, to }]`.
 *
 * A bumped range reaches consumers without a single source file moving, so a
 * path check cannot see it. devDependencies are deliberately absent: they never
 * reach an install, which is why a bumped linter is not a release.
 *
 * `manifests` carries each changed package.json as `{ path, before, after }`,
 * either side being null where the file did not exist.
 */
export const shippedDepChanges = (manifests, dirs) => {
  const changes = []
  for (const { path: file, before, after } of manifests) {
    const dir = /^packages\/([^/]+)\/package\.json$/.exec(file)?.[1]
    if (dir === undefined || !dirs.includes(dir)) continue
    for (const section of shippedSections) {
      const from = before?.[section] ?? {}
      const to = after?.[section] ?? {}
      for (const name of new Set([...Object.keys(from), ...Object.keys(to)])) {
        if (from[name] === to[name]) continue
        changes.push({ pkg: dir, section, name, from: from[name] ?? null, to: to[name] ?? null })
      }
    }
  }
  return changes
}

/** `druxt (peerDependencies: axios 0.28.0 -> 0.34.0)`, for a refusal worth acting on. */
const describeDepChanges = (changes) =>
  changes
    .map(({ pkg, section, name, from, to }) => `${pkg} (${section}: ${name} ${from ?? 'absent'} -> ${to ?? 'absent'})`)
    .join(', ')

/**
 * Whether this is the release's own version pull request.
 *
 * Changesets rewrites every internal dependency range when it versions
 * packages, so the release would otherwise fail the shipped-dependency rule,
 * and a gate that blocks releases is worse than no gate at all.
 *
 * A branch name is not evidence, because anyone can pick one, so this also
 * wants a changelog write, which only versioning produces. Even then it waives
 * the dependency rule alone: a branch named like a release still answers for
 * the source it changes.
 */
const isVersionPullRequest = (headBranch, files) =>
  (headBranch ?? '').startsWith('changeset-release/') &&
  files.some((file) => /^packages\/[^/]+\/CHANGELOG\.md$/.test(file))

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

/**
 * Problems with a change, as `{ code, message }`. Empty means it conforms.
 *
 * The code lets each host offer the right help, because a pre-filled link is
 * the difference between a refusal someone acts on and one they argue with.
 */
export const checkPlan = ({ files, manifests, milestone, issues, openMilestones, baseBranch, headBranch, dirs }) => {
  const deps = isVersionPullRequest(headBranch, files) ? [] : shippedDepChanges(manifests ?? [], dirs)
  const source = altersPublished(files, dirs)
  if (!source && deps.length === 0) return []
  const problems = []
  const current = currentMilestone(openMilestones, baseBranch)
  if (!hasChangeset(files)) {
    problems.push({
      code: 'no-changeset',
      message: source
        ? `changes a published package${deps.length ? `, and what one installs for consumers in ${describeDepChanges(deps)},` : ''} but adds no changeset, so it would never reach a release.`
        : `changes what a published package installs for consumers, in ${describeDepChanges(deps)}, but adds no changeset, so it would never reach a release.`,
    })
  }
  if (!issues || issues.length === 0) {
    problems.push({
      code: 'no-issue',
      current,
      message: 'has no linked issue. Add a closing keyword such as "Closes #123" to the description.',
    })
  }
  if (!milestone) {
    problems.push({
      code: 'no-milestone',
      current,
      message: current
        ? `has no milestone. The ${baseBranch} line is working towards ${current}.`
        : `has no milestone, and no open milestone matches the ${baseBranch} line.`,
    })
  } else if (current && milestone !== current) {
    problems.push({
      code: 'wrong-milestone',
      current,
      message:
        `is milestoned ${milestone}, but ${baseBranch} is working towards ${current}. ` +
        `Merging it now would put it in ${current} instead. Move the issue, or hold the change.`,
    })
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
    manifests: input.manifests,
    milestone: input.milestone,
    issues: input.issues,
    openMilestones: input.openMilestones,
    baseBranch: input.baseBranch,
    headBranch: input.headBranch,
    dirs: publishedDirs(root),
  })
  if (process.env.PLAN_PROBLEMS) fs.writeFileSync(process.env.PLAN_PROBLEMS, JSON.stringify(problems))
  if (problems.length === 0) {
    console.log('Plan conformance: this change is in the plan, or does not need to be.')
    return
  }
  for (const problem of problems) console.error(`plan: this change ${problem.message}`)
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
