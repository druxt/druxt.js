import DruxtViewsNuxtModule from '..'

const mock = {
  addPlugin: jest.fn(),
  DruxtViewsNuxtModule
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtViewsNuxtModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.DruxtViewsNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalledTimes(2)
})
