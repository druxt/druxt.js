import { createLocalVue } from '@vue/test-utils'
import mockAxios from 'jest-mock-axios'
import Vuex from 'vuex'

import mockResources from '../__fixtures__/resources'
import mockRoutes from '../__fixtures__/routes'

import { DruxtRouter, DruxtRouterStore } from '..'

jest.mock('axios')

// Setup mock data.
const mockArticle = mockResources['/api/node/article/98f36405-e1c4-4d8a-a9f9-4d4f6d414e96']
const mockPage = mockResources['/api/node/page/4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9']

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

describe('DruxtRouterStore', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    store.app = { context: { error: jest.fn() } }
    DruxtRouterStore({ store })

    store.$druxtRouter = () => new DruxtRouter('https://example.com')
  })

  test('init', () => {
    expect(() => { DruxtRouterStore({}) }).toThrow('Vuex store not found.')
  })

  test('addEntity', () => {
    // Ensure that the entities state is empty.
    expect(store.state.druxtRouter.entities).toStrictEqual({})

    // Ensure that bad data does not get committed to state.
    store.commit('druxtRouter/addEntity', {})
    expect(store.state.druxtRouter.entities).toStrictEqual({})

    // Ensure that good data is committed to state.
    store.commit('druxtRouter/addEntity', mockPage)
    expect(store.state.druxtRouter.entities[mockPage.id]).toBe(mockPage)
    expect(Object.keys(store.state.druxtRouter.entities)).toHaveLength(1)

    store.commit('druxtRouter/addEntity', mockArticle)
    expect(store.state.druxtRouter.entities[mockArticle.id]).toBe(mockArticle)
    expect(Object.keys(store.state.druxtRouter.entities)).toHaveLength(2)
  })

  test('addRoute', () => {
    // Ensure that the routes state is empty.
    expect(store.state.druxtRouter.routes).toStrictEqual({})

    // Ensure that bad data does not get committed to state.
    store.commit('druxtRouter/addRoute', {})
    expect(store.state.druxtRouter.routes).toStrictEqual({})

    // Ensure that good data is committed to state.
    store.commit('druxtRouter/addRoute', { path: '/', route: mockRoutes['/'] })
    expect(store.state.druxtRouter.routes['/']).toBe(mockRoutes['/'])
    expect(Object.keys(store.state.druxtRouter.routes)).toHaveLength(1)

    store.commit('druxtRouter/addRoute', { path: '/', route: mockRoutes['/'] })
    expect(store.state.druxtRouter.routes['/']).toBe(mockRoutes['/'])
    expect(Object.keys(store.state.druxtRouter.routes)).toHaveLength(1)
  })

  test('setRoute', () => {
    // Ensure that the routes and state are empty.
    expect(store.state.druxtRouter.routes).toStrictEqual({})
    expect(store.state.druxtRouter.route).toStrictEqual({})

    // Ensure that bad data does not get committed to state.
    store.commit('druxtRouter/setRoute', undefined)
    expect(store.state.druxtRouter.route).toStrictEqual({})

    // Ensure that paths without routes are not committed to state.
    store.commit('druxtRouter/setRoute', '/fail')
    expect(store.state.druxtRouter.route).toStrictEqual({})

    // Ensure that good data is committed to state.
    store.commit('druxtRouter/addRoute', { path: '/', route: mockRoutes['/'] })
    store.commit('druxtRouter/setRoute', '/')
    expect(store.state.druxtRouter.route).toStrictEqual(mockRoutes['/'])

    store.commit('druxtRouter/addRoute', { path: '/node/1', route: mockRoutes['/node/1'] })
    store.commit('druxtRouter/setRoute', '/node/1')
    expect(store.state.druxtRouter.route).toStrictEqual(mockRoutes['/node/1'])
  })

  test('get', async () => {
    const response = await store.dispatch('druxtRouter/get', '/')

    expect(response).toHaveProperty('redirect', false)
    expect(response).toHaveProperty('route')

    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    // Ensure additional requests to the same route don't trigger an additional request.
    await store.dispatch('druxtRouter/get', '/')
    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    // Test failed request.
    await store.dispatch('druxtRouter/get', '/error')
    expect(store.app.context.error).toHaveBeenCalledWith({ message: undefined, statusCode: 404 })
  })

  test('getEntity', async () => {
    const entity = await store.dispatch('druxtRouter/getEntity', mockPage)

    expect(entity).toHaveProperty('attributes')

    await store.dispatch('druxtRouter/getEntity', mockPage)
  })

  test('getRoute', async () => {
    const route = await store.dispatch('druxtRouter/getRoute', '/')

    expect(route).toHaveProperty('canonical')
    expect(route).toHaveProperty('component')
    expect(route).toHaveProperty('error')
    expect(route).toHaveProperty('isHomePath')
    expect(route).toHaveProperty('jsonapi')
    expect(route).toHaveProperty('label')
    expect(route).toHaveProperty('props')
    expect(route).toHaveProperty('redirect')
    expect(route).toHaveProperty('type')

    expect(mockAxios.get).toHaveBeenCalledTimes(1)

    // Ensure additional requests to the same route don't trigger an additional request.
    await store.dispatch('druxtRouter/getRoute', '/')
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
  })
})
