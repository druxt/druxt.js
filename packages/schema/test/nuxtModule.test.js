import DruxtSchemaNuxtModule, { DruxtSchema } from '../src'

jest.mock('../src/schema')
let mock

describe('Nuxt module', () => {
  beforeEach(() => {
    mock = {
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

  })

  test('Default', async () => {
    DruxtSchema.mockImplementation(() => ({
      get: () => ({
        schemas: {
          'node--page--default--view': {},
          'node--article--default--view': undefined
        }
      })
    }))
    await DruxtSchemaNuxtModule.call(mock)
    expect(mock.addPlugin).toHaveBeenCalled()
    expect(mock.addTemplate).toHaveBeenCalledTimes(1)
  })

  test('No schemas', async () => {
    DruxtSchema.mockImplementation(() => ({
      get: () => ({ schemas: {} })
    }))
    await DruxtSchemaNuxtModule.call(mock)
    expect(mock.addTemplate).toHaveBeenCalledTimes(0)
  })
})
