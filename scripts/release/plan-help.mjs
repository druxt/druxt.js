import fs from 'fs'
import { fileURLToPath } from 'url'

/**
 * Turns plan problems into something a person can act on in one click.
 *
 * A refusal that only says what is wrong gets argued with. One that hands over
 * a pre-filled issue, already on the right milestone, gets acted on.
 *
 * Host differs only in URL shape, so the logic stays here and each CI driver
 * passes its own host.
 */
const encode = (value) => encodeURIComponent(value)

export const helpFor = ({ code, current }, { host, repoUrl, title, body, number, milestoneId }) => {
  if (code === 'no-changeset') {
    return 'Run `yarn changeset`, describe the change for someone using the package, and commit the file it writes.'
  }
  if (code === 'no-issue') {
    const query =
      host === 'gitlab'
        ? `issue[title]=${encode(title)}&issue[description]=${encode(body)}` +
          (milestoneId ? `&issue[milestone_id]=${encode(milestoneId)}` : '')
        : `title=${encode(title)}&body=${encode(body)}` + (current ? `&milestone=${encode(current)}` : '')
    const path = host === 'gitlab' ? '/-/issues/new' : '/issues/new'
    return `Open the issue with this: ${repoUrl}${path}?${query}\nThen add a closing keyword to the description, such as "Closes #123".`
  }
  if (code === 'no-milestone' || code === 'wrong-milestone') {
    const where =
      host === 'gitlab' ? `${repoUrl}/-/merge_requests/${number}/edit` : `${repoUrl}/pull/${number}`
    return current
      ? `Set the milestone to ${current}: ${where}`
      : `No open milestone matches this line. Create one, or retarget the change: ${where}`
  }
  return ''
}

const main = () => {
  const problems = JSON.parse(fs.readFileSync(process.env.PLAN_PROBLEMS, 'utf8'))
  const context = {
    host: process.env.PLAN_HOST || 'github',
    repoUrl: process.env.PLAN_REPO_URL || '',
    title: process.env.PLAN_TITLE || '',
    body: process.env.PLAN_BODY || '',
    number: process.env.PLAN_NUMBER || '',
    milestoneId: process.env.PLAN_MILESTONE_ID || '',
  }
  for (const problem of problems) {
    const help = helpFor(problem, context)
    console.log(`- This change ${problem.message}`)
    if (help) for (const line of help.split('\n')) console.log(`  ${line}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
