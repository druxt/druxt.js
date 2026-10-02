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

    // Test failed request. The error is returned for the middleware to render.
    const failed = await store.dispatch('druxtRouter/get', '/error')
    expect(failed.error).toStrictEqual({ message: 'Unable to resolve path /error.', statusCode: 404 })
    expect(failed.route).toHaveProperty('error')
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

  test('getRoute - a failure without a 4xx is not stored', async () => {
    const getRoute = jest.fn()
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
      .mockRejectedValueOnce({ message: 'Bad gateway', response: { status: 502, data: {} } })
      .mockResolvedValue({ type: 'entity', props: {} })
    store.$druxtRouter = () => ({ getRoute })

    expect((await store.dispatch('druxtRouter/getRoute', '/about')).error.statusCode).toBe(500)
    expect((await store.dispatch('druxtRouter/getRoute', '/about')).error.statusCode).toBe(502)
    expect(await store.dispatch('druxtRouter/getRoute', '/about')).toStrictEqual({ type: 'entity', props: {} })
    expect(getRoute).toHaveBeenCalledTimes(3)
  })

  test('getRoute - a 4xx is stored', async () => {
    const getRoute = jest.fn().mockRejectedValue({ message: 'Not found', response: { status: 404, data: { message: 'Not found' } } })
    store.$druxtRouter = () => ({ getRoute })

    expect((await store.dispatch('druxtRouter/getRoute', '/missing')).error.statusCode).toBe(404)
    await store.dispatch('druxtRouter/getRoute', '/missing')
    expect(getRoute).toHaveBeenCalledTimes(1)
  })

  test('getRoute - a flush during the request drops the route, and the next call fetches again', async () => {
    const pending = []
    const getRoute = jest.fn(() => new Promise((resolve) => pending.push(resolve)))
    store.$druxtRouter = () => ({ getRoute })

    const before = store.dispatch('druxtRouter/getRoute', '/about')
    await Promise.resolve()
    store.commit('druxtRouter/flushRoutes')

    // The caller gets its route, and nothing is stored.
    pending[0]({ type: 'entity', props: {} })
    expect(await before).toStrictEqual({ type: 'entity', props: {} })
    expect(store.state.druxtRouter.routes).toStrictEqual({})

    // A call after the flush fetches and stores.
    const after = store.dispatch('druxtRouter/getRoute', '/about')
    await Promise.resolve()
    pending[1]({ type: 'entity', props: { fresh: true } })
    await after
    expect(store.state.druxtRouter.routes['/about'].props.fresh).toBe(true)
    expect(getRoute).toHaveBeenCalledTimes(2)
  })

  test('get - a flush during the request still sets the active route', async () => {
    const pending = []
    const getRoute = jest.fn(() => new Promise((resolve) => pending.push(resolve)))
    store.$druxtRouter = () => ({ getRoute, getRedirect: () => false })

    // An earlier route is active, so a stale value is visible if the fresh one
    // is not set.
    store.commit('druxtRouter/addRoute', { path: '/old', route: { type: 'entity', label: 'Old' } })
    store.commit('druxtRouter/setRoute', '/old')

    const request = store.dispatch('druxtRouter/get', '/about')
    await Promise.resolve()
    store.commit('druxtRouter/flushRoutes')

    pending[0]({ type: 'entity', label: 'About', props: {} })
    const { route } = await request

    // The route is not cached, because it was fetched before the flush.
    expect(store.state.druxtRouter.routes['/about']).toBeUndefined()

    // The active route is the one that was fetched, not the previous one.
    expect(route.label).toBe('About')
    expect(store.state.druxtRouter.route.label).toBe('About')
  })

  test('setRoute - a route object sets the active route without the cache', () => {
    expect(store.state.druxtRouter.route).toStrictEqual({})

    // A payload that doesn't carry a route is ignored.
    store.commit('druxtRouter/setRoute', {})
    store.commit('druxtRouter/setRoute', { path: '/about' })
    store.commit('druxtRouter/setRoute', { route: { type: 'entity' } })
    expect(store.state.druxtRouter.route).toStrictEqual({})

    // The route is used as given, and is not stored.
    const route = { type: 'entity', label: 'About' }
    store.commit('druxtRouter/setRoute', { path: '/about', route })
    expect(store.state.druxtRouter.route).toBe(route)
    expect(store.state.druxtRouter.routes).toStrictEqual({})
  })

  test('flushRoutes', async () => {
    store.commit('druxtRouter/addRoute', { path: '/a', route: { type: 'entity' } })
    store.commit('druxtRouter/addRoute', { path: '/b', route: { type: 'entity' } })
    store.commit('druxtRouter/flushRoutes', { path: '/a' })
    expect(Object.keys(store.state.druxtRouter.routes)).toStrictEqual(['/b'])
    store.commit('druxtRouter/flushRoutes', { path: '/never' })
    store.commit('druxtRouter/flushRoutes')
    expect(store.state.druxtRouter.routes).toStrictEqual({})
  })
})
