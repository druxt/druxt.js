import DruxtBlocksNuxtModule from '..'

const mock = {
  addPlugin: jest.fn(),
  DruxtBlocksNuxtModule
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtBlocksNuxtModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.DruxtBlocksNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
