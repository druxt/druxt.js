import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publishOrder } from '../pack.mjs'

const pkg = (name, deps = {}, extra = {}) => ({ dir: `/nowhere/${name}`, manifest: { name, version: '1.0.0', dependencies: deps, ...extra } })
const names = (packages) => publishOrder(packages).map(({ manifest }) => manifest.name)

test('a package follows the siblings it depends on', () => {
  const packages = [pkg('site', { core: '1.0.0', router: '1.0.0' }), pkg('router', { core: '1.0.0' }), pkg('core')]
  assert.deepEqual(names(packages), ['core', 'router', 'site'])
})

test('peer dependencies order packages too', () => {
  const packages = [pkg('blocks', {}, { peerDependencies: { core: '1.0.0' } }), pkg('core')]
  assert.deepEqual(names(packages), ['core', 'blocks'])
})

test('private packages and outside dependencies are left out', () => {
  const packages = [pkg('core', { axios: '0.28.0' }), pkg('utils', { core: '1.0.0' }, { private: true })]
  assert.deepEqual(names(packages), ['core'])
})

test('independent packages come out in name order, so the result is stable', () => {
  assert.deepEqual(names([pkg('views'), pkg('blocks'), pkg('menu')]), ['blocks', 'menu', 'views'])
})

test('a dependency cycle is refused', () => {
  assert.throws(() => publishOrder([pkg('a', { b: '1.0.0' }), pkg('b', { a: '1.0.0' })]), /Dependency cycle: a -> b -> a/)
})
