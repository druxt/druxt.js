import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'
import DruxtBlockPageTitleBlock from '../../../src/components/blocks/DruxtBlockPageTitleBlock.vue'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mockBlock = {
  id: 'test-block',
  attributes: {}
}

const mountComponent = (entity, options = {}) => {
  const propsData = { block: entity }

  return mount(DruxtBlockPageTitleBlock, { localVue, propsData, store, ...options })
}

describe('Component - DruxtBlockPageTitleBlock', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()

    DruxtRouterStore({ store })
    store.$druxtRouter = () => new DruxtRouter('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('default', async () => {
    store.commit('druxtRouter/addRoute', { path: '/', route: { label: 'Test' } })
    store.commit('druxtRouter/setRoute', '/')
    const wrapper = mountComponent(mockBlock)

    expect(wrapper.vm.title).toBe('Test')
  })
})
