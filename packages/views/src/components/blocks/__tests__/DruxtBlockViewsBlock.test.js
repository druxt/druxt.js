import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'

import { DruxtBlockViewsBlock } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Setup mock Vuex store.
let store

const stubs = ['druxt-view']

const mockBlock = {
  id: 'test-block',
  attributes: {
    settings: {
      id: 'views_block:featured_articles-block_1'
    }
  }
}

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
  beforeEach(() => {
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('default', async () => {
    const wrapper = mountComponent(mockBlock)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.uuid).toBe('ab193308-95ab-489d-b662-f7305380c41e')

    expect(wrapper.vm.propsData).toStrictEqual({
      displayId: 'block_1',
      uuid: 'ab193308-95ab-489d-b662-f7305380c41e',
      viewId: 'featured_articles'
    })
  })
})
