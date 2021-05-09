import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtMenuStore } from '../..'

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
    expect(store.$druxtMenu.get).toHaveBeenCalledWith('main', undefined)

    await store.dispatch('druxtMenu/get', { name: 'main', settings: { test: true }})
    expect(store.$druxtMenu.get).toHaveBeenCalledWith('main', { test: true })
    // store.dispatch('druxtMenu/get', 'name')
  })
})
