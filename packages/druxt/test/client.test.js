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

    // Instantiate client with custom axios instance.
    const axios = jest.fn()
    const client = new DruxtClient(baseUrl, { axios })
    expect(client).toBeInstanceOf(DruxtClient)
    expect(client.axios).toStrictEqual(axios)
  })

  test('debug', () => {
    const axios = jest.fn()
    axios.interceptors = {
      request: {
        use: jest.fn((callback, err) => {
          if (typeof callback === 'function') {
            callback({ url: 'test' })
          }
          if (typeof err === 'function') {
            err(new Error('test'))
          }
        })
      }
    }

    const druxt = new DruxtClient(baseUrl, { debug: true, axios })
    expect(druxt.axios.interceptors.request.use).toHaveBeenCalled()
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

    try {
      druxt.checkPermissions(res)
    } catch(err) {
      expect(err.response.data.errors[0]).toMatchSnapshot()
    }
  })

  test('createResource', async () => {
    let response
    const headers = {
      'Content-Type': 'application/vnd.api+json'
    }

    // Expect invalid resource to return false.
    expect((await druxt.createResource({}))).toBe(false)

    // Create a Feedback Contact message resource without require data.
    const data = { type: 'contact_message--feedback' }
    try {
      await druxt.createResource(data)
    } catch(err) {
      expect(err.response.data.errors[0]).toMatchSnapshot()
      expect(err.response.data.errors.length).toBe(2)
    }
    expect(mockAxios.post).toHaveBeenCalledWith(
      `${baseUrl}/en/jsonapi/contact_message/feedback`,
      { data },
      { headers }
    )
    mockAxios.reset()

    // Create resource with required data.
    data.attributes = {
      subject: 'Subject',
      message: 'Test'
    }
    response = await druxt.createResource(data)
    expect(mockAxios.post).toHaveBeenCalledWith(
      `${baseUrl}/en/jsonapi/contact_message/feedback`,
      { data },
      { headers }
    )
    expect(response.errors).toBe(undefined)
    expect(response.status).toBe(200)
    expect(response.data.data.attributes.subject).toBe(data.attributes.subject)
    expect(response.data.data.attributes.message).toBe(data.attributes.message)
    mockAxios.reset()

    // Update resource.
    try {
      await druxt.createResource(response.data.data)
    } catch(err) {
      expect(mockAxios.patch).toHaveBeenCalledWith(
        `${baseUrl}/en/jsonapi/contact_message/feedback/${response.data.data.id}`,
        { data: response.data.data },
        { headers }
      )
    }
  })

  test('error', () => {
    let mockErr
    const url = [baseUrl, 'test/error'].join('/')

    // Test basic error.
    mockErr = new Error('Test error')
    try {
      druxt.error(mockErr)
    } catch(err) {
      expect(err.message).toMatchSnapshot()
    }

    // Test Axios error.
    mockErr = {
      response: {
        config: { url },
        status: '500',
        statusText: 'Test error'
      }
    }
    try {
      druxt.error(mockErr)
    } catch(err) {
      expect(err.message).toMatchSnapshot()
    }

    // Test error with URL context and details.
    mockErr = {
      response: {
        status: '500',
        statusText: 'Test error',
        data: {
          errors: [{
            detail: 'Test error details.'
          }]
        }
      }
    }
    try {
      druxt.error(mockErr, { url })
    } catch(err) {
      expect(err.message).toMatchSnapshot()
    }
  })

  test('getCollection', async () => {
    // Get a collection of 'node--page' resources.
    const collection = await druxt.getCollection('node--page')
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/page`, undefined)
    expect(collection.data.length).toBe(1)

    // Get a filtered collection of 'node--page' resources.
    await druxt.getCollection('node--page', { 'filter[status]': 1 })
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/page?filter%5Bstatus%5D=1`, undefined)

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
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe?page%5Boffset%5D=5&page%5Blimit%5D=5&fields%5Bnode--recipe%5D=`, undefined)
  })

  test('getIndex', async () => {
    const index = await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi', undefined)

    expect(Object.keys(index).length).toBe(64)
    expect(index[Object.keys(index)[0]]).toHaveProperty('href')

    const cachedIndex = await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    expect(Object.keys(cachedIndex).length).toBe(64)

    // Simulate broken index.
    delete druxt.index
    druxt.get = () => ({ data: {} })
    try {
      await druxt.getIndex()
    } catch(err) {
      expect(err.response).toMatchSnapshot()
    }
  })

  test('getIndex - resource', async () => {
    const resourceIndex = await druxt.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi', undefined)

    expect(resourceIndex).toHaveProperty('href')

    const cachedResourceIndex = await druxt.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    expect(cachedResourceIndex).toHaveProperty('href')
  })

  test('getRelated', async () => {
    expect((await druxt.getRelated())).toBe(false)

    const mockArticle = await getMockResource('node--article')

    const { type, id } = mockArticle.data
    const related = await druxt.getRelated(type, id, 'field_media_image')
    expect(mockAxios.get).toHaveBeenCalledWith(`${baseUrl}/en/jsonapi/node/article/${id}/field_media_image`, undefined)
    expect(related.data).toHaveProperty('type')

    try {
      await druxt.getRelated('node--fake', id, 'field_media_image')
    } catch(err) {
      expect(mockAxios.get).toHaveBeenCalledWith(`/jsonapi/node/fake/${id}/field_media_image`, undefined)
    }
  })

  test('getResource', async () => {
    const mockArticle = await getMockResource('node--article')
    const entity = await druxt.getResource(mockArticle.data.type, mockArticle.data.id)
    expect(entity.data).toHaveProperty('type', mockArticle.data.type)

    try {
      await druxt.getResource('node--article', 'missing')
    } catch(err) {
      expect(err.response.data.errors[0]).toMatchSnapshot()
    }
    expect(mockAxios.get).toHaveBeenCalledWith(`${baseUrl}/en/jsonapi/node/article/missing`, undefined)

    const empty = await druxt.getResource()
    expect(empty).toBe(false)
  })

  test('updateResource', async () => {
    expect((await druxt.updateResource({}))).toBe(false)
  })
})
