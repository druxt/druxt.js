import DruxtRouterNuxtModule from '../src'

const mock = {
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  extendRoutes: jest.fn((func) => {
    const routes = []
    const resolve = jest.fn()

    func(routes, resolve)
  }),
  DruxtRouterNuxtModule
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtRouterNuxtModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.DruxtRouterNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
