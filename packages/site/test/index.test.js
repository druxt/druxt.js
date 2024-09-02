import Default from '../src'

test('Default function', async () => {
  expect(() => Default()).toThrow("DruxtSite Nuxt module must be installed as 'druxt-site/nuxt'")
})
