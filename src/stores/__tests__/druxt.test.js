import { createLocalVue } from '@vue/test-utils'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import mockAxios from 'jest-mock-axios'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../..'

jest.mock('axios')

// Setup mock data.
const mockCollectionPage = require('../../__fixtures__/get/727ff32fd857c9e7996e2ec415142851.json')
const mockResourceArticle = require('../../__fixtures__/get/02122578a662e4a6ee0ea39cced4465d.json')
const mockResourcePage = require('../../__fixtures__/get/297a5e0949afb381ae9f2a30190a9a53.json')

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

  test('addCollection', () => {
    const id = mockCollectionPage.data[0].id

    // Ensure that the collection and resource stores are empty.
    expect(store.state.druxt.collections).toStrictEqual({})

    // Commit the mock data with included mock data.
    store.commit('druxt/addCollection', {
      collection: {
        ...mockCollectionPage,
        included: [mockResourceArticle.data],
      },
      type: 'node--page',
      hash: '_default',
    })

    // Expect the collection be stored with dehydrated resources.
    expect(store.state.druxt.collections['node--page']._default.data[0]).toStrictEqual(
      expect.objectContaining({ id, type: 'node--page' })
    )

    // Expect the collection be stored without included data.
    expect(store.state.druxt.collections['node--page']._default.included).toBeFalsy()
  })

  test('addResource', () => {
    // Ensure that the resources store is empty.
    expect(store.state.druxt.resources).toStrictEqual({})

    // Ensure that bad data does not get committed to state.
    store.commit('druxt/addResource', {})
    expect(store.state.druxt.resources).toStrictEqual({})

    // Ensure that good data is committed to state.
    store.commit('druxt/addResource', {
      resource: {
        ...mockResourcePage,
        included: [mockResourceArticle.data],
      }
    })
    expect(store.state.druxt.resources[mockResourcePage.data.type][mockResourcePage.data.id])
      .toStrictEqual({
        _druxt_full: expect.anything(),
        ...mockResourcePage,
      })
    expect(store.state.druxt.resources[mockResourceArticle.data.type][mockResourceArticle.data.id])
      .toStrictEqual({
        _druxt_full: expect.anything(),
        ...mockResourceArticle,
        links: {
          self: {
            href: expect.any(String)
          }
        }
      })

    // Test deprecated hash argument.
    const spy = jest.spyOn(console, 'warn').mockImplementation()
    store.commit('druxt/addResource', { resource: mockResourceArticle, hash: 'deprecated' })
    expect(console.warn).toHaveBeenCalledWith('[druxt] The `hash` argument for `druxt/addResource` has been deprecated, see https://druxtjs.org/guide/deprecations');
    spy.mockRestore()
  })

  test('getResource', async () => {
    expect(mockAxios.get).toHaveBeenCalledTimes(0)
    const resource = await store.dispatch('druxt/getResource', mockResourcePage.data)
    expect(mockAxios.get).toHaveBeenCalledTimes(3)

    expect(resource.data).toStrictEqual(mockResourcePage.data)
    expect(resource._druxt_full).toBeTruthy()

    await store.dispatch('druxt/getResource', mockResourcePage.data)
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
  })

  test('getResource - includes', async () => {
    expect(mockAxios.get).toHaveBeenCalledTimes(0)
    let resource = await store.dispatch('druxt/getResource', {
      ...mockResourcePage.data,
      query: new DrupalJsonApiParams().addInclude('uid')
    })
    expect(mockAxios.get).toHaveBeenCalledTimes(3)

    const expected = {
      _druxt_full: expect.anything(),
      ...mockResourcePage,
      included: [expect.any(Object)],
    }
    expect(resource).toStrictEqual(expected)
    expect(Object.keys(store.state.druxt.resources)).toStrictEqual([
      'node--page', 'user--user'
    ])
    expect(resource._druxt_full).toBeTruthy()

    // Get same resource with include to test re-hydration.
    resource = await store.dispatch('druxt/getResource', {
      ...mockResourcePage.data,
      query: new DrupalJsonApiParams().addInclude('uid')
    })
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
    expect(resource).toStrictEqual(expected)
  })

  test('getCollection', async () => {
    const collection = await store.dispatch('druxt/getCollection', { type: 'node--page', query: {} })
    expect(collection.data.length).toBe(1)
    expect(mockAxios.get).toHaveBeenCalledTimes(3)

    await store.dispatch('druxt/getCollection', { type: 'node--page', query: {} })
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
  })
})
