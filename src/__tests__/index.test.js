import DruxtModule from '..'

const mock = {
  addPlugin: jest.fn(),
  DruxtModule
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.DruxtModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
