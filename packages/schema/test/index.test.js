import Default from '../src'

test('Default function', async () => {
  expect(() => Default()).toThrow("DruxtSchema Nuxt module must be installed as 'druxt-schema/nuxt'")
})
