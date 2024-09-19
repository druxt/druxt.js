import Default from '../src'

test('Default function', async () => {
  expect(() => Default()).toThrow("DruxtViews Nuxt module must be installed as 'druxt-views/nuxt'")
})
