import { createLocalVue } from '@vue/test-utils'
import axios from 'axios'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { getMockCollection, getMockResource } from 'druxt-test-utils'
import mockAxios from 'jest-mock-axios'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../src'

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
    // Reset the shared JSON:API index cache.
    Object.keys(store.$druxt.index).forEach((key) => delete store.$druxt.index[key])
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
    expect(store.state.druxt.collections['node--page']._default[undefined].data[0]).toStrictEqual(
      expect.objectContaining({ id, type: 'node--page' })
    )

    // Expect the collection be stored with dehydrated (not dropped)
    // included resources, so a later cache hit can re-hydrate `included`
    // the same way it re-hydrates `data`.
    expect(store.state.druxt.collections['node--page']._default[undefined].included[0]).toStrictEqual({
      id: included[0].id,
      type: 'node--article',
    })
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
    expect(store.state.druxt.resources[mockPage.data.type][mockPage.data.id][undefined])
      .toStrictEqual({
        _druxt_full: expect.anything(),
        ...mockPage,
      })
    const expected = { ...mockArticle }
    delete expected.jsonapi
    expect(store.state.druxt.resources[mockArticle.data.type][mockArticle.data.id][undefined])
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
    expect(console.warn).toHaveBeenCalledWith('[druxt] The `hash` argument for `druxt/addResource` has been deprecated, see https://druxtjs.org/modules/druxt/deprecations#druxtstore-addresource-hash');
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
    // - Only 2 get requests are executed.
    //   - Index
    //   - Resource
    // - Returned expected data with `_druxt_full` flag.
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/page/${mockPage.data.id}`, undefined)
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    const expected = {
      _druxt_full: expect.anything(),
      ...mockPage
    }
    expect(resource).toStrictEqual(expected)

    // Assert that:
    // - The suite doesn't execute additional get requests.
    // - Rehydrated resource gives the same results.
    const storedResource = await store.dispatch('druxt/getResource', mockPage.data)
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(storedResource).toStrictEqual(resource)
    expect(storedResource).toStrictEqual(expected)

    // Assert that:
    // - Cache is bypassed
    const bypassedResource = await store.dispatch('druxt/getResource', { ...mockPage.data, bypassCache: true })
    delete resource._druxt_full
    delete bypassedResource._druxt_full
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
    expect(bypassedResource).toStrictEqual(resource)

    // Assert that:
    // - When bypassing cache, in case live data is unavailable, fallback to cache.
    store.$druxt.getResource = jest.fn(() => { throw new Error() })
    const fallback = await store.dispatch('druxt/getResource', { ...mockPage.data, bypassCache: true })
    delete fallback._druxt_full
    expect(mockAxios.get).toHaveBeenCalledTimes(3)
    expect(fallback).toStrictEqual(bypassedResource)
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
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe/${mockRecipe.data.id}?fields%5Bnode--recipe%5D=`, undefined)
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(resource).toStrictEqual(expected)
    expect(resource.data.attributes).toBe(undefined)
    expect(resource.data.relationships).toBe(undefined)

    // Get the same resource but with one field.
    const partialResource = await store.dispatch('druxt/getResource', {
      ...request,
      query: new DrupalJsonApiParams()
        .addFields('node--recipe', ['title'])
    })

    // Assert that:
    // - The request url is correct.
    // - One additional get request executed for missing field data.
    // - The additional data is present.
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe/${mockRecipe.data.id}?fields%5Bnode--recipe%5D=title`, undefined)
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
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe/${mockRecipe.data.id}?fields%5Bnode--recipe%5D=path`, undefined)
    expect(mockAxios.get).toHaveBeenCalledTimes(4)
    expect(Object.keys(mixedResource.data.attributes)).toStrictEqual(['title', 'path'])

    // Get the initial request again.
    await store.dispatch('druxt/getResource', request)

    // Assert that:
    // - The suite didn't make additional get requests.
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
    expect(mockAxios.get).toHaveBeenLastCalledWith(`${baseUrl}/en/jsonapi/node/recipe/${mockResource.data.id}?include=field_media_image%2Cfield_media_image.field_media_image&fields%5Bnode--recipe%5D=field_media_image&fields%5Bmedia--image%5D=field_media_image&fields%5Bfile--file%5D=uri`, undefined)
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
    // - The suite doesn't execute additional get requests.
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

  test('getResource - bypassCache returns only the includes the fresh response has', async () => {
    const mockResource = await getMockResource('node--recipe')
    const { id } = mockResource.data
    const request = {
      type: 'node--recipe',
      id,
      query: new DrupalJsonApiParams()
        .addInclude(['field_media_image', 'field_media_image.field_media_image'])
        .addFields('node--recipe', [])
        .addFields('media--image', ['field_media_image'])
        .addFields('file--file', ['uri'])
    }

    // A stored copy that still relates to media Drupal has since removed from the recipe.
    const stale = { type: 'media--image', id: 'removed-media', attributes: {}, relationships: {} }
    store.commit('druxt/addResource', { prefix: undefined, resource: { data: stale, links: { self: { href: '' } } } })
    store.commit('druxt/addResource', { prefix: undefined, resource: { data: { ...mockResource.data, relationships: { field_media_image: { data: { type: 'media--image', id: 'removed-media' } } } }, links: { self: { href: '' } } } })

    const resource = await store.dispatch('druxt/getResource', { ...request, bypassCache: true })
    const included = (resource.included || []).map((o) => o.id)
    expect(included.length).toBeGreaterThan(0)
    expect(included).not.toContain('removed-media')
  })

  test('getCollection', async () => {
    const collection = await store.dispatch('druxt/getCollection', { type: 'node--page', query: {} })
    expect(collection.data.length).toBe(1)
    expect(mockAxios.get).toHaveBeenCalledTimes(2)

    await store.dispatch('druxt/getCollection', { type: 'node--page', query: {} })
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
  })

  test('getCollection cache hit re-hydrates included data', async () => {
    const mockCollectionPage = await getMockCollection('node--page')
    const includedId = 'included-article-uuid'
    store.commit('druxt/addCollection', {
      collection: {
        ...mockCollectionPage,
        included: [{ type: 'node--article', id: includedId, attributes: { title: 'Included' } }],
      },
      type: 'node--page',
      hash: '_default',
    })

    // A cache hit must return `included` the same way a fresh fetch would.
    const cached = await store.dispatch('druxt/getCollection', { type: 'node--page' })
    expect(cached.included).toHaveLength(1)
    expect(cached.included[0]).toStrictEqual(
      expect.objectContaining({ id: includedId, type: 'node--article' })
    )
    // The stored entry is a bare `{ id, type }` ref with no attributes, so
    // a hydrated resource is the only thing that can satisfy this.
    expect(cached.included[0].attributes).toStrictEqual({ title: 'Included' })
  })

  test('getCollection fetches again after flushResource', async () => {
    const type = 'node--page'
    const mockCollectionPage = await getMockCollection(type)
    store.commit('druxt/addCollection', {
      collection: {
        ...mockCollectionPage,
        included: [{ type: 'node--article', id: 'flushed-article-uuid', attributes: { title: 'Included' } }],
      },
      type,
      hash: '_default',
    })

    // A cache hit while the resources are still stored doesn't request anything.
    await store.dispatch('druxt/getCollection', { type })
    expect(mockAxios.get).toHaveBeenCalledTimes(0)

    // Every resource bucket goes, while the collection entry stays, so the
    // next request is a fetch rather than a collection of undefined entries.
    store.commit('druxt/flushResource', {})
    const fresh = await store.dispatch('druxt/getCollection', { type })
    // The JSON:API index request and the collection request.
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(fresh.data).toStrictEqual(mockCollectionPage.data)
    expect(fresh.data.every((o) => o)).toBe(true)
  })

  test('getCollection shares an in-flight request', async () => {
    const type = 'node--page'
    const mockCollectionPage = await getMockCollection(type)
    const resolvers = []
    store.$druxt.getCollection = jest.fn(() => new Promise((resolve) => resolvers.push(resolve)))

    const requests = [1, 2, 3].map(() => store.dispatch('druxt/getCollection', { type, query: 'page[limit]=5' }))
    await Promise.resolve()
    expect(store.$druxt.getCollection).toHaveBeenCalledTimes(1)

    // A different query, include, type or prefix is a different request.
    requests.push(
      store.dispatch('druxt/getCollection', { type, query: 'page[limit]=10' }),
      store.dispatch('druxt/getCollection', { type, query: 'page[limit]=5&include=uid' }),
      store.dispatch('druxt/getCollection', { type: 'node--article', query: 'page[limit]=5' }),
      store.dispatch('druxt/getCollection', { type, query: 'page[limit]=5', prefix: 'es' }),
    )
    await Promise.resolve()
    expect(store.$druxt.getCollection).toHaveBeenCalledTimes(5)

    resolvers.forEach((resolve) => resolve(mockCollectionPage))
    const results = await Promise.all(requests)
    results.forEach((result) => expect(result.data).toStrictEqual(mockCollectionPage.data))
  })

  test('a flush drops the requests in flight, for the store and for later dispatches', async () => {
    const type = 'node--page'
    const mockCollectionPage = await getMockCollection(type)
    const mockPage = await getMockResource(type)
    const { id } = mockPage.data
    const collections = []
    const resources = []
    store.$druxt.getCollection = jest.fn(() => new Promise((resolve) => collections.push(resolve)))
    store.$druxt.getResource = jest.fn(() => new Promise((resolve) => resources.push(resolve)))

    const before = [
      store.dispatch('druxt/getCollection', { type }),
      store.dispatch('druxt/getResource', { type, id }),
    ]
    await Promise.resolve()
    store.commit('druxt/flushCollection', {})
    store.commit('druxt/flushResource', {})

    // A dispatch after the flush starts its own request rather than joining the stale one.
    const after = [
      store.dispatch('druxt/getCollection', { type }),
      store.dispatch('druxt/getResource', { type, id }),
    ]
    await Promise.resolve()
    expect(store.$druxt.getCollection).toHaveBeenCalledTimes(2)
    expect(store.$druxt.getResource).toHaveBeenCalledTimes(2)

    // The request started before the flush answers its callers and stores nothing.
    collections[0](mockCollectionPage)
    resources[0](mockPage)
    const [collection, resource] = await Promise.all(before)
    expect(collection.data).toStrictEqual(mockCollectionPage.data)
    expect(resource.data).toStrictEqual(mockPage.data)
    expect(store.state.druxt.collections).toStrictEqual({})
    expect(store.state.druxt.resources).toStrictEqual({})

    // The request started after it is stored as usual.
    collections[1](mockCollectionPage)
    resources[1](mockPage)
    await Promise.all(after)
    expect(store.state.druxt.collections[type]._default.undefined.data).toHaveLength(mockCollectionPage.data.length)
    expect(store.state.druxt.resources[type][id].undefined.data).toStrictEqual(mockPage.data)
  })

  test('getCollection retries after a failed request', async () => {
    const type = 'node--page'
    const mockCollectionPage = await getMockCollection(type)
    store.$druxt.getCollection = jest.fn(() => Promise.reject(new Error('Backend down')))

    const failed = [1, 2].map(() => store.dispatch('druxt/getCollection', { type }))
    await expect(failed[0]).rejects.toThrow('Backend down')
    await expect(failed[1]).rejects.toThrow('Backend down')
    expect(store.$druxt.getCollection).toHaveBeenCalledTimes(1)

    store.$druxt.getCollection.mockImplementation(() => Promise.resolve(mockCollectionPage))
    const collection = await store.dispatch('druxt/getCollection', { type })
    expect(store.$druxt.getCollection).toHaveBeenCalledTimes(2)
    expect(collection.data).toStrictEqual(mockCollectionPage.data)

    // The settled request is stored, so the next dispatch is a cache hit.
    await store.dispatch('druxt/getCollection', { type })
    expect(store.$druxt.getCollection).toHaveBeenCalledTimes(2)
  })

  test('getResource shares an in-flight request', async () => {
    const mockPage = await getMockResource('node--page')
    const { id, type } = mockPage.data
    let resolve
    store.$druxt.getResource = jest.fn(() => new Promise((r) => { resolve = r }))

    const requests = [1, 2, 3].map(() => store.dispatch('druxt/getResource', { id, type }))
    await Promise.resolve()
    expect(store.$druxt.getResource).toHaveBeenCalledTimes(1)

    resolve(mockPage)
    const results = await Promise.all(requests)
    results.forEach((result) => expect(result.data).toStrictEqual(mockPage.data))
    // Each caller gets its own document.
    expect(results[0]).not.toBe(results[1])

    // A different id, prefix or field set is a different request.
    store.$druxt.getResource = jest.fn(() => new Promise(() => {}))
    store.commit('druxt/flushResource', {})
    store.dispatch('druxt/getResource', { id, type })
    store.dispatch('druxt/getResource', { id: 'another-uuid', type })
    store.dispatch('druxt/getResource', { id, type, prefix: 'es' })
    store.dispatch('druxt/getResource', { id, type, query: 'fields[node--page]=title' })
    await Promise.resolve()
    expect(store.$druxt.getResource).toHaveBeenCalledTimes(4)
  })

  test('getResource retries after a failed request', async () => {
    const mockPage = await getMockResource('node--page')
    const { id, type } = mockPage.data
    store.$druxt.getResource = jest.fn(() => Promise.reject(new Error('Backend down')))

    await Promise.all([1, 2].map(() => store.dispatch('druxt/getResource', { id, type })))
    expect(store.$druxt.getResource).toHaveBeenCalledTimes(1)

    store.$druxt.getResource.mockImplementation(() => Promise.resolve(mockPage))
    const resource = await store.dispatch('druxt/getResource', { id, type })
    expect(store.$druxt.getResource).toHaveBeenCalledTimes(2)
    expect(resource.data).toStrictEqual(mockPage.data)
  })

  test('in-flight requests are not shared between stores', async () => {
    const type = 'node--page'
    const other = new Vuex.Store()
    DruxtStore({ store: other })
    store.$druxt = { getCollection: jest.fn(() => new Promise(() => {})) }
    other.$druxt = { getCollection: jest.fn(() => new Promise(() => {})) }

    store.dispatch('druxt/getCollection', { type })
    other.dispatch('druxt/getCollection', { type })
    await Promise.resolve()
    expect(store.$druxt.getCollection).toHaveBeenCalledTimes(1)
    expect(other.$druxt.getCollection).toHaveBeenCalledTimes(1)
    expect(Object.keys(store.state.druxt)).toStrictEqual(['collections', 'resources'])
  })

  test('addCollection drops included when the response omits it', async () => {
    const type = 'node--page'
    const hash = '_default'
    const mockCollectionPage = await getMockCollection(type)

    store.commit('druxt/addCollection', {
      collection: {
        ...mockCollectionPage,
        included: [{ type: 'node--article', id: 'stale-article-uuid', attributes: { title: 'Included' } }],
      },
      type,
      hash,
    })
    expect(store.state.druxt.collections[type][hash][undefined].included).toHaveLength(1)

    // The hash ignores `include`, so the same slot takes a response from a
    // query that asked for none. The previous refs must not survive it.
    store.commit('druxt/addCollection', { collection: { ...mockCollectionPage }, type, hash })
    expect(store.state.druxt.collections[type][hash][undefined].included).toBeUndefined()

    const cached = await store.dispatch('druxt/getCollection', { type })
    expect(cached.included).toBeUndefined()
  })

  test('flushCollection', async () => {
    const type = 'node--page'
    const hash ='_default'
    const prefix = 'en'

    // Ensure that the results state is populated.
    const collection = await getMockCollection(type)
    const add = (p = prefix, h = hash) => store.commit('druxt/addCollection', { collection: { ...collection }, type, prefix: p, hash: h })
    add()
    expect(store.state.druxt.collections[type][hash][prefix]).toBeTruthy()

    store.commit('druxt/flushCollection', { type, hash, prefix })
    expect(store.state.druxt.collections[type][hash][prefix]).toBe(undefined)

    add()
    store.commit('druxt/flushCollection', { type, hash })
    expect(store.state.druxt.collections[type][hash]).toBe(undefined)

    add()
    store.commit('druxt/flushCollection', { type })
    expect(store.state.druxt.collections[type]).toBe(undefined)

    add()
    store.commit('druxt/flushCollection', {})
    expect(store.state.druxt.collections).toStrictEqual({})
  })

  test('flushCollection treats an empty string as a selector, not as omitted', async () => {
    const type = 'node--page'
    const collection = await getMockCollection(type)
    const add = (prefix, hash) => store.commit('druxt/addCollection', { collection: { ...collection }, type, prefix, hash })

    // An empty query is stored under _default, so flushing it names that key only.
    add('en', '_default')
    add('en', 'a')
    store.commit('druxt/flushCollection', { type, query: '', prefix: 'en' })
    expect(store.state.druxt.collections[type]._default.en).toBe(undefined)
    expect(store.state.druxt.collections[type].a.en).toBeTruthy()

    // An empty prefix is the default language, not every language.
    add('', 'a')
    store.commit('druxt/flushCollection', { type, hash: 'a', prefix: '' })
    expect(store.state.druxt.collections[type].a['']).toBe(undefined)
    expect(store.state.druxt.collections[type].a.en).toBeTruthy()

    // The same for a resource.
    const resource = await getMockResource(type)
    const id = resource.data.id
    store.commit('druxt/addResource', { prefix: '', resource: { ...resource } })
    store.commit('druxt/addResource', { prefix: 'en', resource: { ...resource } })
    store.commit('druxt/flushResource', { type, id, prefix: '' })
    expect(store.state.druxt.resources[type][id]['']).toBe(undefined)
    expect(store.state.druxt.resources[type][id].en).toBeTruthy()
  })

  test('flushCollection by type and prefix, by query, and for nothing stored', async () => {
    const type = 'node--page'
    const collection = await getMockCollection(type)
    const add = (prefix, hash) => store.commit('druxt/addCollection', { collection: { ...collection }, type, prefix, hash })

    // A prefix across every query of the type.
    add('en', 'a')
    add('en', 'b')
    add('es', 'a')
    store.commit('druxt/flushCollection', { type, prefix: 'en' })
    expect(store.state.druxt.collections[type].a.en).toBe(undefined)
    expect(store.state.druxt.collections[type].b.en).toBe(undefined)
    expect(store.state.druxt.collections[type].a.es).toBeTruthy()

    // The query a collection was fetched with, instead of its hash.
    const query = new DrupalJsonApiParams().addFilter('status', '1')
    mockAxios.reset()
    await store.dispatch('druxt/getCollection', { type, query, prefix: 'en' })
    const [stored] = Object.keys(store.state.druxt.collections[type]).filter((h) => !['a', 'b'].includes(h))
    expect(store.state.druxt.collections[type][stored].en).toBeTruthy()
    store.commit('druxt/flushCollection', { type, query, prefix: 'en' })
    expect(store.state.druxt.collections[type][stored].en).toBe(undefined)

    // A flush of keys never stored leaves the state as it was.
    expect(() => store.commit('druxt/flushCollection', { type: 'node--never' })).not.toThrow()
    expect(() => store.commit('druxt/flushCollection', { type: 'node--never', hash: 'x', prefix: 'en' })).not.toThrow()
    expect(() => store.commit('druxt/flushCollection', { type, hash: 'missing' })).not.toThrow()
  })

  test('getCollection fetches again after the collection is flushed', async () => {
    const type = 'node--page'
    const query = new DrupalJsonApiParams().addFilter('status', '1')
    await store.dispatch('druxt/getCollection', { type, query, prefix: 'en' })
    store.commit('druxt/flushCollection', { type, query, prefix: 'en' })
    mockAxios.reset()
    await store.dispatch('druxt/getCollection', { type, query, prefix: 'en' })
    expect(mockAxios.get).toHaveBeenCalled()
  })

  test('flushResource', async () => {
    const type = 'node--page'
    const prefix = 'en'

    // Ensure that the results state is populated.
    const resource = await getMockResource(type)
    const id = resource.data.id
    const add = (p = prefix) => store.commit('druxt/addResource', { prefix: p, resource: { ...resource } })
    add()
    expect(store.state.druxt.resources[type][id][prefix]).toBeTruthy()

    store.commit('druxt/flushResource', { type, id, prefix })
    expect(store.state.druxt.resources[type][id][prefix]).toBe(undefined)

    add()
    store.commit('druxt/flushResource', { type, id })
    expect(store.state.druxt.resources[type][id]).toBe(undefined)

    add()
    store.commit('druxt/flushResource', { type })
    expect(store.state.druxt.resources[type]).toBe(undefined)

    add()
    store.commit('druxt/flushResource', {})
    expect(store.state.druxt.resources).toStrictEqual({})
  })

  test('flushResource by type and prefix, and for nothing stored', async () => {
    const type = 'node--page'
    const resource = await getMockResource(type)
    const id = resource.data.id
    store.commit('druxt/addResource', { prefix: 'en', resource: { ...resource } })
    store.commit('druxt/addResource', { prefix: 'es', resource: { ...resource } })
    store.commit('druxt/flushResource', { type, prefix: 'en' })
    expect(store.state.druxt.resources[type][id].en).toBe(undefined)
    expect(store.state.druxt.resources[type][id].es).toBeTruthy()

    expect(() => store.commit('druxt/flushResource', { type: 'node--never', id: 'x' })).not.toThrow()
    expect(() => store.commit('druxt/flushResource', { type: 'node--never', id: 'x', prefix: 'en' })).not.toThrow()
    expect(() => store.commit('druxt/flushResource', { type, id: 'missing' })).not.toThrow()
  })

  test('getResource with an include fetches again after the resource is flushed', async () => {
    const type = 'node--recipe'
    const resource = await getMockResource(type)
    const { id } = resource.data
    await store.dispatch('druxt/getResource', { type, id, prefix: 'en' })
    store.commit('druxt/flushResource', { type, id, prefix: 'en' })
    mockAxios.reset()
    await expect(store.dispatch('druxt/getResource', { type, id, prefix: 'en', query: { include: 'field_media_image' } })).resolves.toBeTruthy()
    expect(mockAxios.get).toHaveBeenCalled()
  })
})
