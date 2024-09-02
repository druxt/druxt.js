import Default from '../src'

test('Default function', async () => {
  expect(() => Default()).toThrow("DruxtBreadcrumb Nuxt module must be installed as 'druxt-breadcrumb/nuxt'")
})
