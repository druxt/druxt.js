import { DruxtSchema } from '../../src'
import DruxtSchemaNuxtModule from '../../src/nuxt'

jest.mock('@nuxt/kit', () => ({
  addTemplate: jest.fn(),
  addPluginTemplate: jest.fn(),
  defineNuxtModule: (module) => module,
  installModule: jest.fn(),
  useLogger: jest.fn(() => ({
    success: jest.fn(),
  })),
}))

import { addPluginTemplate, addTemplate } from '@nuxt/kit'

jest.mock('../../src/schema')
let nuxtMock

describe('Nuxt module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nuxtMock = {
      hook: async (hook, fn) => await fn(),
      options: {
        druxt: {
          baseUrl: 'https://demo-api.druxtjs.org',
        },
      },
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
    await DruxtSchemaNuxtModule.setup({}, nuxtMock)
    expect(addPluginTemplate).toHaveBeenCalled()
    expect(addTemplate).toHaveBeenCalledTimes(1)
  })

  test('No schemas', async () => {
    DruxtSchema.mockImplementation(() => ({
      get: () => ({ schemas: {} })
    }))
    await DruxtSchemaNuxtModule.setup({}, nuxtMock)
    expect(addTemplate).toHaveBeenCalledTimes(0)
  })
})
