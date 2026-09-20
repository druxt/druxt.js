import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkPackages, listUnpublished, readPackages } from '../check.mjs'

const pkg = (manifest, dir = '/nowhere') => ({ dir, manifest })

const core = (version = '1.2.0') => pkg({ name: 'core', version })

test('a coherent set has no problems', () => {
  const packages = [core(), pkg({ name: 'site', version: '2.0.0', dependencies: { core: '^1.2.0' } })]
  assert.deepEqual(checkPackages({ packages, files: false }), [])
})

test('a specifier that only resolves in the repository is refused', () => {
  for (const range of ['workspace:*', 'link:../core', 'file:../core', 'portal:../core']) {
    const packages = [core(), pkg({ name: 'site', version: '2.0.0', dependencies: { core: range } })]
    const problems = checkPackages({ packages, files: false })
    assert.equal(problems.length, 1, range)
    assert.match(problems[0], /does not resolve from npm/)
  }
})

test('an internal range that excludes the sibling in this release is refused', () => {
  const packages = [core('0.25.0'), pkg({ name: 'site', version: '2.0.0', dependencies: { core: '^0.24.0' } })]
  assert.match(checkPackages({ packages, files: false })[0], /but this release carries core@0\.25\.0/)
})

test('an exact pin on a snapshot sibling passes', () => {
  const snapshot = '0.24.1-dev.20260920003207'
  const packages = [core(snapshot), pkg({ name: 'site', version: `0.14.4-dev.20260920003207`, peerDependencies: { core: snapshot } })]
  assert.deepEqual(checkPackages({ packages, files: false }), [])
})

test('a dependency on a private sibling is refused', () => {
  const packages = [pkg({ name: 'utils', version: '1.0.0', private: true }), pkg({ name: 'site', version: '2.0.0', dependencies: { utils: '^1.0.0' } })]
  assert.match(checkPackages({ packages, files: false })[0], /names a private package/)
})

test('private packages are not checked', () => {
  const packages = [core(), pkg({ name: 'utils', version: 'nope', private: true, dependencies: { core: 'workspace:*' } })]
  assert.deepEqual(checkPackages({ packages, files: false }), [])
})

test('an invalid version is refused', () => {
  assert.match(checkPackages({ packages: [core('1.2')], files: false })[0], /not a valid version/)
})

test('a stable version must rise above the published one', () => {
  const registry = { core: { latest: '1.2.0', versions: ['1.1.0', '1.2.0'] } }
  assert.deepEqual(checkPackages({ packages: [core('1.2.1')], registry, files: false }), [])
  assert.match(checkPackages({ packages: [core('1.1.5')], registry, files: false })[0], /not above the published 1\.2\.0/)
})

test('an already published version passes, because publish skips it', () => {
  const registry = { core: { latest: '1.2.0', versions: ['1.2.0'] } }
  assert.deepEqual(checkPackages({ packages: [core('1.2.0')], registry, files: false }), [])
})

test('a snapshot of an already published version is refused', () => {
  const registry = { core: { latest: '0.17.3', versions: ['0.17.3'] } }
  assert.match(checkPackages({ packages: [core('0.17.3-dev.20260920003207')], registry, files: false })[0], /sorts below the published 0\.17\.3/)
  assert.deepEqual(checkPackages({ packages: [core('0.17.4-dev.20260920003207')], registry, files: false }), [])
})

test('an unpublished package skips the registry rules', () => {
  assert.deepEqual(checkPackages({ packages: [core('0.0.1')], registry: { core: null }, files: false }), [])
})

test('files entries must exist and hold something', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'release-check-'))
  const dir = path.join(root, 'packages', 'core')
  fs.mkdirSync(path.join(dir, 'dist'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'core', version: '1.0.0', files: ['dist', 'icon.svg'] }))

  const problems = checkPackages({ packages: readPackages(root) })
  assert.equal(problems.length, 2)
  assert.match(problems[0], /"dist" is empty/)
  assert.match(problems[1], /"icon.svg" does not exist/)

  fs.writeFileSync(path.join(dir, 'dist', 'core.esm.js'), '')
  fs.writeFileSync(path.join(dir, 'icon.svg'), '')
  assert.deepEqual(checkPackages({ packages: readPackages(root) }), [])
  fs.rmSync(root, { recursive: true })
})

test('a missing or empty files list is refused', () => {
  for (const list of [undefined, []]) {
    const packages = [pkg({ name: 'core', version: '1.0.0', files: list })]
    assert.match(checkPackages({ packages })[0], /has no "files" list/)
    assert.deepEqual(checkPackages({ packages, files: false }), [])
  }
})

test('unpublished versions are listed, private packages left out', () => {
  const packages = [core('1.2.1'), pkg({ name: 'site', version: '2.0.0' }), pkg({ name: 'fresh', version: '0.1.0' }), pkg({ name: 'utils', version: '1.0.0', private: true })]
  const registry = { core: { latest: '1.2.0', versions: ['1.2.0'] }, site: { latest: '2.0.0', versions: ['2.0.0'] }, fresh: null }
  assert.deepEqual(listUnpublished({ packages, registry }), ['core@1.2.1', 'fresh@0.1.0'])
})
