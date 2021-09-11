import { createLocalVue } from '@vue/test-utils'
import axios from 'axios'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { getMockCollection, getMockResource } from 'druxt-test-utils'
import mockAxios from 'jest-mock-axios'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../..'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const baseUrl = 'https://demo-api.druxtjs.org'

describe('DruxtStore', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    store.app = { context: { error: jest.fn() } }
    DruxtStore({ store })

    store.$druxt = new DruxtClient(baseUrl, { axios })
  })

  test('init', () => {
    expect(() => { DruxtStore({}) }).toThrow('Vuex store not found.')
  })

  test('addCollection', async () => {
    const mockCollectionPage = await getMockCollection('node--page')

    // expect(collection).toBe(1)
    const id = mockCollectionPage.data[0].id

    // Ensure that the collection and resource stores are empty.
    expect(store.state.druxt.collections).toStrictEqual({})

    // Commit the mock data with included mock data.
    const included = [{
      type: 'node--article',
      id: expect.any(String),
      attributes: {}
    }]
    store.commit('druxt/addCollection', {
      collection: {
        ...mockCollectionPage,
        included,
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

  test('addResource', async () => {
    const mockPage = await getMockResource('node--page')
    const mockArticle = await getMockResource('node--article')

    // Ensure that the resources store is empty.
    expect(store.state.druxt.resources).toStrictEqual({})

    // Ensure that bad data does not get committed to state.
    store.commit('druxt/addResource', {})
    expect(store.state.druxt.resources).toStrictEqual({})

    // Ensure that good data is committed to state.
    store.commit('druxt/addResource', {
      resource: {
        ...mockPage,
        included: [mockArticle.data],
      }
    })
    expect(store.state.druxt.resources[mockPage.data.type][mockPage.data.id])
      .toStrictEqual({
        _druxt_full: expect.anything(),
        ...mockPage,
      })
    const expected = { ...mockArticle }
    delete expected.jsonapi
    expect(store.state.druxt.resources[mockArticle.data.type][mockArticle.data.id])
      .toStrictEqual({
        _druxt_full: expect.anything(),
        ...expected,
        links: {
          self: {
            href: expect.any(String)
          }
        }
      })

    // Test deprecated hash argument.
    const spy = jest.spyOn(console, 'warn').mockImplementation()
    store.commit('druxt/addResource', { resource: mockArticle, hash: 'deprecated' })
    expect(console.warn).toHaveBeenCalledWith('[druxt] The `hash` argument for `druxt/addResource` has been deprecated, see https://druxtjs.org/guide/deprecations.html#druxtstore-addresource-hash');
    spy.mockRestore()
  })

  test('getResource', async () => {
    const mockPage = await getMockResource('node--page')
    mockAxios.reset()

    // Assert that:
    // - Resource store is empty.
    // - No get requests have been executed.
    expect(store.state.druxt.resources).toStrictEqual({})
    expect(mockAxios.get).toHaveBeenCalledTimes(0)

    // Get full resource
    const resource = await store.dispatch('druxt/getResource', mockPage.data)

    // Assert that:
    // - The request url is correct.
    // - Only 3 get requests are executed.
    // - Returned expected data with `_druxt_full` flag.
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/page/${mockPage.data.id}`)
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    const expected = {
      _druxt_full: expect.anything(),
      ...mockPage
    }
    expect(resource).toStrictEqual(expected)

    // Assert that:
    // - No additional get requests are executed.
    // - Rehydrated resource gives the same results.
    const storedResource = await store.dispatch('druxt/getResource', mockPage.data)
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(storedResource).toStrictEqual(resource)
    expect(storedResource).toStrictEqual(expected)
  })

  test('getResource - filter', async () => {
    const mockRecipe = await getMockResource('node--recipe', new DrupalJsonApiParams().addFields('node--recipe', []))
    mockAxios.reset()

    // Assert that:
    // - Resource store is empty.
    // - No get requests have been executed.
    expect(store.state.druxt.resources).toStrictEqual({})
    expect(mockAxios.get).toHaveBeenCalledTimes(0)

    // Get resource with no fields.
    const request = {
      type: 'node--recipe',
      id: mockRecipe.data.id,
      query: new DrupalJsonApiParams()
        .addFields('node--recipe', [])
    }

    // Assert that:
    // - The request url is correct.
    // - Only 3 get requests are executed.
    // - Returned expected data with `_druxt_partial` flag.
    // - There's no attributes or relationships.
    const resource = await store.dispatch('druxt/getResource', request)
    const expected = {
      _druxt_partial: expect.anything(),
      ...mockRecipe
    }
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe/${mockRecipe.data.id}?fields%5Bnode--recipe%5D=`)
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
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
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe/${mockRecipe.data.id}?fields%5Bnode--recipe%5D=title`)
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
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
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe/${mockRecipe.data.id}?fields%5Bnode--recipe%5D=path`)
    expect(mockAxios.get).toHaveBeenCalledTimes(4)
    expect(Object.keys(mixedResource.data.attributes)).toStrictEqual(['title', 'path'])

    // Get the initial request again.
    await store.dispatch('druxt/getResource', request)

    // Assert that:
    // - No additional get requests were made.
    expect(mockAxios.get).toHaveBeenCalledTimes(4)
  })

  test('getResource - includes', async () => {
    const mockResource = await getMockResource('node--recipe')
    mockAxios.reset()

    // Assert that:
    // - Resource store is empty.
    // - No get requests have been executed.
    expect(store.state.druxt.resources).toStrictEqual({})
    expect(mockAxios.get).toHaveBeenCalledTimes(0)

    // Get filtered resource with includes.
    const request = {
      type: 'node--recipe',
      id: mockResource.data.id,
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
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe/${mockResource.data.id}?include=field_media_image%2Cfield_media_image.field_media_image&fields%5Bnode--recipe%5D=field_media_image&fields%5Bmedia--image%5D=field_media_image&fields%5Bfile--file%5D=uri`)
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(resource).toStrictEqual({
      _druxt_partial: expect.anything(),
      ...resource
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
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(storedResource).toStrictEqual({
      _druxt_partial: expect.anything(),
      ...resource
    })

    // Ensure no data normalization issues.
    request.query = new DrupalJsonApiParams().addInclude([])
    await store.dispatch('druxt/getResource', request)
  })

  test('getCollection', async () => {
    const collection = await store.dispatch('druxt/getCollection', { type: 'node--page', query: {} })
    expect(collection.data.length).toBe(1)
    expect(mockAxios.get).toHaveBeenCalledTimes(2)

    await store.dispatch('druxt/getCollection', { type: 'node--page', query: {} })
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
  })
})
