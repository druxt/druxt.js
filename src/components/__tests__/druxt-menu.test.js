import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouterStore } from 'druxt-router'

import { DruxtMenu, DruxtMenuComponent, DruxtMenuStore } from '../..'

jest.mock('axios')

const baseURL = 'https://example.com'
const stubs = ['b-nav', 'b-nav-item', 'b-nav-item-dropdown']

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

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
    const wrapper = shallowMount(DruxtMenuComponent, { store, localVue, stubs })

    // Wait for async Axios get requests.
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    await localVue.nextTick()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    await localVue.nextTick()

    expect(Object.keys(wrapper.vm.entities).length).toBe(10)

    // @TODO - This is for code coverage, needs proper mocking and testing.
    expect(wrapper.vm.route).toStrictEqual({})
  })

  test('depth', async () => {
    const propsData = {
      depth: 2
    }
    const wrapper = shallowMount(DruxtMenuComponent, { propsData, store, localVue, stubs })

    // Wait for async Axios get requests.
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    await localVue.nextTick()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    await localVue.nextTick()

    expect(Object.keys(wrapper.vm.entities).length).toBe(10)

    // @TODO - This is for code coverage, needs proper mocking and testing.
    expect(wrapper.vm.route).toStrictEqual({})
  })
})
