import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtBlockViewsBlock } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const stubs = ['druxt-view']

const mockBlock = {
  id: 'test-block',
  attributes: {
    settings: {
      id: 'views_block:view_id-display_id'
    }
  }
}

// Setup mock Vuex store.
const store = new Vuex.Store({
  modules: {
    druxtRouter: {
      namespaced: true,
      actions: {
        getResources: jest.fn().mockImplementation(() => Promise.resolve([{
          id: 'uuid'
        }]))
      }
    }
  }
})

const mountComponent = (entity, options = {}) => {
  const mocks = {
    $fetchState: {
      pending: true
    }
  }

  const propsData = { block: entity }

  return mount(DruxtBlockViewsBlock, { localVue, mocks, propsData, store, stubs, ...options })
}

describe('Component - DruxtBlockViewsBlock', () => {
  test('default', async () => {
    const wrapper = mountComponent(mockBlock)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.uuid).toBe('uuid')

    expect(wrapper.vm.propsData).toStrictEqual({
      displayId: 'display_id',
      uuid: 'uuid',
      viewId: 'view_id'
    })
  })
})
