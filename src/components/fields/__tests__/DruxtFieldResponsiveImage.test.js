import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtFieldResponsiveImage } from '../..'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const stubs = ['nuxt-link']
let store

const mountComponent = (options) => {
  const entity = {
    type: 'pages',
    id: 'fe00c55d-0335-49d6-964e-a868c0c68f9c',
    attributes: {
      uri: {
        value: 'public://sites/default/image.jpg'
      }
    }
  }
  store.commit('druxt/addResource', { resource: { data: entity }, hash: '_default' })

  const mocks = {
    $fetchState: {
      pending: false
    }
  }

  const propsData = {
    items: [{
      type: entity.type,
      uuid: entity.id
    }],
    schema: {}
  }

  return shallowMount(DruxtFieldResponsiveImage, { ...options, localVue, mocks, propsData, store, stubs })
}

describe('Component - DruxtFieldResponsiveImage', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('default', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.$options.fetch.call(wrapper.vm)
    await wrapper.vm.$forceUpdate()

    expect(wrapper.vm.entities.length).toBe(1)

    expect(wrapper.html()).toMatchSnapshot()
  })
})
