import Default from '../src'

test('Default function', async () => {
  expect(() => Default()).toThrow("DruxtBlocks Nuxt module must be installed as 'druxt-blocks/nuxt'")
})
