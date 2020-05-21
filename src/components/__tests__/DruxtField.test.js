import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'
import { DruxtFieldComponent } from '../..'

jest.mock('axios')

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const stubs = ['DruxtFieldString']
let store

const mountComponent = (options) => {
  const entity = require('../../__fixtures__/fe00c55d-0335-49d6-964e-a868c0c68f9c.json').data
  const schema = require('../../__fixtures__/pages--default--view.json')

  const propsData = {
    data: entity.attributes.title,
    schema: schema.fields[0],
    relationship: false
  }

  return shallowMount(DruxtFieldComponent, { ...options, localVue, propsData, store, stubs })
}

describe('DruxtFieldComponent', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtRouter = new DruxtRouter(baseURL, {})
    DruxtRouterStore({ store })
  })

  test('pages - title', async () => {
    const wrapper = mountComponent()

    expect(wrapper.vm.items.length).toBe(1)
    expect(wrapper.vm.component).toBe('DruxtFieldString')
  })
})
