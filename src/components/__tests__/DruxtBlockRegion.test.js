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

let store

const mountComponent = (name = null, options = {}) => {
  const propsData = { theme: 'umami' }
  if (name) {
    propsData.name = name
  }

  const mocks = {
    $fetchState: { pending: true },
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
    store.state.druxtRouter.route = {
      isHomePath: true,
      resolvedPath: '/en/node',
    }

    store.app = { context: { error: jest.fn() }, store }
  })

  test('default', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.name).toBe('content')
    expect(wrapper.vm.theme).toBe('umami')

    expect(wrapper.vm.component.options.length).toBe(3)
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtBlockRegionContentUmami',
      'DruxtBlockRegionContent',
      'DruxtBlockRegionDefault',
    ])

    expect(wrapper.vm.component.is).toBe('DruxtWrapper')

    expect(wrapper.vm.blocks.length).toBe(1)
  })

  test('sort', async () => {
    const wrapper = mountComponent('banner_top')
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.name).toBe('banner_top')
    expect(wrapper.vm.theme).toBe('umami')

    expect(wrapper.vm.component.options.length).toBe(3)
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtBlockRegionBannerTopUmami',
      'DruxtBlockRegionBannerTop',
      'DruxtBlockRegionDefault',
    ])

    expect(wrapper.vm.blocks.length).toBe(3)

    expect(wrapper.vm.blocks[0].attributes.weight < wrapper.vm.blocks[1].attributes.weight).toBeTruthy()
  })
})
