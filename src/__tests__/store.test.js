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
    // store.app = { context: { error: jest.fn() }}
    DruxtSchemaStore({ store })
  })

  test('init', () => {
    expect(() => { DruxtSchemaStore({})({}) }).toThrow('Vuex store not found.')
  })
})
