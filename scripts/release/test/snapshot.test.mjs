import { test } from 'node:test'
import assert from 'node:assert/strict'
import { snapshotChangeset, snapshotDependents } from '../snapshot.mjs'

const pkg = (name, deps = {}, extra = {}) => ({ dir: `/nowhere/${name}`, manifest: { name, version: '1.0.0', dependencies: deps, ...extra } })

test('a package that depends on a released sibling joins the snapshot', () => {
  const packages = [pkg('core'), pkg('breadcrumb', { core: '^1.0.0' }), pkg('menu', { core: '^1.0.0' })]
  assert.deepEqual(snapshotDependents({ packages, released: ['core', 'menu'] }), ['breadcrumb'])
})

test('a dependent of a dependent joins too', () => {
  const packages = [pkg('core'), pkg('router', { core: '^1.0.0' }), pkg('site', { router: '^1.0.0' })]
  assert.deepEqual(snapshotDependents({ packages, released: ['core'] }), ['router', 'site'])
})

test('peer dependencies count', () => {
  const packages = [pkg('core'), pkg('blocks', {}, { peerDependencies: { core: '^1.0.0' } })]
  assert.deepEqual(snapshotDependents({ packages, released: ['core'] }), ['blocks'])
})

test('a package that depends on nothing released stays out', () => {
  const packages = [pkg('core'), pkg('views', { core: '^1.0.0' }), pkg('site', { views: '^1.0.0' }), pkg('menu', { core: '^1.0.0' })]
  assert.deepEqual(snapshotDependents({ packages, released: ['views'] }), ['site'])
})

test('private packages stay out', () => {
  const packages = [pkg('core'), pkg('utils', { core: '^1.0.0' }, { private: true })]
  assert.deepEqual(snapshotDependents({ packages, released: ['core'] }), [])
})

test('the changeset gives each package a patch', () => {
  assert.equal(snapshotChangeset(['breadcrumb', 'site']), "---\n'breadcrumb': patch\n'site': patch\n---\n\nBuilt against the snapshot of the packages it depends on.\n")
})
