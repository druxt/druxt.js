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
  describe('get - in a language', () => {
    const built = {
      id: 'node--recipe--default--view',
      resourceType: 'node--recipe',
      fields: [
        { id: 'field_preparation_time', description: 'Minutes', label: { text: 'Preparation time', position: 'above' } },
        { id: 'field_difficulty', description: null, label: { text: 'Difficulty', position: 'inline' } },
      ],
    }
    const spanish = {
      'node--recipe': { field_preparation_time: { label: 'Tiempo de preparación', description: 'Minutos' } },
    }
    const resource = { resourceType: 'node--recipe', langcode: 'es' }

    beforeEach(() => {
      store.$druxtSchema.import = jest.fn(async () => JSON.parse(JSON.stringify(built)))
      store.$druxtSchema.labels = jest.fn(async (langcode) => (langcode === 'es' ? spanish : {}))
    })

    test('gives the schema with the labels the language translates', async () => {
      const schema = await store.dispatch('druxtSchema/get', resource)

      expect(schema.fields[0]).toStrictEqual({
        id: 'field_preparation_time',
        description: 'Minutos',
        label: { text: 'Tiempo de preparación', position: 'above' },
      })
      expect(schema.fields[1]).toStrictEqual(built.fields[1])
    })

    test('leaves the built schema in the default language', async () => {
      await store.dispatch('druxtSchema/get', resource)

      expect(await store.dispatch('druxtSchema/get', { resourceType: 'node--recipe' })).toStrictEqual(built)
    })

    test('loads a language\'s labels once, for every schema', async () => {
      const first = await store.dispatch('druxtSchema/get', resource)
      await store.dispatch('druxtSchema/get', { ...resource, mode: 'teaser' })

      expect(await store.dispatch('druxtSchema/get', resource)).toBe(first)
      expect(store.$druxtSchema.labels).toHaveBeenCalledTimes(1)
    })

    test('the built schema for a language without translated labels', async () => {
      const schema = await store.dispatch('druxtSchema/get', { ...resource, langcode: 'en' })

      expect(schema).toBe(store.state.druxtSchema.schemas['node--recipe--default--view'])
    })

    test('the built schema when the labels can\'t be loaded', async () => {
      store.$druxtSchema.labels = jest.fn(async () => { throw new Error('No labels') })

      expect(await store.dispatch('druxtSchema/get', resource)).toStrictEqual(built)
    })

    test('a flush loads the labels again', async () => {
      await store.dispatch('druxtSchema/get', resource)
      store.commit('druxtSchema/flushSchemas')
      await store.dispatch('druxtSchema/get', resource)

      expect(store.$druxtSchema.labels).toHaveBeenCalledTimes(2)
    })
  })
})
