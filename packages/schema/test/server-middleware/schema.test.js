import { schemaHandler } from '../../src/server-middleware/schema'

const response = () => ({ statusCode: 0, headers: {}, body: undefined, setHeader (name, value) { this.headers[name] = value }, end (body) { this.body = body } })
const request = async (handler, url, method = 'GET') => {
  const res = response()
  await handler({ method, url }, res)
  return res
}

describe('schemaHandler', () => {
  test('serves a held schema as JSON', async () => {
    const getSchemaById = jest.fn(async (id) => ({ id }))
    const handler = schemaHandler(getSchemaById)

    const res = await request(handler, '/node--page--default--view')
    expect(res.statusCode).toBe(200)
    expect(res.headers['Content-Type']).toBe('application/json')
    expect(res.headers['Cache-Control']).toBe('no-store')
    expect(JSON.parse(res.body)).toStrictEqual({ id: 'node--page--default--view' })
    expect(getSchemaById).toHaveBeenCalledWith('node--page--default--view')
  })

  test('answers only GET', async () => {
    const res = await request(schemaHandler(jest.fn()), '/node--page--default--view', 'POST')
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toBe('GET')
  })

  test('refuses anything but a schema ID, without asking Drupal', async () => {
    const getSchemaById = jest.fn()
    const handler = schemaHandler(getSchemaById)

    for (const url of ['/', '/node--page', `/..${encodeURIComponent('/')}node--page--default--view`, '/%E0%A4%A', '/node--page--default--view/extra']) {
      expect((await request(handler, url)).statusCode).toBe(404)
    }
    expect(getSchemaById).not.toHaveBeenCalled()
  })

  test('404 when Drupal has no such display, 502 when generation fails', async () => {
    const getSchemaById = jest.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('down'))
    const handler = schemaHandler(getSchemaById)

    expect((await request(handler, '/node--page--teaser--view')).statusCode).toBe(404)
    expect((await request(handler, '/node--page--teaser--view')).statusCode).toBe(502)
  })
})
