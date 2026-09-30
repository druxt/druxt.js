import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtMenuStore } from '../../src'

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

  test('get - a flush during the request drops the menu', async () => {
    const pending = []
    store.$druxtMenu.get = jest.fn(() => new Promise((resolve) => pending.push(resolve)))

    const before = store.dispatch('druxtMenu/get', 'main')
    await Promise.resolve()
    store.commit('druxtMenu/flushEntities', {})

    // Nothing from before the flush is stored.
    pending[0]({ entities: [{ id: 'stale' }] })
    await before
    expect(store.state.druxtMenu.entities).toStrictEqual({})

    // A call after the flush is stored.
    const after = store.dispatch('druxtMenu/get', 'main')
    await Promise.resolve()
    pending[1]({ entities: [{ id: 'fresh' }] })
    await after
    expect(Object.keys(store.state.druxtMenu.entities[undefined])).toStrictEqual(['fresh'])
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
