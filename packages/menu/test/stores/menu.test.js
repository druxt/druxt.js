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

  test('get skips the request for a loaded menu', async () => {
    const entities = [{ id: 'test' }]
    store.$druxtMenu.get = jest.fn(() => Promise.resolve({ entities }))

    const fresh = await store.dispatch('druxtMenu/get', { name: 'main', settings: { test: true }, prefix: 'en' })
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(1)
    expect(store.state.druxtMenu.entities.en.test).toStrictEqual({ id: 'test' })

    // An identical repeat returns the same shape without a request.
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
