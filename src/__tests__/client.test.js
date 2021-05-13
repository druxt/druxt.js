import mockAxios from 'jest-mock-axios'
import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtClient } from '..'

const baseUrl = 'https://demo-api.druxtjs.org'

const testArticle = { type: 'node--article', id: '98f36405-e1c4-4d8a-a9f9-4d4f6d414e96' }

jest.mock('axios')

let druxt

describe('DruxtJS Class', () => {
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

    // Instantiate client with custom axios instance.
    const axios = jest.fn()
    const client = new DruxtClient(baseUrl, { axios })
    expect(client).toBeInstanceOf(DruxtClient)
    expect(client.axios).toStrictEqual(axios)
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
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/page')
    expect(collection.data.length).toBe(1)

    // Get a filtered collection of 'node--page' resources.
    await druxt.getCollection('node--page', { 'filter[status]': 1 })
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/page?filter%5Bstatus%5D=1')

    // Get a collection with headers set.
    await druxt.getCollection('node--page', {}, { headers: { 'X-Druxt': true }})
    expect(druxt.axios.defaults.headers.common['X-Druxt']).toBe(true)

    // Get collection of nothing.
    const noResource = await druxt.getCollection()
    expect(noResource).toBe(false)
  })

  test('getCollectionAll', async () => {
    // Get all of the 'test--all' resources.
    await druxt.getCollectionAll('test--all')
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/test/all?next')
  })

  test('getIndex', async () => {
    const index = await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi')

    expect(Object.keys(index).length).toBe(54)
    expect(index[Object.keys(index)[0]]).toHaveProperty('href')

    const cachedIndex = await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)

    expect(Object.keys(cachedIndex).length).toBe(54)
  })

  test('getIndex - resource', async () => {
    const resourceIndex = await druxt.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi')

    expect(resourceIndex).toHaveProperty('href')

    const cachedResourceIndex = await druxt.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(2)

    expect(cachedResourceIndex).toHaveProperty('href')
  })

  test('getResource', async () => {
    const entity = await druxt.getResource(testArticle.type, testArticle.id)
    expect(entity.data).toHaveProperty('type', testArticle.type)

    const error = await druxt.getResource('missing', 'test')
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi/missing/test')
    expect(error).toBe(false)

    const empty = await druxt.getResource()
    expect(empty).toBe(false)
  })
})
