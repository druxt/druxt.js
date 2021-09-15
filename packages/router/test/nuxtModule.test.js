import DruxtRouterNuxtModule from '../src'

const mock = {
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  extendRoutes: jest.fn((func) => {
    const routes = []
    const resolve = jest.fn()

    func(routes, resolve)
  }),
  nuxt: {
    hook: jest.fn((hook, callback) => callback()),
    options: { build: {} }
  },
  DruxtRouterNuxtModule
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtRouterNuxtModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.DruxtRouterNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalledTimes(2)
  expect(mock.addTemplate).toHaveBeenCalledTimes(1)
  jest.clearAllMocks()

  mock.options.druxt.router = { wildcard: false }
  mock.DruxtRouterNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalledTimes(2)
  expect(mock.addTemplate).toHaveBeenCalledTimes(0)
  jest.clearAllMocks()

  mock.options.druxt.router = { pages: false }
  mock.DruxtRouterNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalledTimes(2)
  expect(mock.addTemplate).toHaveBeenCalledTimes(1)
  expect(mock.nuxt.hook).toHaveBeenCalledTimes(1)
  expect(mock.nuxt.options.build.createRoutes()).toStrictEqual([])
  jest.clearAllMocks()
})
