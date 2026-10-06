import DruxtSchemaNuxtModule, { DruxtSchema } from '../src'

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
    const site = (id) => process[refresh].get('https://demo-api.druxtjs.org')(id)
    expect(await site('node--page--default--view')).toStrictEqual({ id: 'node--page--default--view' })
    // Generation runs without the API proxy, as the build does.
    expect(DruxtSchema).toHaveBeenLastCalledWith('https://demo-api.druxtjs.org', expect.objectContaining({ proxy: { api: false } }))

    // An ID it cannot parse uses the built file.
    expect(await site('not a schema id')).toBe(null)

    // Held in production.
    await site('node--page--default--view')
    expect(getSchemaById).toHaveBeenCalledTimes(1)

    // Regenerated on each request under `nuxt dev`.
    mock.options.dev = true
    await DruxtSchemaNuxtModule.call(mock)
    await site('node--page--default--view')
    await site('node--page--default--view')
    expect(getSchemaById).toHaveBeenCalledTimes(3)

    // Another site in the same process gets its own refresh.
    mock.options.druxt.baseUrl = 'https://other.example.com'
    await DruxtSchemaNuxtModule.call(mock)
    expect([...process[refresh].keys()]).toStrictEqual(['https://demo-api.druxtjs.org', 'https://other.example.com'])
    delete process[refresh]
  })
})
