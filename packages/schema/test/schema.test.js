import axios from 'axios'

import { DruxtSchema } from '../src'

jest.mock('axios')

const baseUrl = 'https://demo-api.druxtjs.org'
const options = { axios }

let schema

describe('DruxtSchema', () => {
  beforeEach(() => {
    schema = new DruxtSchema(baseUrl, options)
  })

  test('constructor', () => {
    // Throw error if 'baseURL' not provided.
    expect(() => { new DruxtSchema() }).toThrow('The \'baseUrl\' parameter is required.')

    // Ensure class type.
    expect(new DruxtSchema(baseUrl)).toBeInstanceOf(DruxtSchema)
  })

  test('get', async () => {
    const { schemas } = await schema.get()

    expect(Object.keys(schemas).length).toBe(46)

    expect(Object.values(schemas)[0]).toHaveProperty('id')
    expect(Object.values(schemas)[0]).toHaveProperty('resourceType')

    expect(Object.values(schemas)[0].config).toHaveProperty('entityType')
    expect(Object.values(schemas)[0].config).toHaveProperty('bundle')
    expect(Object.values(schemas)[0].config).toHaveProperty('mode')
    expect(Object.values(schemas)[0].config).toHaveProperty('schemaType')

    expect(schemas).toMatchSnapshot()
  })

  test('getSchemaById', async () => {
    const { schemas } = await schema.get()
    const built = schemas['node--page--default--view']

    expect(await schema.getSchemaById('node--page--default--view')).toStrictEqual(built)
  })

  test('getSchemaById - only IDs the index can build', async () => {
    schema.druxt.getIndex = jest.fn(schema.druxt.getIndex.bind(schema.druxt))

    expect(await schema.getSchemaById('../../etc/passwd')).toBe(false)
    expect(await schema.getSchemaById('node--page--default--edit')).toBe(false)
    expect(schema.druxt.getIndex).not.toHaveBeenCalled()

    expect(await schema.getSchemaById('node--missing--default--view')).toBe(false)
  })

  test('getSchemaById - an invented or disabled mode never reaches Drupal', async () => {
    await schema.getSchemaById('node--page--default--view')
    const getCollection = jest.spyOn(schema.druxt, 'getCollection')

    for (let i = 0; i < 5; i++) {
      expect(await schema.getSchemaById(`node--page--invented_${i}--view`)).toBe(false)
    }
    expect(getCollection).not.toHaveBeenCalled()
  })

  test('get - mock error', async () => {
    const mock = {
      druxt: {
        checkPermissions: jest.fn(() => { throw new Error('Mock error') }),
        error: jest.fn((err) => { throw err }),
        getCollectionAll: jest.fn(async () => ([{}])),
        getIndex: jest.fn(() => ({})),
      }
    }
    try {
      await schema.get.call(mock)
    } catch(err) {
      expect(err.message).toBe('Mock error')
    }
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
})
