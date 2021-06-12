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

const mountComponent = async ({ field, bundle, uuid, mode = 'default', options = {} }) => {
  const entity = (await store.$druxt.getResource(`node--${bundle}`, uuid)).data
  const schema = require(`../../__fixtures__/schemas/node--${bundle}--${mode}--view.json`)

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
    schema: {
      config: schema.config,
      ...fieldSchema,
    },
    value: data[field],
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

  test('default', async () => {
    const wrapper = await mountComponent({
      bundle: 'page',
      field: 'body',
      uuid: '772b174a-796f-4301-a04d-b935a7304fba',
    })
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')

    // Test v-model emit.
    wrapper.vm.onInput('test')
    expect(wrapper.vm.model).toBe('test')
    expect(wrapper.emitted().input).toStrictEqual([['test']])
  })

  test('body', async () => {
    // Register custom wrapper component.
    localVue.component('DruxtFieldTextDefault', {
      render(h) {
        return h('slot')
      }
    })

    const wrapper = await mountComponent({
      bundle: 'page',
      field: 'body',
      uuid: '772b174a-796f-4301-a04d-b935a7304fba',
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtField.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe('DruxtField:body:0')

    // Component.
    expect(wrapper.vm.component.is).toBe('DruxtFieldTextDefault')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtFieldTextDefaultBodyView',
      'DruxtFieldTextDefaultBody',
      'DruxtFieldTextDefaultView',
      'DruxtFieldDefaultView',
      'DruxtFieldTextDefault',
      'DruxtFieldDefault',
    ])
    expect(wrapper.vm.component.propsData.items.length).toBe(1)
  })

  test('relationship', async () => {
    const wrapper = await mountComponent({
      bundle: 'article',
      field: 'field_media_image',
      mode: 'card',
      uuid: 'ab0c49a4-1e0f-4f02-81da-a7b53f69be9f',
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtField.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe('DruxtField:field_media_image:0')

    // Component.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtFieldEntityReferenceEntityViewFieldMediaImageView',
      'DruxtFieldEntityReferenceEntityViewFieldMediaImage',
      'DruxtFieldEntityReferenceEntityViewView',
      'DruxtFieldDefaultView',
      'DruxtFieldEntityReferenceEntityView',
      'DruxtFieldDefault',
    ])
    expect(wrapper.vm.component.propsData.items.length).toBe(1)
  })
})
