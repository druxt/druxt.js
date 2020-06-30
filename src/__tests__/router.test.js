import mockAxios from 'jest-mock-axios'

import { DruxtRouter } from '..'

const baseURL = 'https://example.com'

const testArticle = { type: 'node--article', id: '98f36405-e1c4-4d8a-a9f9-4d4f6d414e96' }
const testPage = { type: 'node--page', id: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9' }

let router

jest.mock('axios')

describe('DruxtRouter', () => {
  beforeEach(() => {
    mockAxios.reset()
    router = new DruxtRouter(baseURL, {})
  })

  test('constructor', () => {
    // Throw error if 'baseURL' not provided.
    expect(() => { return new DruxtRouter() }).toThrow('The \'baseURL\' parameter is required.')

    // Ensure class type.
    expect(new DruxtRouter(baseURL)).toBeInstanceOf(DruxtRouter)
  })

  test('axiosSettings', () => {
    const headers = { 'X-DruxtRouter': true }
    const mockRouter = new DruxtRouter(baseURL, {
      axios: { headers }
    })
    expect(mockRouter).toBeInstanceOf(DruxtRouter)

    expect(mockAxios.create).toHaveBeenCalledWith({ baseURL, headers })
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
    expect(() => router.checkPermissions(res)).toThrow('Some resources have been omitted because of insufficient authorization.\n\n Required permissions: administer node fields.')
  })

  test('get - entity', async () => {
    const { route } = await router.get('/')

    expect(route.component).toBe('druxt-entity')
    expect(route.type).toBe('entity')
    expect(route.props).toHaveProperty('type')
    expect(route.props).toHaveProperty('uuid')
  })

  test('get - views', async () => {
    const { route } = await router.get('/view')

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

  test('getIndex', async () => {
    const index = await router.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi')

    expect(Object.keys(index).length).toBe(53)
    expect(index[Object.keys(index)[0]]).toHaveProperty('href')

    const cachedIndex = await router.getIndex()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)

    expect(Object.keys(cachedIndex).length).toBe(53)
  })

  test('getIndex - resource', async () => {
    const resourceIndex = await router.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi')

    expect(resourceIndex).toHaveProperty('href')

    const cachedResourceIndex = await router.getIndex('node--page')
    expect(mockAxios.get).toHaveBeenCalledTimes(2)

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
  })

  test('getResource', async () => {
    const entity = await router.getResource(testArticle)
    expect(entity).toHaveProperty('type', testArticle.type)

    await router.getResource({ id: 'test', type: 'missing' })
    expect(mockAxios.get).toHaveBeenCalledWith('/jsonapi/missing/test')

    const empty = await router.getResource()
    expect(empty).toBe(false)
  })

  test('getResource', async () => {
    const resources = await router.getResources('node--page')
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/page')
    expect(resources.length).toBe(1)

    await router.getResources('node--page', { 'filter[status]': 1 })
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/page?filter%5Bstatus%5D=1')

    const noResource = await router.getResources()
    expect(noResource).toBe(false)
  })

  test('getResourceByRoute', async () => {
    const route = require('../__fixtures__/data/0a01adaa07e9dfcc3c0cabc37339505a.json')
    const entity = await router.getResourceByRoute(route)

    expect(entity).toHaveProperty('id', testPage.id)
    expect(entity).toHaveProperty('type', testPage.type)
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
