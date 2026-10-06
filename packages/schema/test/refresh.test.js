import { createSchemaRefresh, DruxtSchema } from '../src'

jest.mock('../src/schema')

const response = () => ({ statusCode: 0, headers: {}, setHeader (name, value) { this.headers[name] = value }, end (body) { this.body = body } })
const get = async (handler, id) => {
  const res = response()
  await handler({ method: 'GET', url: `/${id}` }, res)
  return res
}

describe('createSchemaRefresh', () => {
  let getSchemaById
  beforeEach(() => {
    getSchemaById = jest.fn(async (id) => ({ id, call: getSchemaById.mock.calls.length }))
    DruxtSchema.mockImplementation(() => ({ getSchemaById }))
  })

  test('serves a held schema until clear()', async () => {
    const { handler, clear } = createSchemaRefresh('https://example.com', { endpoint: '/api' })

    expect(JSON.parse((await get(handler, 'node--page--default--view')).body)).toStrictEqual({ id: 'node--page--default--view', call: 1 })
    await get(handler, 'node--page--default--view')
    expect(getSchemaById).toHaveBeenCalledTimes(1)
    // Generated with the given options, without the API proxy.
    expect(DruxtSchema).toHaveBeenLastCalledWith('https://example.com', { endpoint: '/api', proxy: { api: false } })

    clear()
    expect(JSON.parse((await get(handler, 'node--page--default--view')).body)).toStrictEqual({ id: 'node--page--default--view', call: 2 })
    // Each clear starts a new generator.
    expect(DruxtSchema).toHaveBeenCalledTimes(2)
  })

  test('a schema generated across clear() is not held', async () => {
    let resolve
    getSchemaById.mockImplementationOnce(() => new Promise((r) => { resolve = r }))
    const { getSchema, clear } = createSchemaRefresh('https://example.com')

    const pending = getSchema('node--page--default--view')
    clear()
    resolve({ id: 'stale' })
    expect(await pending).toStrictEqual({ id: 'stale' })
    expect(await getSchema('node--page--default--view')).toStrictEqual({ id: 'node--page--default--view', call: 2 })
  })

  test('without a hold, each call regenerates', async () => {
    const { getSchema } = createSchemaRefresh('https://example.com', {}, { hold: false })
    await getSchema('node--page--default--view')
    await getSchema('node--page--default--view')
    expect(getSchemaById).toHaveBeenCalledTimes(2)
  })

  test('refreshes for different sites never share a schema', async () => {
    DruxtSchema.mockImplementation((baseUrl) => ({ getSchemaById: async (id) => ({ id, baseUrl }) }))
    const a = createSchemaRefresh('https://a.example.com')
    const b = createSchemaRefresh('https://b.example.com')

    expect(await a.getSchema('node--page--default--view')).toStrictEqual({ id: 'node--page--default--view', baseUrl: 'https://a.example.com' })
    expect(await b.getSchema('node--page--default--view')).toStrictEqual({ id: 'node--page--default--view', baseUrl: 'https://b.example.com' })
  })
})
