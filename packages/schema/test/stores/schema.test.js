import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtSchemaStore } from '../../src/stores/schema'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

describe('DruxtSchemaStore', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtSchema = {
      import: jest.fn(() => ({}))
    }
    DruxtSchemaStore({ store })
  })

  test('init', () => {
    expect(() => { DruxtSchemaStore({})({}) }).toThrow('Vuex store not found.')
  })

  test('addSchema', () => {
    expect(store.state.druxtSchema.schemas).toStrictEqual({})
    store.commit('druxtSchema/addSchema', { id: 'test', schema: {} })
    expect(store.state.druxtSchema.schemas.test).toStrictEqual({})
  })

  test('get', async () => {
    let schema

    // Ensure store is empty.
    expect(store.state.druxtSchema.schemas).toStrictEqual({})

    // Fail when no ID can be generated.
    schema = await store.dispatch('druxtSchema/get', {})
    expect(schema).toBe(false)

    // Get schema by id.
    schema = await store.dispatch('druxtSchema/get', { id: 'test' })
    expect(schema).toStrictEqual({})
    expect(store.state.druxtSchema.schemas.test).toStrictEqual({})

    // Get schema by resourceType.
    schema = await store.dispatch('druxtSchema/get', { resourceType: 'test' })
    expect(schema).toStrictEqual({})

    // Get schema by resourceType.
    schema = await store.dispatch('druxtSchema/get', { bundle: 'test' })
    expect(schema).toStrictEqual({})
  })
  test('flushSchemas', () => {
    store.commit('druxtSchema/addSchema', { id: 'test', schema: {} })
    store.commit('druxtSchema/flushSchemas')
    expect(store.state.druxtSchema.schemas).toStrictEqual({})
  })

  test('get - a flush during the load loads the schema again', async () => {
    const pending = []
    store.$druxtSchema.import = jest.fn(() => new Promise((resolve) => pending.push(resolve)))

    const request = store.dispatch('druxtSchema/get', { id: 'test' })
    await Promise.resolve()
    store.commit('druxtSchema/flushSchemas')
    pending[0]({ version: 'stale' })
    await new Promise((resolve) => setTimeout(resolve))
    expect(store.state.druxtSchema.schemas).toStrictEqual({})

    pending[1]({ version: 'fresh' })
    expect(await request).toStrictEqual({ version: 'fresh' })
    expect(store.state.druxtSchema.schemas.test).toStrictEqual({ version: 'fresh' })
  })

  test('get - a flush during every load returns the last schema without storing it', async () => {
    store.$druxtSchema.import = jest.fn(async () => {
      store.commit('druxtSchema/flushSchemas')
      return { version: 'last' }
    })

    expect(await store.dispatch('druxtSchema/get', { id: 'test' })).toStrictEqual({ version: 'last' })
    expect(store.$druxtSchema.import).toHaveBeenCalledTimes(3)
    expect(store.state.druxtSchema.schemas).toStrictEqual({})
  })
})
