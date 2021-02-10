import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtSchemaStore } from 'druxt-schema'
import { DruxtEntity, DruxtField } from '..'

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.component('DruxtField', DruxtField)

const stubs = ['DruxtEntityNodePage']
let store

const mountComponent = resource => {
  const mocks = {
    $fetchState: {
      pending: false
    }
  }

  const propsData = {
    uuid: resource.data.id,
    type: resource.data.type
  }

  store.commit('druxt/addResource', { resource, hash: '_default' })

  return mount(DruxtEntity, { localVue, mocks, propsData, store, stubs })
}

describe('Component - DruxtEntity', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    DruxtSchemaStore({ store })
    store.$druxtSchema = {
      import: schema => {
        return require(`../../__fixtures__/${schema}.json`)
      }
    }

    store.app = { context: { error: jest.fn() }, store }
  })

  test('pages', async () => {
    const resource = require('../../__fixtures__/fe00c55d-0335-49d6-964e-a868c0c68f9c.json')
    const wrapper = mountComponent(resource)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.html()).toMatchSnapshot()

    expect(wrapper.vm.schema).toHaveProperty('config')
    expect(wrapper.vm.schema).toHaveProperty('fields')
    expect(wrapper.vm.schema).toHaveProperty('groups')
    expect(wrapper.vm.schema).toHaveProperty('id')
    expect(wrapper.vm.schema).toHaveProperty('resourceType')

    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtEntityNodePageDefault',
      'DruxtEntityNodePage',
      'DruxtEntityDefault',
    ])
    expect(wrapper.vm.component.is).toBe('DruxtEntityNodePage')

    expect(Object.keys(wrapper.vm.fields).length).toBe(2)
    expect(Object.values(wrapper.vm.fields)[0].schema.id).toBe('title')

    expect(wrapper.vm.component.propsData).toHaveProperty('entity')
    expect(wrapper.vm.component.propsData).toHaveProperty('fields')
    expect(wrapper.vm.component.propsData).toHaveProperty('schema')
  })
})
