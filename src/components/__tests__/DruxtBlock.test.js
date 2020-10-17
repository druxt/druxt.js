import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'
import { DruxtBlock } from '..'

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mockBlock = {
  id: 'test-block',
  attributes: {
    plugin: 'plugin',
    region: 'region',
    theme: 'theme'
  }
}

const mountComponent = (entity, options = {}) => {
  const mocks = {
    $fetchState: { pending: false }
  }

  const propsData = {
    uuid: entity.id
  }

  store.commit('druxtRouter/addEntity', entity)

  return mount(DruxtBlock, { localVue, mocks, propsData, store, ...options })
}

describe('Component - DruxtBlock', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtRouterStore({ store })
    store.$druxtRouter = new DruxtRouter(baseURL, {})
  })

  test('default', async () => {
    const wrapper = mountComponent(mockBlock)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.uuid).toBe('test-block')
    expect(wrapper.vm.type).toBe('block--block')

    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtBlockPluginRegionTheme',
      'DruxtBlockPluginRegion',
      'DruxtBlockPluginTheme',
      'DruxtBlockPlugin',
    ])

    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
  })

  test('pluginId', async () => {
    mockBlock.attributes.plugin = 'plugin:pluginId'
    const wrapper = mountComponent(mockBlock)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.component.options.length).toBe(8)
  })
})
