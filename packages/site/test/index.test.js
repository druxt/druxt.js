describe('druxt-site entry point', () => {
  test('loads without fs, as a client bundle must', () => {
    // A client build has no fs. The Nuxt module imported it at the top level,
    // so importing DruxtSiteMixin from 'druxt-site' pulled fs into the client
    // bundle and webpack failed with "This dependency was not found: fs".
    jest.isolateModules(() => {
      jest.doMock('fs', () => {
        throw new Error("Cannot find module 'fs'")
      })
      // druxt is external to the bundle and has its own browser build, so
      // only druxt-site's own module graph is under test here.
      jest.doMock('druxt', () => ({}))
      const { DruxtSiteMixin } = require('../src')
      expect(DruxtSiteMixin).toBeDefined()
    })
  })
})
