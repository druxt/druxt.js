import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildBody, readReleases } from '../pr-body.mjs'

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

test('says that merging publishes only while publishing is on', () => {
  assert.match(buildBody([release('druxt', '- A.')]), /while the repository variable `NPM_PUBLISH` is `true`/)
})

test('a body over the limit stays within it with real repository URLs', () => {
  // A long repository URL, such as a fork's, which GITHUB_REPOSITORY names.
  const blob = 'https://github.com/druxt-contrib/druxt-layout-paragraphs/blob/changeset-release/2.0.x/packages'
  const names = ['client', 'core', 'schema', 'router', 'entity', 'views', 'menu', 'breadcrumb', 'blocks', 'site', 'compat', 'devtools']
  const long = `### Major Changes\n\n${'- An entry.\n'.repeat(800)}`
  const releases = names.map((name) => ({ name: `@druxt/${name}`, version: '2.0.0-alpha.1', notes: long, changelog: `${blob}/${name}/CHANGELOG.md` }))
  for (const limit of [6000, 20000]) {
    const body = buildBody(releases, limit)
    assert.ok(body.length <= limit, `${body.length} is over ${limit}`)
    assert.match(body, /\[The whole 2\.0\.0-alpha\.1 section\]\(https:\/\/github\.com\/druxt-contrib\/druxt-layout-paragraphs\/blob\/changeset-release\/2\.0\.x\/packages\/devtools\/CHANGELOG\.md\) is too long/)
  }
})

// A repository with one package at 1.0.0 in its first commit, and the working
// tree at 1.1.0 with a second package the commit lacks.
const repository = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-body-'))
  const run = (...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd: root, stdio: 'pipe' })
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), JSON.stringify(value))
  }
  write('package.json', { workspaces: ['packages/*'] })
  write('packages/one/package.json', { name: 'one', version: '1.0.0' })
  run('init', '-q', '-b', 'main')
  run('add', '.')
  run('commit', '-q', '--no-gpg-sign', '-m', 'base')
  write('packages/one/package.json', { name: 'one', version: '1.1.0' })
  write('packages/two/package.json', { name: 'two', version: '1.0.0' })
  return root
}

test('reads the packages whose version moved, and a package the base lacks', () => {
  const root = repository()
  try {
    // The packages come in the order the file system lists them, which no platform promises.
    assert.deepEqual(readReleases(root, 'main', 'https://example.com').map(({ name, version }) => `${name}@${version}`).sort(), ['one@1.1.0', 'two@1.0.0'])
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('an absent base ref stops the script rather than releasing every package', () => {
  const root = repository()
  try {
    assert.throws(() => readReleases(root, 'origin/missing', 'https://example.com'), /The base ref origin\/missing does not name a commit here/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('a failed base ref check keeps git\'s error as the cause', () => {
  const root = repository()
  try {
    const failure = Object.assign(new Error('Command failed: git rev-parse'), { stderr: 'fatal: not a git repository\n' })
    const failing = () => { throw failure }
    assert.throws(() => readReleases(root, 'main', 'https://example.com', failing), (error) => {
      assert.match(error.message, /The base ref main does not name a commit here/)
      assert.equal(error.cause, failure)
      return true
    })
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('a git failure that is not a missing path is not read as a new package', () => {
  const root = repository()
  try {
    const failing = (args) => {
      if (args[0] === 'rev-parse') return 'abc\n'
      throw Object.assign(new Error('Command failed: git show'), { stderr: 'fatal: unable to read 0123abcd\n' })
    }
    assert.throws(() => readReleases(root, 'main', 'https://example.com', failing), /Command failed: git show/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
