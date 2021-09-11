import { createLocalVue } from '@vue/test-utils'
import axios from 'axios'
import { DruxtClient, DruxtStore } from 'druxt'
import mockAxios from 'jest-mock-axios'
import Vuex from 'vuex'

import { DruxtViewsStore } from '../../src'

jest.mock('axios')

// Setup mock data.
const viewId = 'featured_articles'
const displayId = 'page_1'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

describe('DruxtViewsStore', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    DruxtStore({ store })
    DruxtViewsStore({ store })

    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org', { axios })

    store.app = { context: { error: jest.fn() }, store }
  })

  test('init', () => {
    expect(() => { DruxtViewsStore({}) }).toThrow('Vuex store not found.')
  })

  test('addResults', async () => {
    // Ensure that the results state is empty.
    expect(store.state['druxt/views'].results).toStrictEqual({})

    // Ensure that bad data does not get committed to state.
    store.commit('druxt/views/addResults', {})
    expect(store.state['druxt/views'].results).toStrictEqual({})

    // Ensure that good data is committed to state.
    const results = await store.$druxt.getResource(`views--${viewId}`, displayId)

    store.commit('druxt/views/addResults', { results, viewId, displayId, hash: '_default' })
    expect(store.state['druxt/views'].results[viewId][displayId]._default).toBe(results)
    expect(Object.keys(store.state['druxt/views'].results)).toHaveLength(1)
  })

  test('getResults', async () => {
    const query = { viewId, displayId, query: {} }
    const results = await store.dispatch('druxt/views/getResults', query)

    expect(results).toHaveProperty('jsonapi')
    expect(results).toHaveProperty('data')
    expect(results).toHaveProperty('meta')
    expect(results).toHaveProperty('links')

    // Ensure additional requests to the same route don't trigger an additional request.
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    await store.dispatch('druxt/views/getResults', query)
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
  })
})
