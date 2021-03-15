import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtField } from '..'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mountComponent = (field, options = {}) => {
  const entity = require('../../__fixtures__/data/382eec1563f0514319a9de3a48cb658b.json').data
  const schema = require('../../__fixtures__/schemas/node--page--default--view.json')

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

describe('DruxtField', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('default', () => {
    const wrapper = mountComponent('body')
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
  })

  test('body', async () => {
    const wrapper = mountComponent('body', { stubs: ['DruxtFieldTextDefault'] })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.component.is).toBe('DruxtFieldTextDefault')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtFieldTextDefaultBody',
      'DruxtFieldTextDefault'
    ])
    expect(wrapper.vm.component.propsData.items.length).toBe(1)
  })
})
