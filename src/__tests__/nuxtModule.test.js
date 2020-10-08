import DruxtSchemaNuxtModule from '..'

jest.mock('../utils/schema')

const mock = {
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  nuxt: {
    hook: (hook, fn) => fn()
  },
  options: {},
  DruxtSchemaNuxtModule
}

test('Nuxt module', async () => {
  try {
    await mock.DruxtSchemaNuxtModule()
  }
  catch(err) {
    expect(err.message).toBe('Druxt settings missing.')
  }

  mock.options = {
    druxt: {
      baseUrl: 'https://example.com'
    }
  }
  await mock.DruxtSchemaNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
