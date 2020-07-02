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
  const propsData = {
    uuid: entity.id
  }

  store.commit('druxtRouter/addEntity', entity)

  return mount(DruxtBlock, { localVue, propsData, store, ...options })
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

    expect(wrapper.vm.uuid).toBe('test-block')
    expect(wrapper.vm.type).toBe('block--block')

    expect(wrapper.vm.suggestionDefaults.length).toBe(4)
    expect(wrapper.vm.suggestionDefaults[0].value).toBe('DruxtBlockPluginRegionTheme')

    expect(wrapper.vm.suggestions.length).toBe(4)
    expect(wrapper.vm.component).toBe('div')

    expect(wrapper.vm.tokens).toHaveProperty('prefix')
    expect(wrapper.vm.tokens).toHaveProperty('plugin')
    expect(wrapper.vm.tokens).toHaveProperty('pluginId')
    expect(wrapper.vm.tokens).toHaveProperty('region')
    expect(wrapper.vm.tokens).toHaveProperty('theme')

    expect(wrapper.vm.tokenType).toBe('block')
  })

  test('pluginId', async () => {
    mockBlock.attributes.plugin = 'plugin:pluginId'
    const wrapper = mountComponent(mockBlock)

    expect(wrapper.vm.suggestionDefaults.length).toBe(8)

    expect(wrapper.vm.tokens.plugin).toBe('Plugin')
    expect(wrapper.vm.tokens.pluginId).toBe('PluginId')
  })
})