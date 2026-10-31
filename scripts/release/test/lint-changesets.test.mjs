import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lintChangeset, parseChangeset } from '../lint-changesets.mjs'

const packages = new Map([
  ['druxt', { version: '0.25.0' }],
  ['druxt-menu', { version: '0.22.0' }],
  ['druxt-views', { version: '0.23.0' }],
])

const changeset = (summary, releases = "'druxt': patch") => `---\n${releases}\n---\n\n${summary}\n`
const lint = (...args) => lintChangeset(changeset(...args), packages)

test('passes a changeset in the project style', () => {
  assert.deepEqual(lint('fix(#836): `getSchema()` resolves `false` when the bundle has no display.\n\nCheck the result first.'), [])
  assert.deepEqual(lint('feat(#87, #88): pass `attrs` through to the wrapper.'), [])
})

test('parses quoted and bare frontmatter', () => {
  assert.deepEqual(parseChangeset("---\n'druxt': patch\ndruxt-menu: minor\n---\n\nfix(#1): a.").releases, { druxt: 'patch', 'druxt-menu': 'minor' })
  assert.equal(parseChangeset('fix(#1): no frontmatter.'), null)
})

test('needs a type and an issue or pull request in the prefix', () => {
  for (const summary of ['the cache keeps more.', 'fix: the cache keeps more.', 'fix(druxt): the cache keeps more.']) {
    assert.match(lint(summary).join('\n'), /must start with `type\(#N\): `/)
  }
})

test('writes the sentence lowercase, unless it opens with code', () => {
  assert.match(lint('fix(#1): The cache keeps more.').join('\n'), /starts its sentence with a capital/)
  assert.deepEqual(lint('fix(#1): `DruxtClient` keeps more.'), [])
})

test('says what is true now, not that something was fixed', () => {
  for (const verb of ['fix', 'Fixes', 'fixed']) {
    assert.match(lint(`fix(#1): ${verb.toLowerCase()} a query that reached Drupal empty.`).join('\n'), /renders as "Fixed …"/)
  }
})

test('refuses a package that is not published here, a bad bump and a major on 0.x', () => {
  assert.match(lint('fix(#1): a.', "'druxt-docgen': patch").join('\n'), /not a published package/)
  assert.match(lint('fix(#1): a.', "'druxt': tiny").join('\n'), /bump "tiny"/)
  assert.match(lint('fix(#1)!: a.', "'druxt': major").join('\n'), /publishes 1\.0\.0/)
})

test('a breaking change is not a patch', () => {
  assert.match(lint('fix(#1)!: the store renames `get`.').join('\n'), /breaking but releases a patch/)
  assert.match(lint('fix(#1): the store renames `get`.\n\nBREAKING CHANGE: rename the call.').join('\n'), /breaking but releases a patch/)
  assert.deepEqual(lint('fix(#1)!: the store renames `get`.', "'druxt': minor"), [])
})

test('keeps headings and bare code blocks out of the changelog', () => {
  assert.match(lint('fix(#1): a.\n\n## Upgrading\n\nDo it.').join('\n'), /Markdown heading/)
  assert.deepEqual(lint('fix(#1): a.\n\n```sh\n# a shell comment, not a heading\n```'), [])
  assert.match(lint('fix(#1): a.\n\n```\nconst a = 1\n```').join('\n'), /without a language/)
  assert.deepEqual(lint('fix(#1): a.\n\n```js\nconst a = 1\n```\n\n```diff\n- a\n```'), [])
})

test('writes for the person upgrading, not about the change', () => {
  assert.match(lint('fix(#1): a query reaches Drupal whole, as this PR fixes.').join('\n'), /talks about the change itself/)
  assert.match(lint('fix(#1): a query reaches Drupal whole.\n\nWe now encode it.').join('\n'), /talks about the change itself/)
  // Code is not prose.
  assert.deepEqual(lint('fix(#1): `we.commit()` works.'), [])
})

test('a changeset for several packages reads correctly in each changelog', () => {
  const both = "'druxt-menu': patch\n'druxt-views': patch"
  assert.deepEqual(lint('fix(#905): generated stories load when a label holds a quote.', both), [])
  assert.match(lint('fix(#1): this package loads stories with quotes.', both).join('\n'), /says "this package"/)

  const owned = lint('fix(#1): `DruxtMenu` renders a quoted label.', both).join('\n')
  assert.match(owned, /`DruxtMenu` from druxt-menu, which reads as off-topic in the changelogs of druxt-views/)
  assert.deepEqual(lint('fix(#1): in `druxt-menu`, `DruxtMenu` renders a quoted label.', both), [])

  // Core components are shared, and one package alone has no other changelog.
  assert.deepEqual(lint('fix(#1): `DruxtClient` sends a quoted label.', both), [])
  assert.deepEqual(lint('fix(#1): `DruxtMenu` renders a quoted label.', "'druxt-menu': patch"), [])
})

test('a package named twice is refused, as changesets refuses it', () => {
  assert.match(lint('fix(#1): a.', "'druxt': patch\n'druxt': minor").join('\n'), /names "druxt" more than once/)
})

test('reads fences as Markdown does: tildes, and a closing fence at least as long', () => {
  // A heading-like line inside a tilde block is code.
  assert.deepEqual(lint('fix(#1): a.\n\n~~~js\n# not a heading\n~~~'), [])
  assert.match(lint('fix(#1): a.\n\n~~~\nconst a = 1\n~~~').join('\n'), /without a language/)
  // A shorter fence inside a longer one does not close it.
  assert.deepEqual(lint('fix(#1): a.\n\n````md\n```\n# still code\n```\n````'), [])
  // Once the block closes, a heading after it counts.
  assert.match(lint('fix(#1): a.\n\n```js\na()\n```\n\n# After').join('\n'), /Markdown heading/)
})

test('a heading after a tab, or with no text, is still a heading', () => {
  assert.match(lint('fix(#1): a.\n\n##\tUpgrading').join('\n'), /Markdown heading/)
  assert.match(lint('fix(#1): a.\n\n###').join('\n'), /Markdown heading/)
  // A hash with no space is a tag, not a heading.
  assert.deepEqual(lint('fix(#1): a.\n\n#hashtag in a sentence.'), [])
})
