import DruxtSchemaModule from '..'

jest.mock('../schema')

const mock = {
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  nuxt: {
    hook: jest.fn((hook, fn) => fn()),
  },
  options: {},
  DruxtSchemaModule
}

test('Nuxt module', async () => {
  try {
    await mock.DruxtSchemaModule()
  }
  catch(err) {
    expect(err.message).toBe('Druxt settings missing.')
  }

  mock.options = {
    druxt: {
      baseUrl: 'https://example.com'
    }
  }
  await mock.DruxtSchemaModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
