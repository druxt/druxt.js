import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtSchemaStore } from 'druxt-schema'
import { DruxtEntity, DruxtField } from '..'

let localVue

const stubs = ['DruxtEntityNodePage']
let store

const mocks = {
  $druxtEntity: {
    options: {},
  },
  $fetchState: {
    pending: false
  }
}

const mountComponent = (propsData) => {
  return mount(DruxtEntity, { localVue, mocks, propsData, store, stubs })
}

describe('DruxtEntity', () => {
  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(Vuex)
    localVue.component('DruxtField', DruxtField)

    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    DruxtSchemaStore({ store })
    store.$druxtSchema = {
      import: (schema) => {
        return require(`../../__fixtures__/schemas/${schema}.json`)
      }
    }

    store.app = { context: { error: jest.fn() }, store }
  })

  test('node--page', async () => {
    const wrapper = mountComponent({ uuid: '772b174a-796f-4301-a04d-b935a7304fba', type: 'node--page' })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Props.
    expect(wrapper.vm.mode).toBe('default')
    expect(wrapper.vm.type).toBe('node--page')
    expect(wrapper.vm.uuid).toBe('772b174a-796f-4301-a04d-b935a7304fba')

    // Data.
    expect(Object.keys(wrapper.vm.component.$attrs)).toStrictEqual([
      'entity', 'fields', 'schema', 'value'
    ])
    expect(wrapper.vm.component.is).toBe('DruxtEntityNodePage')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtEntityNodePageDefaultView',
      'DruxtEntityNodePageDefault',
      'DruxtEntityNodePage',
      'DruxtEntityDefault',
    ])
    expect(wrapper.vm.component.props).toStrictEqual({})
    expect(Object.keys(wrapper.vm.component.propsData)).toStrictEqual([
      'entity', 'fields', 'schema', 'value',
    ])

    expect(Object.keys(wrapper.vm.entity)).toStrictEqual(['type', 'id', 'links', 'attributes', 'relationships'])
    expect(Object.keys(wrapper.vm.fields)).toStrictEqual(['body'])
    expect(Object.keys(wrapper.vm.schema)).toStrictEqual([
      'id', 'resourceType', 'fields', 'groups', 'config'
    ])

    // Methods.
    expect(wrapper.vm.getQuery(wrapper.vm.component.settings)).toBe(false)

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('node--page - filtered', async () => {
    localVue.component('DruxtEntityNodePageDefault', {
      props: ['entity', 'fields', 'schema', 'value'],
      druxt: {
        query: {
          fields: ['title'],
          schema: true,
        },
      },
      render(h) {
        return h('div', [JSON.stringify(this.entity)])
      }
    })

    const wrapper = mountComponent({ uuid: '772b174a-796f-4301-a04d-b935a7304fba', type: 'node--page' })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Data.
    expect(wrapper.vm.component.$attrs).toStrictEqual({})
    expect(wrapper.vm.component.is).toBe('DruxtEntityNodePageDefault')
    expect(Object.keys(wrapper.vm.component.props)).toStrictEqual([
      'value', 'schema', 'fields', 'entity'
    ])

    expect(Object.keys(wrapper.vm.entity)).toStrictEqual(['type', 'id', 'links', 'attributes'])

    // Methods.
    expect(wrapper.vm.getQuery(wrapper.vm.component.settings).data.fields['node--page']).toBe('body,links,content_moderation_control,title')

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('model', async () => {
    const propsData = { uuid: '772b174a-796f-4301-a04d-b935a7304fba', type: 'node--page' }
    const wrapper = mount(DruxtEntity, { localVue, mocks, propsData, store })

    await wrapper.vm.$options.fetch.call(wrapper.vm)

    wrapper.vm.$refs.body.$emit('input', 'test')
    expect(wrapper.vm.model.attributes.body).toBe('test')
  })

  test('deprecated', () => {
    expect(DruxtEntity.methods.isEmpty()).toBe(true)
    expect(DruxtEntity.methods.isEmpty(false)).toBe(true)
    expect(DruxtEntity.methods.isEmpty({ data: [] })).toBe(true)
    expect(DruxtEntity.methods.isEmpty({ data: false })).toBe(true)
    expect(DruxtEntity.methods.isEmpty({ data: [{}] })).toBe(false)
  })
})
