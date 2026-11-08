describe('druxt-router entry point', () => {
  // doMock outlives isolateModules, so restore the real builtins even when a test throws.
  afterEach(() => {
    jest.unmock('fs')
    jest.unmock('path')
  })

  test('loads without fs or path, as a client bundle must', () => {
    // A client build has no fs, and a Vite build has no path. The Nuxt module
    // imported fs at the top level, so the module had to be registered as
    // 'druxt-router/nuxt' rather than by the package name like every other
    // Druxt module.
    jest.isolateModules(() => {
      for (const builtin of ['fs', 'path']) {
        jest.doMock(builtin, () => {
          throw new Error(`Cannot find module '${builtin}'`)
        })
      }
      // druxt is external to the bundle and has its own browser build, so
      // only druxt-router's own module graph is under test here.
      jest.doMock('druxt', () => ({}))
      const { DruxtRouterEntityMixin } = require('../src')
      expect(DruxtRouterEntityMixin).toBeDefined()
    })
  })

  test('exports the Nuxt module as its default, so `druxt-router` names it', () => {
    jest.isolateModules(() => {
      jest.doMock('druxt', () => ({}))
      const module = require('../src')
      expect(typeof module.default).toBe('function')
      expect(module.default).toBe(require('../src/nuxt').default)
      expect(module.default.meta.name).toBe('druxt-router')
    })
  })
})
