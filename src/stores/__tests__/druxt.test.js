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
    expect(console.warn).toHaveBeenCalledWith('[druxt] The `hash` argument for `druxt/addResource` has been deprecated, see https://druxtjs.org/guide/deprecations.html#druxtstore-addresource-hash');
    spy.mockRestore()
  })

  test('getResource', async () => {
    // Assert that:
    // - Resource store is empty.
    // - No get requests have been executed.
    expect(store.state.druxt.resources).toStrictEqual({})
    expect(mockAxios.get).toHaveBeenCalledTimes(0)
    
    // Get full resource
    const resource = await store.dispatch('druxt/getResource', mockResourcePage.data)

    // Assert that:
    // - The request url is correct.
    // - Only 3 get requests are executed.
    // - Returned expected data with `_druxt_full` flag.
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/page/4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9')
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
    const expected = {
      _druxt_full: expect.anything(),
      ...mockResourcePage
    }
    expect(resource).toStrictEqual(expected)

    // Assert that:
    // - No additional get requests are executed.
    // - Rehydrated resource gives the same results.
    const storedResource = await store.dispatch('druxt/getResource', mockResourcePage.data)
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
    expect(storedResource).toStrictEqual(resource)
    expect(storedResource).toStrictEqual(expected)
  })

  test('getResource - filter', async () => {
    // Assert that:
    // - Resource store is empty.
    // - No get requests have been executed.
    expect(store.state.druxt.resources).toStrictEqual({})
    expect(mockAxios.get).toHaveBeenCalledTimes(0)

    // Get resource with no fields.
    const request = {
      type: 'node--recipe',
      id: '9cd5cfab-fe24-4773-88e1-56123bcbc9bc',
      query: new DrupalJsonApiParams()
        .addFields('node--recipe', [])
    }

    // Assert that:
    // - The request url is correct.
    // - Only 3 get requests are executed.
    // - Returned expected data with `_druxt_partial` flag.
    // - There's no attributes or relationships.
    const resource = await store.dispatch('druxt/getResource', request)
    const expectedData = require('../../__fixtures__/get/425ca060a864b971bc78aa3182257323.json')
    const expected = {
      _druxt_partial: expect.anything(),
      ...expectedData
    }
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/recipe/9cd5cfab-fe24-4773-88e1-56123bcbc9bc?fields%5Bnode--recipe%5D=')
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
    expect(resource).toStrictEqual(expected)
    expect(resource.data.attributes).toBe(undefined)
    expect(resource.data.relationships).toBe(undefined)

    // Get the same resource but with a single field.
    const partialResource = await store.dispatch('druxt/getResource', {
      ...request,
      query: new DrupalJsonApiParams()
        .addFields('node--recipe', ['title'])
    })

    // Assert that:
    // - The request url is correct.
    // - One additional get request executed for missing field data.
    // - The additional data is present.
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/recipe/9cd5cfab-fe24-4773-88e1-56123bcbc9bc?fields%5Bnode--recipe%5D=title')
    expect(mockAxios.get).toHaveBeenCalledTimes(4)
    expect(Object.keys(partialResource.data.attributes)).toStrictEqual(['title'])

    // Get the same resource but with a missing and existing field.
    const mixedResource = await store.dispatch('druxt/getResource', {
      ...request,
      query: new DrupalJsonApiParams()
        .addFields('node--recipe', ['title', 'path'])
    })

    // Assert that:
    // - The request url is correct.
    // - One additional get request executed for only the missing field.
    // - All required data is present.
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/recipe/9cd5cfab-fe24-4773-88e1-56123bcbc9bc?fields%5Bnode--recipe%5D=path')
    expect(mockAxios.get).toHaveBeenCalledTimes(5)
    expect(Object.keys(mixedResource.data.attributes)).toStrictEqual(['title', 'path'])

    // Get the initial request again.
    await store.dispatch('druxt/getResource', request)

    // Assert that:
    // - No additional get requests were made.
    expect(mockAxios.get).toHaveBeenCalledTimes(5)
  })

  test('getResource - includes', async () => {
    // Assert that:
    // - Resource store is empty.
    // - No get requests have been executed.
    expect(store.state.druxt.resources).toStrictEqual({})
    expect(mockAxios.get).toHaveBeenCalledTimes(0)

    // Get filtered resource with includes.
    const request = {
      type: 'node--recipe',
      id: '9cd5cfab-fe24-4773-88e1-56123bcbc9bc',
      query: new DrupalJsonApiParams()
        .addInclude(['field_media_image', 'field_media_image.field_media_image'])
        .addFields('node--recipe', [])
        // @todo This field should be automatically included.
        .addFields('media--image', ['field_media_image'])
        .addFields('file--file', ['uri'])
    }
    const resource = await store.dispatch('druxt/getResource', request)

    // Assert that:
    // - The request url is correct.
    // - Only 3 get requests are executed.
    // - Returned expected data with `_druxt_partial` flag.
    // - Included resources are stored.
    const expected = require('../../__fixtures__/get/1c595b87cd1bc58a1e5e51fe41aa1c95.json')
    expect(mockAxios.get).toHaveBeenLastCalledWith('/jsonapi/node/recipe/9cd5cfab-fe24-4773-88e1-56123bcbc9bc?include=field_media_image%2Cfield_media_image.field_media_image&fields%5Bnode--recipe%5D=field_media_image&fields%5Bmedia--image%5D=field_media_image&fields%5Bfile--file%5D=uri')
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
    expect(resource).toStrictEqual({
      _druxt_partial: expect.anything(),
      ...expected
    })
    expect(Object.keys(store.state.druxt.resources)).toStrictEqual([
      'node--recipe',
      'media--image',
      'file--file'
    ])

    // Get same resource with include to test re-hydration.
    const storedResource = await store.dispatch('druxt/getResource', request)

    // Assert that:
    // - No additional get requests are executed.
    // - Rehydrated resource gives the same results.
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
    expect(storedResource).toStrictEqual({
      _druxt_partial: expect.anything(),
      ...expected
    })

    // Ensure no data normalization issues.
    request.query = new DrupalJsonApiParams().addInclude([])
    await store.dispatch('druxt/getResource', request)
  })

  test('getCollection', async () => {
    const collection = await store.dispatch('druxt/getCollection', { type: 'node--page', query: {} })
    expect(collection.data.length).toBe(1)
    expect(mockAxios.get).toHaveBeenCalledTimes(3)

    await store.dispatch('druxt/getCollection', { type: 'node--page', query: {} })
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
  })
})
