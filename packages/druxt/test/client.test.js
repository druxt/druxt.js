import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { getMockResource } from 'druxt-test-utils'
import mockAxios from 'jest-mock-axios'

import { DruxtClient } from '../src/client'

const baseUrl = 'https://demo-api.druxtjs.org'

jest.mock('axios')

let druxt

describe('DruxtClient', () => {
  beforeEach(() => {
    mockAxios.reset()
    druxt = new DruxtClient(baseUrl)
  })

  test('constructor', () => {
    // Instantiate client without baseUrl.
    expect(() => { return new DruxtClient() }).toThrow('The \'baseUrl\' parameter is required.')

    // Instantiate client with required parameters.
    expect(new DruxtClient(baseUrl)).toBeInstanceOf(DruxtClient)
    expect(mockAxios.create).toHaveBeenCalledWith({ baseURL: baseUrl })

    // Instantiate client with axios headers.
    const headers = { 'X-Druxt': true }
    expect(new DruxtClient(baseUrl, { axios: { headers } })).toBeInstanceOf(DruxtClient)
    expect(mockAxios.create).toHaveBeenCalledWith({ baseURL: baseUrl, headers })
  })

  test('addHeaders', () => {
    expect(druxt.addHeaders()).toBe(false)

    druxt.addHeaders({ 'X-Druxt': true })
    expect(druxt.axios.defaults.headers.common['X-Druxt']).toBe(true)
  })

  test('buildQueryUrl', () => {
    expect(druxt.buildQueryUrl('url', 'query')).toBe('url?query')
    expect(druxt.buildQueryUrl('url', '?query')).toBe('url?query')
    expect(druxt.buildQueryUrl('url', { getQueryString: () => 'query' })).toBe('url?query')
    expect(druxt.buildQueryUrl('url', { query: 'string' })).toBe('url?query=string')

    expect(druxt.buildQueryUrl('url', {})).toBe('url')
    expect(druxt.buildQueryUrl('url', [])).toBe('url')
    expect(druxt.buildQueryUrl('url', Boolean)).toBe('url')
    expect(druxt.buildQueryUrl('url')).toBe('url')
  })

  test('checkPermissions', () => {
    const res = {
      data: {
        meta: {
          omitted: {
            detail: 'Some resources have been omitted because of insufficient authorization.',
            links: {
              help: null,
              item: {
                meta: {
                  detail: 'The current user is not allowed to GET the selected resource. The \'administer node fields\' permission is required.'
                }
              }
            }
          }
        }
      }
    }
    expect(() => druxt.checkPermissions(res)).toThrow('Some resources have been omitted because of insufficient authorization.\n\n Required permissions: administer node fields.')
  })

  test('getCollection', async () => {
    // Get a collection of 'node--page' resources.
    const collection = await druxt.getCollection('node--page')
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/page`)
    expect(collection.data.length).toBe(1)

    // Get a filtered collection of 'node--page' resources.
    await druxt.getCollection('node--page', { 'filter[status]': 1 })
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/page?filter%5Bstatus%5D=1`)

    // Get a collection with headers set.
    await druxt.getCollection('node--page', {}, { headers: { 'X-Druxt': true }})
    expect(druxt.axios.defaults.headers.common['X-Druxt']).toBe(true)

    // Get collection of nothing.
    const noResource = await druxt.getCollection()
    expect(noResource).toBe(false)
  })

  test('getCollectionAll', async () => {
    // Get all of the 'test--all' resources.
    const query = new DrupalJsonApiParams().addFields('node--recipe', []).addPageLimit(5)
    await druxt.getCollectionAll('node--recipe', query)
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe?page%5Boffset%5D=5&page%5Blimit%5D=5&fields%5Bnode--recipe%5D=`)
  })

  test('getIndex', async () => {
    const index = await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi')

    expect(Object.keys(index).length).toBe(64)
    expect(index[Object.keys(index)[0]]).toHaveProperty('href')

    const cachedIndex = await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    expect(Object.keys(cachedIndex).length).toBe(64)
  })

  test('getIndex - resource', async () => {
    const resourceIndex = await druxt.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi')

    expect(resourceIndex).toHaveProperty('href')

    const cachedResourceIndex = await druxt.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    expect(cachedResourceIndex).toHaveProperty('href')
  })

  test('getResource', async () => {
    const mockArticle = await getMockResource('node--article')
    const entity = await druxt.getResource(mockArticle.data.type, mockArticle.data.id)
    expect(entity.data).toHaveProperty('type', mockArticle.data.type)

    const error = await druxt.getResource('missing', 'test')
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi/missing/test')
    expect(error).toBe(false)

    const empty = await druxt.getResource()
    expect(empty).toBe(false)
  })
})
