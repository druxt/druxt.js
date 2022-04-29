import 'regenerator-runtime/runtime'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import mockAxios from 'jest-mock-axios'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../../../druxt/src'
import DruxtBlockBlockContent from '../../../src/components/blocks/DruxtBlockBlockContent.vue'
import { getMockResource } from '../../../../test-utils/src'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mountComponent = (entity, options = {}) => {
  const propsData = { block: entity }

  const mocks = {
    $fetchState: {
      pending: false,
    },
    $store: store,
    $route: { meta: {} }
  }

  return mount(DruxtBlockBlockContent, { localVue, mocks, propsData, stubs: ['DruxtEntity'], ...options })
}

describe('Component - DruxtBlockBlockContent', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('default', async () => {
    const query = new DrupalJsonApiParams().addFilter('settings.provider', 'block_content')
    const mockBlock = await getMockResource('block--block', query)
    store.commit('druxt/addResource', { resource: mockBlock })

    const wrapper = mountComponent(mockBlock.data)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(Object.keys(wrapper.vm.propsData)).toStrictEqual([
      'key', 'langcode', 'type', 'uuid',
    ])
  })
})
