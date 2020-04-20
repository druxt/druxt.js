import DruxtMenuPlugin from '..'

const mock = {
  addPlugin: jest.fn(),
  DruxtMenuPlugin
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtMenuPlugin() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.DruxtMenuPlugin()
  expect(mock.addPlugin).toHaveBeenCalled()
})
