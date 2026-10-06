import DruxtSchemaNuxtModule, { DruxtSchema } from '../src'
import { clearSchemaHold } from '../src/utils/hold'

jest.mock('../src/schema')
let mock

describe('Nuxt module', () => {
  beforeEach(() => {
    mock = {
      addPlugin: jest.fn(),
      addServerMiddleware: jest.fn(),
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
  test('Refresh', async () => {
    const refresh = Symbol.for('druxt.schemaRefresh')
    delete process[refresh]
    clearSchemaHold()
    const getSchemaById = jest.fn(async (id) => ({ id }))
    DruxtSchema.mockImplementation(() => ({
      get: () => ({ schemas: { 'node--page--default--view': {} } }),
      getSchemaById
    }))

    await DruxtSchemaNuxtModule.call(mock)
    expect(mock.addServerMiddleware).not.toHaveBeenCalled()
    expect(process[refresh]).toBe(undefined)

    mock.options.druxt.schema = { refresh: true }
    await DruxtSchemaNuxtModule.call(mock)
    expect(mock.addServerMiddleware).toHaveBeenCalledWith({ path: '/_druxt/schema', handler: expect.any(Function) })
    expect(await process[refresh]('node--page--default--view')).toStrictEqual({ id: 'node--page--default--view' })
    // Generation runs without the API proxy, as the build does.
    expect(DruxtSchema).toHaveBeenLastCalledWith('https://demo-api.druxtjs.org', expect.objectContaining({ proxy: { api: false } }))

    // An ID it cannot parse uses the built file.
    expect(await process[refresh]('not a schema id')).toBe(null)

    // Held in production.
    await process[refresh]('node--page--default--view')
    expect(getSchemaById).toHaveBeenCalledTimes(1)

    // Regenerated on each request under `nuxt dev`.
    mock.options.dev = true
    await DruxtSchemaNuxtModule.call(mock)
    await process[refresh]('node--page--default--view')
    await process[refresh]('node--page--default--view')
    expect(getSchemaById).toHaveBeenCalledTimes(3)
    delete process[refresh]
  })
})
