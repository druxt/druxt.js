import DruxtSiteModule from '..'

const mock = {
  addModule: jest.fn(),
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  DruxtSiteModule
}

jest.mock('druxt-schema')

describe('DruxtJS Site module', () => {
  test('Nuxt module', () => {
    expect(() => { mock.DruxtSiteModule() }).toThrow('Druxt settings missing.')

    mock.options = { druxt: {} }
    mock.nuxt = {
      hook: jest.fn(async (hook, callback) => {
        await callback.call(this)
      })
    }

    // Call DruxtSite module.
    mock.DruxtSiteModule()

    // Expect 10 modules to be added.
    expect(mock.addModule).toHaveBeenCalledTimes(10)
  })
})
