import Default from '../src'

test('Default function', async () => {
  expect(() => Default()).toThrow("DruxtRouter Nuxt module must be installed as 'druxt-router/nuxt'")
})
