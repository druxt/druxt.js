import axios from 'axios'
import { DruxtRouter } from '..'

import mockAxios from 'jest-mock-axios'
import mockResources from '../__fixtures__/resources'
import mockRoutes from '../__fixtures__/routes'

const baseURL = 'https://example.com'

const testArticle = { type: 'node--article', id: '98f36405-e1c4-4d8a-a9f9-4d4f6d414e96' }
const testPage = { type: 'node--page', id: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9' }

jest.mock('axios')

const router = new DruxtRouter(baseURL, {})

describe('DruxtRouter', () => {
  beforeEach(() => {
    mockAxios.reset()
  })

  test('constructor', () => {
    // Throw error if 'baseURL' not provided.
    expect(() => { new DruxtRouter() }).toThrow('The \'baseURL\' parameter is required.')

    // Ensure class type.
    expect(new DruxtRouter(baseURL)).toBeInstanceOf(DruxtRouter)
  })

  test('axiosSettings', () => {
    const headers = { 'X-DruxtRouter': true }
    new DruxtRouter(baseURL, {
      axios: { headers }
    })

    expect(mockAxios.create).toHaveBeenCalledWith({ baseURL, headers })
  })

  test('get', async () => {
    const result = await router.get('/')

    expect(result).toHaveProperty('entity')
    expect(result).toHaveProperty('route')

    expect(result.entity).toHaveProperty('id', testPage.id)
    expect(result.entity).toHaveProperty('type', testPage.type)
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
      resolved: 'https://example.com/clean-url'
    })
    expect(redirect).toBe('/clean-url')
  })

  test('getResource', async () => {
    const entity = await router.getResource(testArticle)

    expect(entity).toHaveProperty('type', testArticle.type)
  })

  test('getResourceByRoute', async () => {
    const route = mockRoutes['/']
    const entity = await router.getResourceByRoute(route)

    expect(entity).toHaveProperty('id', testPage.id)
    expect(entity).toHaveProperty('type', testPage.type)
  })

  test('getRoute', async () => {
    // Get the route of the homepage.
    let result = await router.getRoute('/')
    expect(result).toHaveProperty('entity')
    expect(result).toHaveProperty('isHomePath', true)
    expect(result).toHaveProperty('jsonapi')

    // Get the route of node/1.
    result = await router.getRoute('/node/1')
    expect(result).toHaveProperty('isHomePath', false)
  })

  test('preprocessEntity', async () => {
    router.setOptions({ preprocessEntity: resp => resp })
    const entity = await router.getResource(testArticle)
    expect(entity).toHaveProperty('_raw')
  })
})
