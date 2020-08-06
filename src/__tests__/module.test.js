import DruxtRouterModule from '..'

const mock = {
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  extendRoutes: jest.fn((func) => {
    const routes = []
    const resolve = jest.fn()

    func(routes, resolve)
  }),
  DruxtRouterModule
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtRouterModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.DruxtRouterModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
