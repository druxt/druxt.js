import { DruxtSchema } from '..'

jest.mock('axios')
jest.mock('simple-oauth2')

const baseURL = 'https://example.com'
const options = {}

let schema

describe('DruxtSchema', () => {
  beforeEach(() => {
    schema = new DruxtSchema(baseURL, options)
  })

  test('constructor', () => {
    // Throw error if 'baseURL' not provided.
    expect(() => { new DruxtSchema() }).toThrow('The \'baseURL\' parameter is required.')

    // Ensure class type.
    expect(new DruxtSchema(baseURL)).toBeInstanceOf(DruxtSchema)
  })

  test('get', async () => {
    const { schemas } = await schema.get()

    expect(Object.keys(schemas).length).toBe(4)

    expect(Object.values(schemas)[0]).toHaveProperty('id')
    expect(Object.values(schemas)[0]).toHaveProperty('resourceType')

    expect(Object.values(schemas)[0].config).toHaveProperty('entityType')
    expect(Object.values(schemas)[0].config).toHaveProperty('bundle')
    expect(Object.values(schemas)[0].config).toHaveProperty('mode')
    expect(Object.values(schemas)[0].config).toHaveProperty('schemaType')

    expect(schemas).toMatchSnapshot()
  })

  test('getSchema', async () => {
    let config = {
      entityType: 'node',
      bundle: 'page'
    }

    const result = await schema.getSchema(config)
    expect(result).toHaveProperty('config')
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('displayId')
    expect(result).toHaveProperty('druxtSchema')
    expect(result).toHaveProperty('fields')
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('isValid')
    expect(result).toHaveProperty('resourceType')

    // Ensure we don't get a filtered schema.
    config.filter = ['node--article--default--view']
    expect(await schema.getSchema(config)).toBe(false)
  })

  test('oauth2', async () => {
    schema = new DruxtSchema(baseURL, {
      auth: {
        type: 'oauth2',
        credentials: {
          clientId: 'clientId',
          clientSecret: 'clientSecret',
          username: 'username',
          password: 'password'
        }
      }
    })

    const callback = schema.oauth2()
    const request = await callback({ headers: {} })
    expect(request.headers).toHaveProperty('Authorization')
  })
})
