import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtSchemaStore } from '..'

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

    // Get schem by resourceType.
    schema = await store.dispatch('druxtSchema/get', { bundle: 'test' })
    expect(schema).toStrictEqual({})
  })
})
