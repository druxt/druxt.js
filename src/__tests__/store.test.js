import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtMenuStore } from '..'

jest.mock('axios')

const baseURL = 'https://example.com'
const stubs = ['b-nav', 'b-nav-item', 'b-nav-item-dropdown']

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

describe('DruxtStore', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
    DruxtMenuStore({ store })
  })

  test('init', () => {
    expect(() => { DruxtMenuStore({}) }).toThrow('Vuex store not found.')
  })
})
