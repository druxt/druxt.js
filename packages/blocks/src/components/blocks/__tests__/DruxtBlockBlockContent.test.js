import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import mockAxios from 'jest-mock-axios'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtBlockBlockContent } from '..'

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
    const block = await require('../../../__fixtures__/get/e2dbd96a0e597d4d7eb584a94716e8cf.json')
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
