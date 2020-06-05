import DruxtEntityModule from '..'

const mock = {
  addPlugin: jest.fn(),
  DruxtEntityModule
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtEntityModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.DruxtEntityModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
