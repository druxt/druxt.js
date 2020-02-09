import axios from 'axios'
import DruxtRouter from '..'

import mockResources from '../__fixtures__/resources'
import mockRoutes from '../__fixtures__/routes'

const baseURL = 'https://example.com'

jest.mock('axios')
axios.create.mockReturnValue({
  get: url => {
    if (url.split('/')[1] === 'router') {
      return { data: mockRoutes[url.split('?path=')[1]] }
    }
    else if (typeof mockResources[url] !== 'undefined') {
      return { data: { data: mockResources[url] } }
    }
    throw new Error(`Unable to process mock request for ${url}`)
  }
})

const router = new DruxtRouter(baseURL, {
  schema: () => {
    return {}
  }
})

describe('DruxtRouter', () => {
  test('constructor', () => {
    // Throw error if 'baseURL' not provided.
    expect(() => { new DruxtRouter() }).toThrow('The \'baseURL\' parameter is required.')

    // Ensure class type.
    expect(new DruxtRouter(baseURL)).toBeInstanceOf(DruxtRouter)
  })

  test('get', async () => {
    const result = await router.get('/')

    expect(result).toHaveProperty('entity')
    expect(result).toHaveProperty('route')

    expect(result.entity.data).toHaveProperty('id', '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9')
    expect(result.entity.data).toHaveProperty('type', 'node--page')
  })

  test('getResource', async () => {
    const entity = await router.getResource('node--article', '98f36405-e1c4-4d8a-a9f9-4d4f6d414e96')

    expect(entity.data).toHaveProperty('type', 'node--article')
  })

  test('getResourceByRoute', async () => {
    const route = mockRoutes['/']
    const entity = await router.getResourceByRoute(route)

    expect(entity.data).toHaveProperty('id', '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9')
    expect(entity.data).toHaveProperty('type', 'node--page')
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

  test('getSchemaByEntity', () => {
    const testRouter = new DruxtRouter(baseURL)
    const result = testRouter.getSchemaByEntity('node', 'page')

    expect(result).toStrictEqual({})
  })

})
