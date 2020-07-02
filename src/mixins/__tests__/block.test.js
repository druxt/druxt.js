import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'

import { DruxtBlocksBlockMixin } from '../..'

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const component = {
  name: 'DruxtBlockTest',
  mixins: [DruxtBlocksBlockMixin],
  render: () => ({})
}

describe('DruxtBlocksBlockMixin', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtRouter = new DruxtRouter(baseURL, {})
    DruxtRouterStore({ store })
  })

  test('defaults', () => {
    const propsData = {
      block: {
        attributes: {
          settings: {}
        }
      }
    }
    const wrapper = mount(component, { localVue, propsData, store })

    expect(wrapper.vm.settings).toStrictEqual({})
  })
})
