import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtBlockPageTitleBlock } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)
const stubs = ['druxt-entity']

let store

const mockBlock = {
  id: 'test-block',
  attributes: {}
}

const mountComponent = (entity, options = {}) => {
  const propsData = { block: entity }

  return mount(DruxtBlockPageTitleBlock, { localVue, propsData, store, stubs, ...options })
}

describe('Component - DruxtBlockPageTitleBlock', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store({
      modules: {
        druxtRouter: {
          namespaced: true,
          state: {
            route: {
              label: 'Test'
            }
          }
        }
      }
    })
  })

  test('default', async () => {
    const wrapper = mountComponent(mockBlock)

    expect(wrapper.vm.title).toBe('Test')
  })
})
