import DruxtRouterModule from '..'

const mock = {
  addPlugin: jest.fn(),
  extendRoutes: jest.fn(),
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
