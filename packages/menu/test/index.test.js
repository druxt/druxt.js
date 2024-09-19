import Default from '../src'

test('Default function', async () => {
  expect(() => Default()).toThrow("DruxtMenu Nuxt module must be installed as 'druxt-menu/nuxt'")
})
