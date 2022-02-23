import { createLocalVue } from '@vue/test-utils'
import axios from 'axios'
import mockAxios from 'jest-mock-axios'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { baseUrl, getMockResource, getMockRoute } from '../../../test-utils/src'
import { DruxtRouter, DruxtRouterStore } from '../../src'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

describe('DruxtRouterStore', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    DruxtStore({ store })
    DruxtRouterStore({ store })

    store.$druxt = new DruxtClient(baseUrl, { axios })
    store.$druxtRouter = () => new DruxtRouter(baseUrl, { axios })

    store.app = { context: { error: jest.fn() }, store }
  })

  test('init', () => {
    expect(() => { DruxtRouterStore({}) }).toThrow('Vuex store not found.')
  })

  test('addEntity', async () => {
    const mockPage = await getMockResource('node--page')
    const mockRecipe = await getMockResource('node--recipe')

    // Ensure that the entities state is empty.
    expect(store.state.druxtRouter.entities).toStrictEqual({})

    // Ensure that bad data does not get committed to state.
    store.commit('druxtRouter/addEntity', {})
    expect(store.state.druxtRouter.entities).toStrictEqual({})

    // Ensure that good data is committed to state.
    store.commit('druxtRouter/addEntity', mockPage.data)
    expect(store.state.druxtRouter.entities[mockPage.data.id]).toBe(mockPage.data)
    expect(Object.keys(store.state.druxtRouter.entities)).toHaveLength(1)

    store.commit('druxtRouter/addEntity', mockRecipe.data)
    expect(store.state.druxtRouter.entities[mockRecipe.data.id]).toBe(mockRecipe.data)
    expect(Object.keys(store.state.druxtRouter.entities)).toHaveLength(2)
  })

  test('addRoute', async () => {
    const mockRoute = await getMockRoute('/')

    // Ensure that the routes state is empty.
    expect(store.state.druxtRouter.routes).toStrictEqual({})

    // Ensure that bad data does not get committed to state.
    store.commit('druxtRouter/addRoute', {})
    expect(store.state.druxtRouter.routes).toStrictEqual({})

    // Ensure that good data is committed to state.
    store.commit('druxtRouter/addRoute', { path: '/', route: mockRoute })
    expect(store.state.druxtRouter.routes['/']).toBe(mockRoute)
    expect(Object.keys(store.state.druxtRouter.routes)).toHaveLength(1)

    store.commit('druxtRouter/addRoute', { path: '/', route: mockRoute })
    expect(store.state.druxtRouter.routes['/']).toBe(mockRoute)
    expect(Object.keys(store.state.druxtRouter.routes)).toHaveLength(1)
  })

  test('setRoute', async () => {
    const mockRoutes = await Promise.all([
      await getMockRoute('/'),
      await getMockRoute('/node/1'),
    ])

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
    store.commit('druxtRouter/addRoute', { path: '/', route: mockRoutes[0] })
    store.commit('druxtRouter/setRoute', '/')
    expect(store.state.druxtRouter.route).toStrictEqual(mockRoutes[0])

    store.commit('druxtRouter/addRoute', { path: '/node/1', route: mockRoutes[1] })
    store.commit('druxtRouter/setRoute', '/node/1')
    expect(store.state.druxtRouter.route).toStrictEqual(mockRoutes[1])
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
    expect(store.app.context.error).toHaveBeenCalledWith({ message: 'Unable to resolve path /error.', statusCode: 404 })
  })

  test('getEntity', async () => {
    const mockPage = await getMockResource('node--page')

    const entity = await store.dispatch('druxtRouter/getEntity', mockPage.data)

    expect(entity).toHaveProperty('attributes')

    await store.dispatch('druxtRouter/getEntity', mockPage.data)
  })

  test('getResources', async () => {
    const resources = await store.dispatch('druxtRouter/getResources', { resource: 'node--page', query: {} })
    expect(resources.length).toBe(1)
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
