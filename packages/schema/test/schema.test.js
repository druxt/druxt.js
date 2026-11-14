import axios from 'axios'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

import { DruxtSchema } from '../src'

jest.mock('axios')

const baseUrl = 'https://api.umami.demo.druxtjs.org'
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

    // Not a total: the number of schemas moves with the site's display modes.
    // Nor a named type, which moves with the site too. Each schema has a
    // resource type of the shape the client builds its requests from.
    expect(Object.keys(schemas).length).toBeGreaterThan(0)
    expect(Object.values(schemas).filter((s) => !/^[a-z0-9_]+--[a-z0-9_]+$/.test(s.resourceType))).toStrictEqual([])

    expect(Object.values(schemas)[0]).toHaveProperty('id')
    expect(Object.values(schemas)[0]).toHaveProperty('resourceType')

    expect(Object.values(schemas)[0].config).toHaveProperty('entityType')
    expect(Object.values(schemas)[0].config).toHaveProperty('bundle')
    expect(Object.values(schemas)[0].config).toHaveProperty('mode')
    expect(Object.values(schemas)[0].config).toHaveProperty('schemaType')

    expect(schemas).toMatchSnapshot()
  })

  describe('a site that answers 500 past the first page of a config collection', () => {
    // Drupal Canvas 1.12.0 does: its config entity query takes JSON:API's page
    // offset as a string under strict types. This site has one more page of
    // displays than it can serve, and more than one page of node displays.
    const pagedSite = ({ pagedBundle } = {}) => {
      const real = schema.druxt.getCollection.bind(schema.druxt)
      const requests = []
      jest.spyOn(schema.druxt, 'getCollection').mockImplementation(async (type, query, ...rest) => {
        const q = decodeURIComponent(typeof query === 'string' ? query : new DrupalJsonApiParams().initialize(query).getQueryString())
        // Only the listing of every display, the way the schema build reads it.
        const listing = /^sort=drupal_internal__id(&|$)/.test(q) ||
          q.includes('page[offset]') || q.includes('filter[targetEntityType]')
        if (!/^entity_(view|form)_display--/.test(type) || !listing) return real(type, query, ...rest)
        requests.push(q)
        if (q.includes('page[offset]')) {
          const error = new Error('500: Internal Server Error')
          error.response = { status: 500 }
          throw error
        }

        const entityType = (/filter\[targetEntityType\]=([^&]+)/.exec(q) || [])[1]
        const bundle = (/filter\[bundle\]=([^&]+)/.exec(q) || [])[1]
        const res = await real(type, new DrupalJsonApiParams().addSort('drupal_internal__id'), ...rest)
        // Drupal's next link keeps the request's filters and sort.
        const next = { next: { href: `${baseUrl}/jsonapi/${type.replace('--', '/')}?${q}&page[offset]=50` } }
        if (!entityType) return { ...res, links: { ...res.links, ...next } }

        const data = res.data.filter((display) =>
          display.attributes.targetEntityType === entityType &&
          (!bundle || display.attributes.bundle === bundle))
        const paged = entityType === 'node' && (!bundle || bundle === pagedBundle)
        return { ...res, data, links: paged ? next : {} }
      })
      return requests
    }

    test('builds the same schemas, with no other request carrying an offset', async () => {
      const { schemas: expected } = await schema.get()
      schema = new DruxtSchema(baseUrl, options)
      const requests = pagedSite()

      const { schemas } = await schema.get()

      expect(schemas).toStrictEqual(expected)
      // One failed page per kind of display.
      expect(requests.filter((q) => q.includes('page[offset]'))).toHaveLength(2)
      // Node displays were read by bundle.
      expect(requests.some((q) => q.includes('filter[targetEntityType]=node') && q.includes('filter[bundle]=page'))).toBe(true)
    })

    test('fails, rather than leave displays out, when one bundle has more than a page', async () => {
      const requests = pagedSite({ pagedBundle: 'page' })

      await expect(schema.get()).rejects.toThrow('500')
      // The bundle's next page was asked for.
      expect(requests.some((q) => q.includes('filter[bundle]=page') && q.includes('page[offset]'))).toBe(true)
    })

    test('still fails when the first page fails', async () => {
      jest.spyOn(schema.druxt, 'getCollection').mockRejectedValue(new Error('403: Forbidden'))

      await expect(schema.get()).rejects.toThrow('403: Forbidden')
    })
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
      },
    }
    mock.getDisplays = schema.getDisplays.bind(mock)
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

  test('getSchema - a bundle with no display', async () => {
    expect(await schema.getSchema({ entityType: 'node', bundle: 'page', mode: 'missing' })).toBe(false)
  })
})
