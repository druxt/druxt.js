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
