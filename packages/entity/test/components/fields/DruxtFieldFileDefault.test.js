import 'regenerator-runtime/runtime'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from '../../../../druxt/src'
import DruxtFieldFileDefault from '../../../src/components/fields/DruxtFieldFileDefault.vue'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const stubs = ['nuxt-link']
let store

const mountComponent = (link = {}, options) => {
  const entity = {
    type: 'file',
    id: '8500bf6b-75d4-41b6-8385-f5c6eb6906d5',
    attributes: {
      filename: 'file.ext',
      uri: {
        value: 'public://test/file.ext'
      }
    }
  }
  store.commit('druxt/addResource', { resource: { data: entity }})

  const mocks = {
    $fetchState: {
      pending: false
    }
  }

  const propsData = {
    value: [link],
    schema: {}
  }

  return shallowMount(DruxtFieldFileDefault, { ...options, localVue, mocks, propsData, store, stubs })
}

describe('Component - DruxtFieldFileDefault', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('default', async () => {
    const wrapper = mountComponent({
      type: 'file',
      uuid: '8500bf6b-75d4-41b6-8385-f5c6eb6906d5'
    })

    expect(wrapper.vm.entities.length).toBe(0)

    await wrapper.vm.$options.fetch.call(wrapper.vm)
    await wrapper.vm.$forceUpdate()

    expect(wrapper.vm.entities.length).toBe(1)

    expect(wrapper.html()).toMatchSnapshot()
  })
})
