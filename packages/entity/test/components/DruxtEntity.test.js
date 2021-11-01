import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'
import { getMockResource } from '../../../test-utils/src'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { DruxtSchemaStore } from '../../../schema/src'
import DruxtEntity from '../../src/components/DruxtEntity.vue'
import DruxtField from '../../src/components/DruxtField.vue'

let localVue

const stubs = ['DruxtDebug', 'DruxtEntityNodePage']
let store

const mocks = {
  $druxt: {
    settings: {},
  },
  $fetchState: {
    pending: false
  },
  $nuxt: {
    context: {
      isDev: false,
    },
  },
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
        return require(`../../../../test/__fixtures__/schemas/${schema}.json`)
      }
    }

    store.app = { context: { error: jest.fn() }, store }
  })

  test('node--page', async () => {
    const mockPage = await getMockResource('node--page')

    const wrapper = mountComponent({ uuid: mockPage.data.id, type: 'node--page' })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtEntity.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe(`DruxtEntity:node--page:${mockPage.data.id}:default:0`)

    expect(mockAxios.get).toHaveBeenCalledTimes(2)

    // Props.
    expect(wrapper.vm.mode).toBe('default')
    expect(wrapper.vm.type).toBe('node--page')
    expect(wrapper.vm.uuid).toBe(mockPage.data.id)

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

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('node--page - filtered', async () => {
    const mockPage = await getMockResource('node--page')

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

    const wrapper = mountComponent({ uuid: mockPage.data.id, type: 'node--page' })
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
  })

  test('node--page - include', async () => {
    const mockPage = await getMockResource('node--page')

    localVue.component('DruxtEntityNodePageDefault', {
      props: ['entity', 'fields', 'schema', 'value'],
      druxt: {
        query: {
          fields: [['title'], ['user--user', ['display_name']]],
          include: ['uid'],
          schema: true,
        },
      },
      render(h) {
        return h('div', [JSON.stringify(this.entity)])
      }
    })

    const wrapper = mountComponent({ uuid: mockPage.data.id, type: 'node--page' })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Data.
    expect(wrapper.vm.component.$attrs).toStrictEqual({})
    expect(wrapper.vm.component.is).toBe('DruxtEntityNodePageDefault')
    expect(Object.keys(wrapper.vm.component.props)).toStrictEqual([
      'value', 'schema', 'fields', 'entity'
    ])

    expect(Object.keys(wrapper.vm.entity)).toStrictEqual(['type', 'id', 'links', 'attributes', 'relationships', 'included'])
    expect(Object.keys(wrapper.vm.entity.included[0])).toStrictEqual([
      'type', 'id', 'links', 'attributes'
    ])

    // Methods.
    expect(wrapper.vm.getQuery(wrapper.vm.component.settings).data.fields['node--page']).toBe('body,links,content_moderation_control,title')
  })


  test('v-model - entity', async () => {
    const model = { attributes: {}, included: undefined, relationships: {}, type: 'node--page' }
    const Component = {
      template: "<DruxtEntity v-model='model' :type='model.type' ref='component' />",
      components: { DruxtEntity },
      data: () => ({ model }),
    }
    const wrapper = mount(Component, { localVue, mocks, store })
    expect(wrapper.vm.$refs.component.entity).toStrictEqual(model)
    expect(wrapper.vm.$refs.component.type).toStrictEqual(model.type)
    expect(wrapper.vm.$refs.component.value).toStrictEqual(model)

    expect(mockAxios.get).toHaveBeenCalledTimes(0)

    const mockData = {
      ...model,
      attributes: {
        body: {
          value: 'Test'
        }
      }
    }

    wrapper.vm.$refs.component.$emit('input', mockData)
    expect(wrapper.vm.model).toStrictEqual(mockData)
  })

  test('v-model - fields', async () => {
    const mockPage = await getMockResource('node--page')

    const propsData = { uuid: mockPage.data.id, type: 'node--page' }
    const wrapper = mount(DruxtEntity, { localVue, mocks, propsData, store })

    await wrapper.vm.$options.fetch.call(wrapper.vm)

    wrapper.vm.$refs.body.$emit('input', 'test')
    expect(wrapper.vm.model.attributes.body).toBe('test')
  })

  test('watch - props $fetch', async () => {
    const $fetch = jest.fn()
    expect($fetch).toHaveBeenCalledTimes(0)
    DruxtEntity.watch.mode.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(1)
    DruxtEntity.watch.schemaType.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(2)
    DruxtEntity.watch.type.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(3)
    DruxtEntity.watch.uuid.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(4)
  })

  test('missing schema', async () => {
    mocks.$nuxt.context.isDev = true
    // TODO : Update test to use { getMockResource } from 'druxt-test-utils'?
    const wrapper = mountComponent({ uuid: '7adbf02c-6e41-40ae-9124-8b4781f9c160', type: 'file--file' })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.schema).toBe(null)
    expect(wrapper.html()).toMatchSnapshot()
  })

  // test('deprecated', () => {
  //   expect(DruxtEntity.methods.isEmpty()).toBe(true)
  //   expect(DruxtEntity.methods.isEmpty(false)).toBe(true)
  //   expect(DruxtEntity.methods.isEmpty({ data: [] })).toBe(true)
  //   expect(DruxtEntity.methods.isEmpty({ data: false })).toBe(true)
  //   expect(DruxtEntity.methods.isEmpty({ data: [{}] })).toBe(false)
  // })
})
