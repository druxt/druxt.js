import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtStore } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

describe('DruxtStore', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
  })

  test('init', () => {
    expect(() => { DruxtStore({}) }).toThrow('Vuex store not found.')
  })
})
