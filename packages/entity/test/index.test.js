import Default from '../src'

test('Default function', async () => {
  expect(() => Default()).toThrow("DruxtEntity Nuxt module must be installed as 'druxt-entity/nuxt'")
})
