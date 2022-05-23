import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import Vuex from 'vuex'

import { getMockResource } from '../../../../test-utils/src'
import { DruxtClient, DruxtStore } from '../../../../druxt/src'
import DruxtBlockViewsBlock from '../../../src/components/blocks/DruxtBlockViewsBlock.vue'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Setup mock Vuex store.
let store

const stubs = ['druxt-view']

const mountComponent = (entity, options = {}) => {
  const mocks = {
    $fetchState: {
      pending: true
    },
    $route: { meta: {} }
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
    const blockQuery = new DrupalJsonApiParams().addFilter('drupal_internal__id', 'views_block__promoted_items_block_1')
    const mockBlock = await getMockResource('block--block', blockQuery)
    const viewQuery = new DrupalJsonApiParams().addFilter('drupal_internal__id', 'promoted_items')
    const mockView = await getMockResource('view--view', viewQuery)

    const wrapper = mountComponent(mockBlock.data)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.uuid).toBe(mockView.data.id)

    expect(wrapper.vm.propsData).toStrictEqual({
      displayId: 'block_1',
      langcode: undefined,
      uuid: mockView.data.id,
      viewId: 'promoted_items'
    })
  })
})
