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
          baseUrl: 'https://api.umami.demo.druxtjs.org',
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
      }),
      getAllLabels: async () => ({})
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
      getAllLabels: async () => ({}),
      getSchemaById
    }))

    await DruxtSchemaNuxtModule.call(mock)
    expect(mock.addServerMiddleware).not.toHaveBeenCalled()
    expect(process[refresh]).toBe(undefined)

    mock.options.druxt.schema = { refresh: true }
    await DruxtSchemaNuxtModule.call(mock)
    expect(mock.addServerMiddleware).toHaveBeenCalledWith({ path: '/_druxt/schema', handler: expect.any(Function) })
    const site = (id) => process[refresh].get('https://api.umami.demo.druxtjs.org')(id)
    expect(await site('node--page--default--view')).toStrictEqual({ id: 'node--page--default--view' })
    // Generation runs without the API proxy, as the build does.
    expect(DruxtSchema).toHaveBeenLastCalledWith('https://api.umami.demo.druxtjs.org', expect.objectContaining({ proxy: { api: false } }))

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
    expect([...process[refresh].keys()]).toStrictEqual(['https://api.umami.demo.druxtjs.org', 'https://other.example.com'])
    delete process[refresh]
  })
  test('Labels', async () => {
    const getAllLabels = jest.fn(async () => ({
      en: {},
      es: { 'node--recipe': { field_difficulty: { label: 'Dificultad', description: null } } },
    }))
    DruxtSchema.mockImplementation(() => ({
      get: () => ({ schemas: { 'node--recipe--default--view': {} } }),
      getAllLabels,
    }))
    // The build hook runs on after the module returns.
    let built
    mock.nuxt.hook = (hook, fn) => { built = fn() }
    await DruxtSchemaNuxtModule.call(mock)
    await built

    // One file for each language with translated labels, read with the build's own language read.
    expect(getAllLabels).toHaveBeenCalledWith({ build: mock.nuxt })
    expect(mock.addTemplate.mock.calls.map(([{ fileName }]) => fileName)).toStrictEqual([
      'schemas/node--recipe--default--view.json',
      'schemas/labels/es.json',
    ])
    expect(mock.addTemplate).toHaveBeenLastCalledWith(expect.objectContaining({
      options: { schema: { 'node--recipe': { field_difficulty: { label: 'Dificultad', description: null } } } },
    }))
  })

  test('Labels in refresh', async () => {
    const refresh = Symbol.for('druxt.schemaRefresh')
    delete process[refresh]
    const getSchemaById = jest.fn(async (id) => ({ id }))
    DruxtSchema.mockImplementation(() => ({ get: () => ({ schemas: { 'node--page--default--view': {} } }), getAllLabels: async () => ({}), getSchemaById }))
    mock.options.druxt.schema = { refresh: true }
    await DruxtSchemaNuxtModule.call(mock)

    expect(await process[refresh].get('https://api.umami.demo.druxtjs.org')('labels/es')).toStrictEqual({ id: 'labels/es' })
    delete process[refresh]
  })
})
