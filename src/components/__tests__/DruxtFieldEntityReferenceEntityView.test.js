import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'
import { DruxtFieldEntityReferenceEntityView } from '..'

jest.mock('axios')

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const stubs = ['druxt-entity']
let store

const mountComponent = (options) => {
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
  store.commit('druxtRouter/addEntity', entity)

  const propsData = {
    items: [{
      type: entity.type,
      uuid: entity.id
    }],
    schema: {}
  }

  return shallowMount(DruxtFieldEntityReferenceEntityView, { ...options, localVue, propsData, store, stubs })
}

describe('Component - DruxtFieldEntityReferenceEntityView', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtRouter = new DruxtRouter(baseURL, {})
    DruxtRouterStore({ store })
  })

  test('default', async () => {
    const wrapper = mountComponent()

    await localVue.nextTick()
    await localVue.nextTick()

    expect(wrapper.vm.mode).toBe('default')
    expect(wrapper.html()).toMatchSnapshot()
  })
})
