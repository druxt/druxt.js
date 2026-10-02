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

  test('get does not store a menu fetched before a flush', async () => {
    const pending = []
    store.$druxtMenu.get = jest.fn(() => new Promise((resolve) => pending.push(resolve)))

    const before = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    store.commit('druxtMenu/flushEntities', { prefix: 'en' })

    // The flushed request stores nothing and marks nothing loaded, so no
    // stale menu is left behind to serve for good.
    pending[0]({ entities: [{ id: 'stale' }] })
    await before
    expect(store.state.druxtMenu.entities.en).toStrictEqual({})
    expect(store.state.druxtMenu.loaded.en).toStrictEqual({})

    // A get after the flush fetches rather than joining the flushed request.
    const after = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(2)

    pending[1]({ entities: [{ id: 'fresh' }] })
    await after
    expect(store.state.druxtMenu.entities.en.fresh).toStrictEqual({ id: 'fresh' })
    expect(store.state.druxtMenu.entities.en.stale).toBeUndefined()
  })

  test('get during a flushed request does not join it', async () => {
    const pending = []
    store.$druxtMenu.get = jest.fn(() => new Promise((resolve) => pending.push(resolve)))

    const before = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    store.commit('druxtMenu/flushEntities', { prefix: 'en' })

    // The flushed request has not settled yet. Joining it would mean waiting on
    // a result that is already being thrown away.
    const after = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(2)

    pending[1]({ entities: [{ id: 'fresh' }] })
    await after
    expect(store.state.druxtMenu.entities.en.fresh).toStrictEqual({ id: 'fresh' })

    // The flushed request settling last does not undo the fresh menu.
    pending[0]({ entities: [{ id: 'stale' }] })
    await before
    expect(store.state.druxtMenu.entities.en.stale).toBeUndefined()
    expect(store.state.druxtMenu.entities.en.fresh).toStrictEqual({ id: 'fresh' })
  })

  test('get keeps a request a flush for another prefix does not name', async () => {
    const pending = []
    store.$druxtMenu.get = jest.fn(() => new Promise((resolve) => pending.push(resolve)))

    const request = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    store.commit('druxtMenu/flushEntities', { prefix: 'es' })

    pending[0]({ entities: [{ id: 'test' }] })
    await request
    expect(store.state.druxtMenu.entities.en.test).toStrictEqual({ id: 'test' })
    expect(store.state.druxtMenu.loaded.en[JSON.stringify(['main', {}])]).toBe(true)
  })

  test('get keeps the replacement when the flushed request settles last', async () => {
    const pending = []
    store.$druxtMenu.get = jest.fn(() => new Promise((resolve) => pending.push(resolve)))

    const before = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    store.commit('druxtMenu/flushEntities', { prefix: 'en' })

    // The replacement is in flight when the flushed request settles, so the
    // flushed request must not clear the replacement's entry.
    const after = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    pending[0]({ entities: [{ id: 'stale' }] })
    await before

    // A third dispatch still joins the replacement rather than fetching again.
    const third = store.dispatch('druxtMenu/get', { name: 'main', prefix: 'en' })
    await Promise.resolve()
    expect(store.$druxtMenu.get).toHaveBeenCalledTimes(2)

    pending[1]({ entities: [{ id: 'fresh' }] })
    await Promise.all([after, third])
    expect(store.state.druxtMenu.entities.en.fresh).toStrictEqual({ id: 'fresh' })
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
