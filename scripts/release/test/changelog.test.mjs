import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const { getReleaseLine } = createRequire(import.meta.url)('../../../.changeset/changelog.cjs')

const SHA = '75b37680976671879b03eaf2eb046d799456f5ef'
const LATER = '773a7b76a4115327c4cd5b6a937e8ecaa6f13c65'

test('an entry links the commit that added its changeset', async () => {
  const line = await getReleaseLine({ summary: 'Routes are kept.', commit: LATER })
  assert.match(line, /\[`773a7b7`\]\(.*\/commit\/773a7b76/)
})

test('a Commit line links the change instead, and is left out of the entry', async () => {
  const line = await getReleaseLine({ summary: `Routes are kept.\n\nCommit: ${SHA}`, commit: LATER })
  assert.match(line, /\[`75b3768`\]\(.*\/commit\/75b37680/)
  assert.doesNotMatch(line, /773a7b7|Commit:/)
})

test('the rest of the body stays when a Commit line is removed', async () => {
  const line = await getReleaseLine({ summary: `Routes are kept.\n\nThe store too.\nCommit: ${SHA}`, commit: LATER })
  assert.match(line, /\n {2}The store too\.$/)
})

test('the body is a paragraph of its own, so the links close the first one', async () => {
  const line = await getReleaseLine({ summary: 'fix(#962): a query reaches Drupal.\n\nIt was sent empty.\n\n```js\nget()\n```', commit: LATER })
  // Joined straight under the bullet, the body ran into the first paragraph
  // and left the links in the middle of it.
  assert.match(line, /\/commit\/773a7b76[^)]*\)\)\n\n {2}It was sent empty\.\n\n {2}```js\n {2}get\(\)\n {2}```$/)
  assert.doesNotMatch(line, /^ +$/m)
})
