import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'
import { DruxtField } from '..'

jest.mock('axios')

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const stubs = ['DruxtFieldString']
let store

const mountComponent = (uuid, field, options) => {
  const entity = require(`../../__fixtures__/${uuid}.json`).data
  const schema = require(`../../__fixtures__/${entity.type}--default--view.json`)

  const fieldSchema = schema.fields.find(element => element.id === field)

  const data = {
    ...entity.attributes,
    ...entity.relationships
  }

  const propsData = {
    data: data[field],
    schema: fieldSchema,
    relationship: !!entity.relationships[field]
  }

  return shallowMount(DruxtField, { ...options, localVue, propsData, store, stubs })
}

describe('Component - DruxtField', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtRouter = new DruxtRouter(baseURL, {})
    DruxtRouterStore({ store })
  })

  test('pages - title', () => {
    const wrapper = mountComponent('fe00c55d-0335-49d6-964e-a868c0c68f9c', 'title')

    expect(wrapper.vm.items.length).toBe(1)
    expect(wrapper.vm.component).toBe('DruxtFieldString')
  })
})
