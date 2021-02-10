import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'
import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtBlockRegion } from '..'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const mocks = {
  $druxtRouter: () => ({
    getResources: jest.fn().mockImplementation(query => Promise.resolve({}))
  })
}
let store

const mountComponent = (name = null, options = {}) => {
  const propsData = { theme: 'umami' }
  if (name) {
    propsData.name = name
  }

  return shallowMount(DruxtBlockRegion, { localVue, mocks, propsData, store, ...options })
}

describe('Component - DruxtBlockRegion', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    DruxtRouterStore({ store })
    store.$druxtRouter = () => new DruxtRouter('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('default', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.name).toBe('content')
    expect(wrapper.vm.theme).toBe('umami')

    expect(wrapper.vm.component.options.length).toBe(2)
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtBlockRegionContentUmami',
      'DruxtBlockRegionContent'
    ])

    expect(wrapper.vm.component.is).toBe('DruxtWrapper')

    const watch = {
      ...DruxtBlockRegion.watch,
      $fetch: jest.fn()
    }
    watch.$route()
    expect(watch.$fetch).toHaveBeenCalled()
  })
})