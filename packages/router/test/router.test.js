import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import mockAxios from 'jest-mock-axios'

import { baseUrl, getMockResource, getMockRoute } from '../../test-utils/src'
import { DruxtRouter } from '../src'

let router

jest.mock('axios')

describe('DruxtRouter', () => {
  beforeEach(() => {
    mockAxios.reset()
    router = new DruxtRouter(baseUrl, {})
  })

  test('constructor', () => {
    // Throw error if 'baseUrl' not provided.
    expect(() => { return new DruxtRouter() }).toThrow('The \'baseUrl\' parameter is required.')

    // Ensure class type.
    expect(new DruxtRouter(baseUrl)).toBeInstanceOf(DruxtRouter)
  })

  // @deprecated
  // TODO : Investigate and fix test.
  // test('constructor - axiosSettings', () => {
  //   const headers = { 'X-DruxtRouter': true }
  //   const mockRouter = new DruxtRouter(baseUrl, {
  //     axios: { headers }
  //   })
  //   expect(mockRouter).toBeInstanceOf(DruxtRouter)

  //   expect(mockAxios.create).toHaveBeenCalledWith({ baseUrl, headers })
  // })

  // @deprecated
  test('addHeaders', () => {
    expect(router.addHeaders()).toBe(false)

    router.addHeaders({ 'X-DruxtRouter': true })
    expect(router.axios.defaults.headers.common['X-DruxtRouter']).toBe(true)
  })

  // @deprecated
  test('buildQueryUrl', () => {
    expect(router.buildQueryUrl('url', 'query')).toBe('url?query')
    expect(router.buildQueryUrl('url', '?query')).toBe('url?query')
    expect(router.buildQueryUrl('url', { getQueryString: () => 'query' })).toBe('url?query')
    expect(router.buildQueryUrl('url', { query: 'string' })).toBe('url?query=string')

    expect(router.buildQueryUrl('url', {})).toBe('url')
    expect(router.buildQueryUrl('url', [])).toBe('url')
    expect(router.buildQueryUrl('url', Boolean)).toBe('url')
    expect(router.buildQueryUrl('url')).toBe('url')
  })

  // @deprecated
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
    expect(() => router.checkPermissions(res)).toThrow('Some resources have been omitted because of insufficient authorization.\n\n Required permissions: administer node fields.')
  })

  test('get - entity', async () => {
    const { route } = await router.get('/node/1')

    expect(route.component).toBe('druxt-entity')
    expect(route.type).toBe('entity')
    expect(route.props).toHaveProperty('type')
    expect(route.props).toHaveProperty('uuid')
  })

  test('get - views', async () => {
    const { route } = await router.get('/')

    expect(route.component).toBe('druxt-view')
    expect(route.type).toBe('views')
    expect(route.props).toHaveProperty('displayId')
    expect(route.props).toHaveProperty('type')
    expect(route.props).toHaveProperty('uuid')
    expect(route.props).toHaveProperty('viewId')
  })

  test('get - error', async () => {
    const { route } = await router.get('/error')

    expect(route.error).toHaveProperty('message')
    expect(route.error).toHaveProperty('statusCode', 404)
  })

  // @deprecated
  test('getIndex', async () => {
    const index = await router.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi')

    expect(Object.keys(index).length).toBe(64)
    expect(index[Object.keys(index)[0]]).toHaveProperty('href')

    const cachedIndex = await router.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    expect(Object.keys(cachedIndex).length).toBe(64)
  })

  // @deprecated
  test('getIndex - resource', async () => {
    const resourceIndex = await router.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi')

    expect(resourceIndex).toHaveProperty('href')

    const cachedResourceIndex = await router.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    expect(cachedResourceIndex).toHaveProperty('href')
  })

  test('getRedirect', () => {
    let redirect

    // Route provided redirect.
    redirect = router.getRedirect(null, {
      redirect: [{ to: '/' }]
    })
    expect(redirect).toBe('/')

    // Root redirect.
    redirect = router.getRedirect('/', {
      isHomePath: true
    })
    expect(redirect).toBe(false)

    redirect = router.getRedirect('/node/1', {
      isHomePath: true
    })
    expect(redirect).toBe('/')

    // Clean url redirect.
    redirect = router.getRedirect('/node/2', {
      canonical: 'https://example.com/clean-url'
    })
    expect(redirect).toBe('/clean-url')

    // No redirect.
    redirect = router.getRedirect(null, {})
    expect(redirect).toBe(false)

    // Querystring.
    redirect = router.getRedirect('/?querystring', {
      isHomePath: true
    })
    expect(redirect).toBe(false)

    redirect = router.getRedirect('/clean-url?querystring', {
      canonical: 'https://example.com/clean-url'
    })
    expect(redirect).toBe(false)
  })

  // @deprecated
  test('getResource', async () => {
    const mockPage = await getMockResource('node--page')
    const entity = await router.getResource({ type: mockPage.data.type, id: mockPage.data.id })
    expect(entity).toHaveProperty('type', mockPage.data.type)

    const error = await router.getResource({ id: 'test', type: 'missing' })
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi/missing/test')
    expect(error).toBe(false)

    const empty = await router.getResource()
    expect(empty).toBe(false)
  })

  // @deprecated
  test('getResources', async () => {
    const resources = await router.getResources('node--page')
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/page`)
    expect(resources.length).toBe(1)

    await router.getResources('node--page', { 'filter[status]': 1 })
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/page?filter%5Bstatus%5D=1`)

    const noResource = await router.getResources()
    expect(noResource).toBe(false)

    const query = new DrupalJsonApiParams().addFields('node--recipe', []).addPageLimit(5)
    await router.getResources('node--recipe', query, { all: true })
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe?page%5Boffset%5D=5&page%5Blimit%5D=5&fields%5Bnode--recipe%5D=`)
  })

  test('getResourceByRoute', async () => {
    const mockPage = await getMockResource('node--page')
    const mockRoute = await getMockRoute(`/node/${mockPage.data.attributes.drupal_internal__nid}`)
    const entity = await router.getResourceByRoute(mockRoute.data)

    expect(entity).toHaveProperty('id', mockPage.data.id)
    expect(entity).toHaveProperty('type', mockPage.data.type)
  })

  test('getRoute', async () => {
    // Get the route of the homepage.
    let route = await router.getRoute('/')

    expect(route).toHaveProperty('canonical')
    expect(route).toHaveProperty('component')
    expect(route).toHaveProperty('error')
    expect(route).toHaveProperty('isHomePath', true)
    expect(route).toHaveProperty('jsonapi')
    expect(route).toHaveProperty('label')
    expect(route).toHaveProperty('props')
    expect(route).toHaveProperty('redirect')
    expect(route).toHaveProperty('type')

    // Get the route of node/1.
    route = await router.getRoute('/node/1')

    expect(route).toHaveProperty('isHomePath', false)
  })
})
