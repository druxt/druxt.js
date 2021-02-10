import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtFieldEntityReferenceLabel } from '..'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const stubs = ['nuxt-link']
let store

const mountComponent = (link = true, options) => {
  const entity = {
    type: 'pages',
    id: 'fe00c55d-0335-49d6-964e-a868c0c68f9c',
    attributes: {
      title: 'Welcome to Contenta CMS!',
      path: {
        alias: '/welcome'
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
    schema: { settings: { display: { link } }}
  }

  return shallowMount(DruxtFieldEntityReferenceLabel, { ...options, localVue, mocks, propsData, store, stubs })
}

describe('Component - DruxtFieldEntityReferenceLabel', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('link', async () => {
    const wrapper = mountComponent()

    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.entities.length).toBe(1)
    expect(wrapper.vm.component).toBe('nuxt-link')
    expect(wrapper.vm.entities).toStrictEqual([{
      props: {
        to: '/welcome'
      },
      text: 'Welcome to Contenta CMS!'
    }])
  })

  test('no link', async () => {
    const wrapper = mountComponent(false)

    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.entities.length).toBe(1)
    expect(wrapper.vm.component).toBe('span')
    expect(wrapper.vm.entities).toStrictEqual([{
      props: false,
      text: 'Welcome to Contenta CMS!'
    }])
  })
})
