import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'
import { DruxtSchemaStore } from 'druxt-schema'
import { DruxtEntity, DruxtField } from '..'

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.component('druxt-field', DruxtField)

const stubs = ['DruxtEntityNodePage', 'DruxtFieldString', 'DruxtFieldTextDefault']
let store

const mountComponent = (entity, options = {}) => {
  const mocks = {
    $druxtEntity: {
      options: {
        entity: {
          suggestions: []
        }
      }
    }
  }
  if (Array.isArray(options.suggestions)) {
    mocks.$druxtEntity.options.entity.suggestions = options.suggestions
  }

  const propsData = {
    uuid: entity.id,
    type: entity.type
  }

  store.commit('druxtRouter/addEntity', entity)

  return mount(DruxtEntity, { localVue, mocks, propsData, store, stubs })
}

describe('Component - DruxtEntity', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtRouterStore({ store })
    store.$druxtRouter = new DruxtRouter(baseURL, {})

    DruxtSchemaStore({ store })
    store.$druxtSchema = {
      import: schema => {
        return require(`../../__fixtures__/${schema}.json`)
      }
    }
  })

  test('pages', async () => {
    const entity = require('../../__fixtures__/fe00c55d-0335-49d6-964e-a868c0c68f9c.json').data
    const wrapper = mountComponent(entity)

    expect(wrapper.vm.component).toBe('div')

    await localVue.nextTick()
    await localVue.nextTick()

    expect(wrapper.html()).toMatchSnapshot()

    expect(wrapper.vm.schema).toHaveProperty('config')
    expect(wrapper.vm.schema).toHaveProperty('fields')
    expect(wrapper.vm.schema).toHaveProperty('groups')
    expect(wrapper.vm.schema).toHaveProperty('id')
    expect(wrapper.vm.schema).toHaveProperty('resourceType')

    expect(wrapper.vm.suggestions).toStrictEqual([
      'DruxtEntityNodePageDefault',
      'DruxtEntityNodePage',
      'DruxtEntityDefault',
    ])
    expect(wrapper.vm.component).toBe('DruxtEntityNodePage')

    expect(Object.keys(wrapper.vm.fields).length).toBe(2)
    expect(Object.values(wrapper.vm.fields)[0].schema.id).toBe('title')

    expect(wrapper.vm.props).toHaveProperty('entity')
    expect(wrapper.vm.props).toHaveProperty('fields')
    expect(wrapper.vm.props).toHaveProperty('schema')

    expect(wrapper.vm.tokenType).toBe('entity')
  })
})
