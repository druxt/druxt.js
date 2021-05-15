import { createLocalVue } from '@vue/test-utils'
import mockAxios from 'jest-mock-axios'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../..'

jest.mock('axios')

// Setup mock data.
const mockArticle = require('../../__fixtures__/get/02122578a662e4a6ee0ea39cced4465d.json')
const mockPage = require('../../__fixtures__/get/297a5e0949afb381ae9f2a30190a9a53.json')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

describe('DruxtStore', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    store.app = { context: { error: jest.fn() } }
    DruxtStore({ store })

    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')
  })

  test('init', () => {
    expect(() => { DruxtStore({}) }).toThrow('Vuex store not found.')
  })

  test('addResource', () => {
    // Ensure that the resources store is empty.
    expect(store.state.druxt.resources).toStrictEqual({})

    // Ensure that bad data does not get committed to state.
    store.commit('druxt/addResource', {})
    expect(store.state.druxt.resources).toStrictEqual({})

    // Ensure that good data is committed to state.
    store.commit('druxt/addResource', { resource: mockPage })
    expect(store.state.druxt.resources[mockPage.data.type][mockPage.data.id]).toStrictEqual(mockPage)

    store.commit('druxt/addResource', { resource: mockArticle })
    expect(store.state.druxt.resources[mockArticle.data.type][mockArticle.data.id]).toStrictEqual(mockArticle)

    // Test deprecated hash argument.
    const spy = jest.spyOn(console, 'warn').mockImplementation()
    store.commit('druxt/addResource', { resource: mockArticle, hash: 'deprecated' })
    expect(console.warn).toHaveBeenCalledWith('[druxt] The `hash` argument for `druxt/addResource` has been deprecated, see https://druxtjs.org/guide/deprecations');
    spy.mockRestore()
  })

  test('getResource', async () => {
    expect(mockAxios.get).toHaveBeenCalledTimes(0)
    const resource = await store.dispatch('druxt/getResource', mockPage.data)
    expect(mockAxios.get).toHaveBeenCalledTimes(3)

    expect(resource.data).toHaveProperty('attributes')
    expect(resource._druxt_full).toBeTruthy()

    await store.dispatch('druxt/getResource', mockPage.data)
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
  })

  test('getCollection', async () => {
    const collection = await store.dispatch('druxt/getCollection', { type: 'node--page', query: {} })
    expect(collection.data.length).toBe(1)
    expect(mockAxios.get).toHaveBeenCalledTimes(3)

    await store.dispatch('druxt/getCollection', { type: 'node--page', query: {} })
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
  })
})
