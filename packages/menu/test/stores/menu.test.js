import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtMenu, DruxtMenuStore } from '../../src'
import { runtime } from '../../src/menu'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

describe('DruxtStore', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
    DruxtMenuStore({ store })
    store.$druxtMenu = {
      get: jest.fn()
    }
  })

  test('init', () => {
    expect(() => { DruxtMenuStore({}) }).toThrow('Vuex store not found.')
  })

  test('get', async () => {
    await store.dispatch('druxtMenu/get', 'main')
    expect(store.$druxtMenu.get).toHaveBeenCalledWith('main', undefined, undefined)

    await store.dispatch('druxtMenu/get', { name: 'main', settings: { test: true }})
    expect(store.$druxtMenu.get).toHaveBeenCalledWith('main', { test: true }, undefined)
    store.dispatch('druxtMenu/get', 'name')
  })

  test('get - a flush during the request fetches the menu again', async () => {
    const pending = []
    store.$druxtMenu.get = jest.fn(() => new Promise((resolve) => pending.push(resolve)))

    const request = store.dispatch('druxtMenu/get', 'main')
    await Promise.resolve()
    store.commit('druxtMenu/flushEntities', {})

    // The response from before the flush is neither stored nor returned.
    pending[0]({ entities: [{ id: 'stale' }] })
    await new Promise((resolve) => setTimeout(resolve))
    expect(store.state.druxtMenu.entities).toStrictEqual({})
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(2)

    pending[1]({ entities: [{ id: 'fresh' }] })
    expect(await request).toStrictEqual([{ id: 'fresh' }])
    expect(Object.keys(store.state.druxtMenu.entities[undefined])).toStrictEqual(['fresh'])
  })

  test('get - a clear during the request fetches past the real menu cache', async () => {
    const isServer = runtime.isServer
    runtime.isServer = () => true
    const menu = new DruxtMenu('https://demo-api.druxtjs.org', { menu: { jsonApiMenuItems: true } })
    const pending = []
    menu.getJsonApiMenuItems = jest.fn(() => new Promise((resolve) => pending.push(resolve)))
    store.$druxtMenu = menu

    const request = store.dispatch('druxtMenu/get', 'main')
    await new Promise((resolve) => setTimeout(resolve))
    // The order druxt/clearCache uses: the client cache, then the store.
    menu.druxt.clearCache()
    store.commit('druxtMenu/flushEntities', {})
    pending[0]({ entities: [{ id: 'stale' }] })
    await new Promise((resolve) => setTimeout(resolve))
    expect(menu.getJsonApiMenuItems).toHaveBeenCalledTimes(2)

    pending[1]({ entities: [{ id: 'fresh' }] })
    expect(await request).toStrictEqual([{ id: 'fresh' }])
    expect(Object.keys(store.state.druxtMenu.entities[undefined])).toStrictEqual(['fresh'])
    runtime.isServer = isServer
  })

  test('get - a flush during every attempt stores and returns nothing', async () => {
    store.$druxtMenu.get = jest.fn(async () => {
      store.commit('druxtMenu/flushEntities', {})
      return { entities: [{ id: 'stale' }] }
    })

    expect(await store.dispatch('druxtMenu/get', 'main')).toBe(undefined)
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(3)
    expect(store.state.druxtMenu.entities).toStrictEqual({})
  })

  test('get skips the request for a loaded menu', async () => {
    const entities = [{ id: 'test' }]
    store.$druxtMenu.get = jest.fn(() => Promise.resolve({ entities }))

    const fresh = await store.dispatch('druxtMenu/get', { name: 'main', settings: { test: true }, prefix: 'en' })
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(1)
    expect(store.state.druxtMenu.entities.en.test).toStrictEqual({ id: 'test' })

    // An identical repeat returns the same items without a request.
    const repeat = await store.dispatch('druxtMenu/get', { name: 'main', settings: { test: true }, prefix: 'en' })
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(1)
    expect(repeat).toStrictEqual(fresh)

    // A different name, settings or prefix still fetches.
    await store.dispatch('druxtMenu/get', { name: 'footer', settings: { test: true }, prefix: 'en' })
    await store.dispatch('druxtMenu/get', { name: 'main', settings: { test: false }, prefix: 'en' })
    await store.dispatch('druxtMenu/get', { name: 'main', settings: { test: true }, prefix: 'es' })
    await store.dispatch('druxtMenu/get', 'main')
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(5)

    // The string form and the object form are the same menu.
    await store.dispatch('druxtMenu/get', { name: 'main' })
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(5)
  })

  test('get fetches again after flushEntities', async () => {
    store.$druxtMenu.get = jest.fn(() => Promise.resolve({ entities: [{ id: 'test' }] }))

    await store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await store.dispatch('druxtMenu/get', { name: 'main', prefix: 'es' })
    store.commit('druxtMenu/flushEntities', { prefix: 'en' })
    await store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await store.dispatch('druxtMenu/get', { name: 'main', prefix: 'es' })
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(3)
    expect(store.state.druxtMenu.entities.en.test).toStrictEqual({ id: 'test' })

    store.commit('druxtMenu/flushEntities', {})
    await store.dispatch('druxtMenu/get', { name: 'main', prefix: 'es' })
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(4)
  })

  test('get shares an in-flight request', async () => {
    let resolve
    store.$druxtMenu.get = jest.fn(() => new Promise((r) => { resolve = r }))

    const requests = [1, 2, 3].map(() => store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' }))
    await Promise.resolve()
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(1)

    resolve({ entities: [{ id: 'test' }] })
    await Promise.all(requests)
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(1)
    expect(store.state.druxtMenu.entities.en.test).toStrictEqual({ id: 'test' })
  })

  test('get stores only the menu fetched after a flush of its prefix', async () => {
    const pending = []
    store.$druxtMenu.get = jest.fn(() => new Promise((resolve) => pending.push(resolve)))

    const request = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    store.commit('druxtMenu/flushEntities', { prefix: 'en' })

    // The response from before the flush is neither stored nor marked loaded.
    pending[0]({ entities: [{ id: 'stale' }] })
    await new Promise((resolve) => setTimeout(resolve))
    expect(store.state.druxtMenu.entities.en).toStrictEqual({})
    expect(store.state.druxtMenu.loaded.en).toStrictEqual({})

    pending[1]({ entities: [{ id: 'fresh' }] })
    expect(await request).toStrictEqual([{ id: 'fresh' }])
    expect(store.state.druxtMenu.entities.en.fresh).toStrictEqual({ id: 'fresh' })
    expect(store.state.druxtMenu.entities.en.stale).toBeUndefined()
  })

  test('get during a flushed request joins its retry', async () => {
    const pending = []
    store.$druxtMenu.get = jest.fn(() => new Promise((resolve) => pending.push(resolve)))

    const before = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    store.commit('druxtMenu/flushEntities', { prefix: 'en' })
    const after = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })

    // One request is retried for both callers, not a second request started.
    pending[0]({ entities: [{ id: 'stale' }] })
    await new Promise((resolve) => setTimeout(resolve))
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(2)

    pending[1]({ entities: [{ id: 'fresh' }] })
    expect(await Promise.all([before, after])).toStrictEqual([[{ id: 'fresh' }], [{ id: 'fresh' }]])
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(2)
  })

  test('get keeps a request a flush for another prefix does not name', async () => {
    const pending = []
    store.$druxtMenu.get = jest.fn(() => new Promise((resolve) => pending.push(resolve)))

    const request = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    store.commit('druxtMenu/flushEntities', { prefix: 'es' })

    pending[0]({ entities: [{ id: 'test' }] })
    await request
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(1)
    expect(store.state.druxtMenu.entities.en.test).toStrictEqual({ id: 'test' })
    expect(store.state.druxtMenu.loaded.en[JSON.stringify(['main', {}])]).toStrictEqual(['test'])
  })

  test('get retries after a failed request', async () => {
    store.$druxtMenu.get = jest.fn(() => Promise.reject(new Error('Backend down')))

    const failed = [1, 2].map(() => store.dispatch('druxtMenu/get', 'main'))
    await expect(failed[0]).rejects.toThrow('Backend down')
    await expect(failed[1]).rejects.toThrow('Backend down')
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(1)

    store.$druxtMenu.get.mockImplementation(() => Promise.resolve({ entities: [{ id: 'test' }] }))
    await store.dispatch('druxtMenu/get', 'main')
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(2)
    expect(store.state.druxtMenu.entities[undefined].test).toStrictEqual({ id: 'test' })
  })

  test('AddEntities', async () => {
    expect(store.state.druxtMenu.entities).toStrictEqual({})
    store.commit('druxtMenu/addEntities', { entities: [{ id: 'test' }] })
    expect(Object.entries(store.state.druxtMenu.entities[undefined]).length).toBe(1)
    expect(store.state.druxtMenu.entities[undefined].test).toStrictEqual({ id: 'test' })
  })

  test('getEntitiesByFilter survives a full flush', () => {
    store.commit('druxtMenu/addEntities', { entities: [{ id: 'a' }], prefix: 'en' })

    // What `druxt/clearCache` commits: no prefix, so the whole entities object
    // is replaced and `entities.en` stops existing.
    store.commit('druxtMenu/flushEntities', {})

    // A menu component re-renders on that state change and reads its own prefix
    // back before the next fetch stores it again.
    expect(
      store.getters['druxtMenu/getEntitiesByFilter']({ filter: () => true, prefix: 'en' })
    ).toStrictEqual({})
  })

  test('flushEntities', async () => {
    expect(store.state.druxtMenu.entities).toStrictEqual({})
    store.commit('druxtMenu/addEntities', { entities: [{ id: 'test' }] })
    store.commit('druxtMenu/addEntities', { entities: [{ id: 'test2' }], prefix: 'es' })
    expect(Object.entries(store.state.druxtMenu.entities[undefined]).length).toBe(1)
    store.commit('druxtMenu/flushEntities', { prefix: 'undefined' })
    expect(Object.entries(store.state.druxtMenu.entities[undefined]).length).toBe(0)
    store.commit('druxtMenu/flushEntities', {})
    expect(Object.entries(store.state.druxtMenu.entities).length).toBe(0)
  })
})
