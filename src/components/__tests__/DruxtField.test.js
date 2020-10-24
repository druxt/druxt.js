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

let store

const mountComponent = (uuid, field, options = {}) => {
  const entity = require(`../../__fixtures__/${uuid}.json`).data
  const schema = require(`../../__fixtures__/${entity.type}--default--view.json`)

  const fieldSchema = schema.fields.find(element => element.id === field)

  const data = {
    ...entity.attributes,
    ...entity.relationships
  }

  const mocks = {
    $fetchState: {
      pending: false
    }
  }

  const propsData = {
    data: data[field],
    schema: fieldSchema,
    relationship: !!entity.relationships[field]
  }

  return shallowMount(DruxtField, { ...options, localVue, mocks, propsData, store })
}

describe('Component - DruxtField', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtRouter = new DruxtRouter(baseURL, {})
    DruxtRouterStore({ store })
  })

  test('pages - title', async () => {
    const wrapper = mountComponent('fe00c55d-0335-49d6-964e-a868c0c68f9c', 'title', { stubs: ['DruxtFieldString'] })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.component.is).toBe('DruxtFieldString')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtFieldStringTitle',
      'DruxtFieldString'
    ])
    expect(wrapper.vm.component.propsData.items.length).toBe(1)
  })

  test('component', () => {
    const wrapper = mountComponent('fe00c55d-0335-49d6-964e-a868c0c68f9c', 'title')
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
  })
})
