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
  const propsData = { block: entity }

  const wrapper = mount(DruxtBlockViewsBlock, { localVue, propsData, store, stubs, ...options })
  wrapper.vm.$fetch = DruxtBlockViewsBlock.fetch
  return wrapper
}

describe('Component - DruxtBlockViewsBlock', () => {
  test('default', async () => {
    const wrapper = mountComponent(mockBlock)
    await wrapper.vm.$fetch()

    expect(wrapper.vm.uuid).toBe('uuid')

    expect(wrapper.vm.props).toStrictEqual({
      displayId: 'display_id',
      uuid: 'uuid',
      viewId: 'view_id'
    })
  })
})
