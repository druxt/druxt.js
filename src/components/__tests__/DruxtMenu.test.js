import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouterStore } from 'druxt-router'

import { DruxtMenu, DruxtMenuComponent, DruxtMenuItemComponent, DruxtMenuStore } from '../..'

jest.mock('axios')

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.component('druxt-menu-item', DruxtMenuItemComponent)

let store

describe('DruxtMenu', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtMenu = () => new DruxtMenu(baseURL, {})
    DruxtMenuStore({ store })
    DruxtRouterStore({ store })
  })

  test('default', async () => {
    const wrapper = shallowMount(DruxtMenuComponent, { store, localVue })

    // Wait for async Axios get requests.
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    await localVue.nextTick()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    await localVue.nextTick()

    // Expect 10 items from the store.
    expect(Object.keys(wrapper.vm.entities).length).toBe(10)

    // Expect 2 items at the root level.
    expect(wrapper.vm.items.length).toBe(2)
  })

  test('depth', async () => {
    const propsData = {
      depth: 2
    }
    const wrapper = shallowMount(DruxtMenuComponent, { propsData, store, localVue })

    // Wait for async Axios get requests.
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    await localVue.nextTick()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    await localVue.nextTick()

    // Expect 10 items from the store.
    expect(Object.keys(wrapper.vm.entities).length).toBe(10)

    // Expect 2 items at the root level.
    expect(wrapper.vm.items.length).toBe(2)
  })
})
