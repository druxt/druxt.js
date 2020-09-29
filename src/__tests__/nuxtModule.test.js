import DruxtNuxtModule from '..'

const mock = {
  addModule: jest.fn(),
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  DruxtNuxtModule
}

jest.mock('druxt-schema')

describe('Druxt.js', () => {
  test('Nuxt module', () => {
    expect(() => { mock.DruxtNuxtModule() }).toThrow('Druxt settings missing.')

    mock.options = { druxt: {} }
    mock.nuxt = {
      hook: jest.fn(async (hook, callback) => {
        await callback.call(this)
      })
    }

    // Call Druxt module.
    mock.DruxtNuxtModule()
  })
})
