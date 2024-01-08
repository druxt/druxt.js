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

  test('AddEntities', async () => {
    expect(store.state.druxtMenu.entities).toStrictEqual({})
    store.commit('druxtMenu/addEntities', { entities: [{ id: 'test' }] })
    expect(Object.entries(store.state.druxtMenu.entities[undefined]).length).toBe(1)
    expect(store.state.druxtMenu.entities[undefined].test).toStrictEqual({ id: 'test' })
  })

  test('flushEntities', async () => {
    expect(store.state.druxtMenu.entities).toStrictEqual({})
    store.commit('druxtMenu/addEntities', { entities: [{ id: 'test' }] })
    expect(Object.entries(store.state.druxtMenu.entities[undefined]).length).toBe(1)
    store.commit('druxtMenu/flushEntities', { prefix: 'undefined' })
    expect(Object.entries(store.state.druxtMenu.entities[undefined]).length).toBe(0)
    store.commit('druxtMenu/flushEntities', {})
  })
})
