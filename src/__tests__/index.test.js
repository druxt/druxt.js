import DruxtSchemaModule from '..'

jest.mock('../druxtSchema')

const mock = {
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
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
