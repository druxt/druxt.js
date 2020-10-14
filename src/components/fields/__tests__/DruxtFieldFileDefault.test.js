import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'
import { DruxtFieldFileDefault } from '..'

jest.mock('axios')

const baseURL = 'https://example.com'

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
  store.commit('druxtRouter/addEntity', entity)

  const mocks = {
    $fetchState: {
      pending: false
    }
  }

  const propsData = {
    items: [link],
    schema: {}
  }

  return shallowMount(DruxtFieldFileDefault, { ...options, localVue, mocks, propsData, store, stubs })
}

describe('Component - DruxtFieldFileDefault', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtRouter = new DruxtRouter(baseURL, {})
    DruxtRouterStore({ store })
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
