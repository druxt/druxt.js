import 'regenerator-runtime/runtime'
import mockAxios from 'jest-mock-axios'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import DruxtBlockBlockContent from '../../../src/components/blocks/DruxtBlockBlockContent.vue'

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
    const block = await require('../../../../../test/__fixtures__/get/5e3aea201efde04be147f0f9297059de.json')
    store.commit('druxt/addResource', { resource: block })

    const wrapper = mountComponent(block.data)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.propsData).toStrictEqual({
      key: 'block_content:banner_block:9aadf4a1-ded6-4017-a10d-a5e043396edf',
      type: 'block_content--banner_block',
      uuid: '9aadf4a1-ded6-4017-a10d-a5e043396edf'
    })
  })
})
