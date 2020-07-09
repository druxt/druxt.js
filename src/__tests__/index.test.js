import NuxtModule from '..'

const mock = {
  addPlugin: jest.fn(),
  NuxtModule
}

test('Nuxt module', () => {
  expect(() => { mock.NuxtModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.NuxtModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
