import DruxtSchemaNuxtModule from '..'

jest.mock('../schema')

const mock = {
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  nuxt: {
    hook: async (hook, fn) => await fn()
  },
  options: {
    druxt: {
      baseUrl: 'https://demo-api.druxtjs.org',
    },
  },
  DruxtSchemaNuxtModule
}

test('Nuxt module', async () => {
  expect(() => { DruxtSchemaNuxtModule.call({}) }).toThrow('Druxt settings missing.')

  DruxtSchemaNuxtModule.call(mock)
  expect(mock.addPlugin).toHaveBeenCalled()
})
