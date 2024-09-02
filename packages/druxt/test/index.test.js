import Default from '../src'

test('Default function', async () => {
  expect(() => Default()).toThrow("Druxt Nuxt module must be installed as 'druxt/nuxt'")
})
