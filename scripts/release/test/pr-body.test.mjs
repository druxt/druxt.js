import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildBody } from '../pr-body.mjs'

const release = (name, notes) => ({ name, version: '0.25.1', notes, changelog: `https://example.com/${name}/CHANGELOG.md` })

test('each release has its changelog section beneath its heading', () => {
  const body = buildBody([
    release('druxt', '### Patch Changes\n\n- The server cache keeps more.'),
    release('druxt-router', '### Patch Changes\n\n- Updated dependencies: druxt@0.25.1.'),
  ])
  assert.match(body, /# Releases\n\n## druxt@0\.25\.1\n\n### Patch Changes\n\n- The server cache keeps more\.\n\n## druxt-router@0\.25\.1\n\n### Patch Changes/)
})

test('a body too long for GitHub keeps every release and links the rest', () => {
  const long = `### Patch Changes\n\n${'- An entry that goes on.\n'.repeat(400)}`
  const body = buildBody([release('druxt', long), release('druxt-menu', '### Patch Changes\n\n- Short.')], 6000)
  assert.ok(body.length <= 6000)
  assert.match(body, /## druxt@0\.25\.1\n\n### Patch Changes\n\n- An entry/)
  assert.match(body, /\[The whole 0\.25\.1 section\]\(https:\/\/example\.com\/druxt\/CHANGELOG\.md\) is too long/)
  assert.match(body, /## druxt-menu@0\.25\.1\n\n### Patch Changes\n\n- Short\./)
})
