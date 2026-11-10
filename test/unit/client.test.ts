import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { getMockResource } from 'druxt-test-utils'
import mockAxios from 'jest-mock-axios'

import { DruxtClient } from '../src/client'

const baseUrl = 'https://api.umami.demo.druxtjs.org'

jest.mock('axios')

let druxt

describe('DruxtClient', () => {
  beforeEach(() => {
    mockAxios.reset()
    druxt = new DruxtClient(baseUrl)
    // Reset the shared JSON:API index cache.
    Object.keys(druxt.index).forEach((key) => delete druxt.index[key])
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

    // A nested object uses bracket notation, as Drupal's JSON:API expects.
    expect(druxt.buildQueryUrl('url', { filter: { drupal_internal__format: 'basic_html' } }))
      .toBe('url?filter[drupal_internal__format]=basic_html')
    expect(druxt.buildQueryUrl('url', {
      filter: { status: { condition: { path: 'nid', operator: 'IN', value: [1, 2] } } },
      include: 'uid,field_tags',
    })).toBe([
      'url?filter[status][condition][path]=nid',
      'filter[status][condition][operator]=IN',
      'filter[status][condition][value][0]=1',
      'filter[status][condition][value][1]=2',
      'include=uid%2Cfield_tags',
    ].join('&'))
    expect(druxt.buildQueryUrl('url', { 'fields[node--page]': 'title', page: { limit: 5 } }))
      .toBe('url?fields%5Bnode--page%5D=title&page[limit]=5')
    expect(druxt.buildQueryUrl('url', { filter: { title: 'A & B' } })).toBe('url?filter[title]=A%20%26%20B')
    expect(druxt.buildQueryUrl('url', { page: {}, include: 'uid' })).toBe('url?include=uid')
    // A top-level array serializes as before.
    expect(druxt.buildQueryUrl('url', { include: ['uid', 'field_tags'] })).toBe('url?include=uid&include=field_tags')
    // A nested null is left out, so an `IS NULL` condition has no value.
    expect(druxt.buildQueryUrl('url', {
      filter: { empty: { condition: { path: 'field_tags', operator: 'IS NULL', value: null } } },
    })).toBe('url?filter[empty][condition][path]=field_tags&filter[empty][condition][operator]=IS%20NULL')
    expect(druxt.buildQueryUrl('url', { filter: { title: null } })).toBe('url')

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
    const headers = {
      'Content-Type': 'application/vnd.api+json'
    }

    // Expect invalid resource to return false.
    expect((await druxt.createResource({}))).toBe(false)

    // Creating a node takes an account with the permission. Signed out, the
    // write is refused with a 403 before validation runs.
    mockAxios.__signIn('author')

    // Create a node without the data it requires.
    const data = { type: 'node--page' }
    let error
    try {
      await druxt.createResource(data)
    } catch(err) {
      error = err
    }
    // Asserted outside the catch, so a create that unexpectedly succeeded
    // fails the test rather than skipping it.
    expect(error).toBeDefined()
    expect(error.response.status).toBe(422)
    const [violation] = error.response.data.errors
    expect(violation.detail).toMatchSnapshot()
    expect(violation.source.pointer).toBe('/data/attributes/title')
    // Not the reason phrase: RFC 9110 renamed 422 from "Unprocessable Entity"
    // to "Unprocessable Content", so it follows the Drupal version.
    expect(violation.status).toBe('422')
    expect(mockAxios.post).toHaveBeenCalledWith(
      `/en/jsonapi/node/page`,
      { data },
      { headers }
    )
    mockAxios.reset()

    // A resource missing several required fields reports each violation, not
    // just the first. umami's recipe has enough of them to show that; the
    // count itself belongs to the content type, so only the plural matters.
    let violations
    try {
      await druxt.createResource({ type: 'node--recipe' })
    } catch(err) {
      violations = err.response.data.errors
    }
    expect(violations.length).toBeGreaterThan(1)
    expect(violations.filter((item) => !(item.source || {}).pointer)).toStrictEqual([])
    mockAxios.reset()

    // Create resource with required data.
    data.attributes = { title: 'Test' }
    const response = await druxt.createResource(data)
    expect(mockAxios.post).toHaveBeenCalledWith(
      `/en/jsonapi/node/page`,
      { data },
      { headers }
    )
    expect(response.errors).toBe(undefined)
    expect(response.status).toBe(201)
    expect(response.data.data.attributes.title).toBe(data.attributes.title)
    mockAxios.reset()

    // A resource that already has an id is sent as an update.
    await druxt.createResource(response.data.data).catch(() => {})
    expect(mockAxios.patch).toHaveBeenCalledWith(
      `/en/jsonapi/node/page/${response.data.data.id}`,
      { data: response.data.data },
      { headers }
    )
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
    expect(mockAxios.get).toHaveBeenLastCalledWith(`/en/jsonapi/node/page`, undefined)
    expect(collection.data.length).toBe(1)

    // Get a filtered collection of 'node--page' resources.
    await druxt.getCollection('node--page', { 'filter[status]': 1 })
    expect(mockAxios.get).toHaveBeenLastCalledWith(`/en/jsonapi/node/page?filter%5Bstatus%5D=1`, undefined)

    // Get a collection with headers set.
    // await druxt.getCollection('node--page', {}, { headers: { 'X-Druxt': true }})
    // expect(druxt.axios.defaults.headers.common['X-Druxt']).toBe(true)

    // Get collection of nothing.
    const noResource = await druxt.getCollection()
    expect(noResource).toBe(false)
  })

  test('getCollectionAll', async () => {
    // Get all of the 'test--all' resources.
    const query = new DrupalJsonApiParams().addFields('node--recipe', []).addPageLimit(5)
    await druxt.getCollectionAll('node--recipe', query)
    expect(mockAxios.get).toHaveBeenLastCalledWith(`/en/jsonapi/node/recipe?page%5Boffset%5D=5&page%5Blimit%5D=5&fields%5Bnode--recipe%5D=`, undefined)
  })

  test('getIndex', async () => {
    const index = await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi', undefined)

    // A total is a magic number that moves with the backend. The index is the
    // endpoint's own links with the base URL stripped, so the source says what
    // belongs in it.
    // Reading it from the call the client already made keeps the call count
    // above true. A shape check alone would pass a truncated index.
    const { data } = await mockAxios.get.mock.results[0].value
    expect(Object.keys(index)).toStrictEqual(Object.keys(data.links))
    expect(Object.values(index).filter((entry) => typeof entry.href !== 'string')).toStrictEqual([])

    // The cached call hands back the stored object itself, so the keys have to
    // be taken now. Comparing the two returned values after the second call
    // reads one object twice, and passes whatever the call did to it.
    const keys = Object.keys(index)

    const cachedIndex = await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    // The cached call has to return the same index, not one the same size.
    expect(Object.keys(cachedIndex)).toStrictEqual(keys)

    // Simulate broken index.
    delete druxt.index
    druxt.get = () => ({ data: {} })
    try {
      await druxt.getIndex()
    } catch(err) {
      expect(err.response).toMatchSnapshot()
    }
  })

  test('getIndex - strips the positional base URL', async () => {
    const client = new DruxtClient(`${baseUrl}/`)
    expect(client.options.baseUrl).toBe(baseUrl)

    const resourceIndex = await client.getIndex('node--page')
    expect(resourceIndex.href).toBe('/en/jsonapi/node/page')

    // An explicit `baseUrl` option still wins.
    expect(new DruxtClient(baseUrl, { baseUrl: 'https://example.com' }).options.baseUrl).toBe('https://example.com')
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

  test('getIndex - shared between clients', async () => {
    const clientB = new DruxtClient(baseUrl)

    await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    // Both clients end up holding the one cached object, so the copy to
    // compare against has to be taken before the second client asks for it.
    const shared = { ...druxt.index[undefined] }

    // A second client with the same base URL reuses the cached index.
    await clientB.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(clientB.index[undefined]).toStrictEqual(shared)

    // A client with a different base URL fetches its own index.
    const clientC = new DruxtClient('https://other.example.com')
    await clientC.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)

    // A client with a different resource config decorates its own index.
    const clientD = new DruxtClient(baseUrl, { jsonapiResourceConfig: 'other--config' })
    await clientD.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
  })

  test('getIndex - not shared across Axios instances', async () => {
    await druxt.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    // Another Axios instance carries its own credentials, so its client
    // fetches its own index rather than reusing the shared one.
    const sharedBefore = { ...druxt.index[undefined] }

    const ownAxios = jest.fn()
    ownAxios.get = jest.fn(async () => ({ data: { links: { 'node--page': { href: `${baseUrl}/jsonapi/node/page` } } } }))
    const clientE = new DruxtClient(baseUrl, { axios: ownAxios })
    const index = await clientE.getIndex()
    expect(ownAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(Object.keys(index)).toStrictEqual(['node--page'])
    // The shared index is untouched by the other instance's own one. Comparing
    // it with the copy taken above says that, where a count or a difference
    // from the other index would also pass had entries been dropped.
    expect(druxt.index[undefined]).toStrictEqual(sharedBefore)
  })

  test('getIndex - concurrent requests share one fetch', async () => {
    const clientB = new DruxtClient(baseUrl)

    await Promise.all([druxt.getIndex(), clientB.getIndex(), druxt.getIndex()])
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    // The clients share the one object, so the other client's index is not an
    // independent source. The response the fetch returned is.
    const { data } = await mockAxios.get.mock.results[0].value
    expect(Object.keys(clientB.index[undefined])).toStrictEqual(Object.keys(data.links))
  })

  test('getRelated', async () => {
    expect((await druxt.getRelated())).toBe(false)

    const mockArticle = await getMockResource('node--article')

    const { type, id } = mockArticle.data
    const related = await druxt.getRelated(type, id, 'field_media_image')
    expect(mockAxios.get).toHaveBeenCalledWith(`/en/jsonapi/node/article/${id}/field_media_image`, undefined)
    expect(related.data).toHaveProperty('type')

    try {
      await druxt.getRelated('node--fake', id, 'field_media_image')
    } catch(err) {
      expect(mockAxios.get).toHaveBeenCalledWith(`/jsonapi/node/fake/${id}/field_media_image`, undefined)
    }
  })

  test('getResource and getRelated keep the prefix for a type the index does not list', async () => {
    // A Views resource is never in the index, so the URL is built from the type.
    druxt.index.es = {}
    druxt.index[undefined] = {}
    druxt.get = jest.fn(async () => ({ data: {} }))

    await druxt.getResource('views--recipes', 'block', undefined, 'es')
    await druxt.getRelated('views--recipes', 'block', 'field', undefined, 'es')
    await druxt.getResource('views--recipes', 'block')
    druxt.index['/es'] = {}
    await druxt.getResource('views--recipes', 'block', undefined, '/es')
    expect(druxt.get.mock.calls.map(([url]) => url)).toStrictEqual([
      '/es/jsonapi/views/recipes/block',
      '/es/jsonapi/views/recipes/block/field',
      '/jsonapi/views/recipes/block',
      '/es/jsonapi/views/recipes/block',
    ])
  })

  test('an endpoint given without a leading slash still joins the prefix', async () => {
    const client = new DruxtClient(baseUrl, { endpoint: 'api' })
    expect(client.options.endpoint).toBe('/api')

    client.index.es = {}
    client.get = jest.fn(async () => ({ data: {} }))
    await client.getResource('views--recipes', 'block', undefined, 'es')
    expect(client.get.mock.calls[0][0]).toBe('/es/api/views/recipes/block')
  })

  test('getResource', async () => {
    const mockArticle = await getMockResource('node--article')
    const entity = await druxt.getResource(mockArticle.data.type, mockArticle.data.id)
    expect(entity.data).toHaveProperty('type', mockArticle.data.type)

    try {
      await druxt.getResource('node--article', 'missing')
    } catch(err) {
      const [error] = err.response.data.errors
      // Drupal's own wording for a parameter it could not convert, and a link
      // back to the request. A snapshot of the whole error also pinned the RFC
      // link in `links.info`, which moves with the Drupal version.
      expect(error.detail).toMatchSnapshot()
      expect(error.links.via.href).toBe(`${baseUrl}/en/jsonapi/node/article/missing`)
    }
    expect(mockAxios.get).toHaveBeenCalledWith(`/en/jsonapi/node/article/missing`, undefined)

    const empty = await druxt.getResource()
    expect(empty).toBe(false)
  })

  test('updateResource', async () => {
    expect((await druxt.updateResource({}))).toBe(false)
  })
})
