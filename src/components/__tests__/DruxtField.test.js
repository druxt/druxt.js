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

const mocks = {
  $fetchState: {
    pending: false
  },
  $nuxt: {
    context: {
      isDev: false,
    }
  },
}

const mountComponent = async ({ field, bundle, uuid, mode = 'default', options = {} }) => {
  const entity = (await store.$druxt.getResource(`node--${bundle}`, uuid)).data
  const schema = require(`../../__fixtures__/schemas/node--${bundle}--${mode}--view.json`)

  const fieldSchema = schema.fields.find(element => element.id === field)

  const data = {
    ...entity.attributes,
    ...entity.relationships
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

    // Props.
    expect(wrapper.vm.errors).toStrictEqual([])
    expect(wrapper.vm.relationship).toBe(false)
    expect(wrapper.vm.schema).toStrictEqual(expect.any(Object))
    expect(wrapper.vm.options).toStrictEqual({})
    expect(wrapper.vm.value).toStrictEqual(expect.any(Object))

    // Fetch key.
    expect(DruxtField.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe('DruxtField:body:0')

    // Data.
    expect(wrapper.vm.model).toStrictEqual(wrapper.vm.value)

    // Computed.
    expect(wrapper.vm.data).toStrictEqual(wrapper.vm.value)
    expect(wrapper.vm.lebl).toStrictEqual(undefined)

    // DruxtModule
    expect(wrapper.vm.component).toStrictEqual({
      $attrs: {},
      is: 'DruxtWrapper',
      options: [],
      props: {},
      propsData: {},
      settings: {},
      slots: [],
    })

    // Slots.
    expect(Object.keys(wrapper.vm.getScopedSlots())).toStrictEqual(['label'])

    const h = jest.fn()
    const slotsMock = {
      ...mocks,
      component: {
        options: ['DruxtFieldTest'],
      },
      label: {
        position: 'above'
      },
      schema: {
        label: {
          text: 'Label',
        },
      },
    }
    expect(Object.keys(DruxtField.druxt.slots.call(slotsMock, h))).toStrictEqual(['label', 'label-above'])
    
    slotsMock.label.position = 'inline'
    slotsMock.$nuxt.context.isDev = true
    const slots = DruxtField.druxt.slots.call(slotsMock, h)
    expect(Object.keys(slots)).toStrictEqual(['label', 'label-inline', 'default'])
    slots.default({})
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

    // Computed props
    expect(wrapper.vm.data).toStrictEqual(wrapper.vm.model)

    // DruxtModule.
    expect(wrapper.vm.component.is).toBe('DruxtFieldTextDefault')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtFieldTextDefaultBodyView',
      'DruxtFieldTextDefaultBody',
      'DruxtFieldTextDefaultView',
      'DruxtFieldDefaultView',
      'DruxtFieldTextDefault',
      'DruxtFieldDefault',
    ])
    expect(Object.keys(wrapper.vm.value)).toStrictEqual(['value', 'format', 'processed', 'summary'])
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

    // Computed props
    expect(wrapper.vm.data).toStrictEqual(wrapper.vm.model)

    // DruxtModule.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtFieldEntityReferenceEntityViewFieldMediaImageView',
      'DruxtFieldEntityReferenceEntityViewFieldMediaImage',
      'DruxtFieldEntityReferenceEntityViewView',
      'DruxtFieldDefaultView',
      'DruxtFieldEntityReferenceEntityView',
      'DruxtFieldDefault',
    ])
    expect(Object.keys(wrapper.vm.value)).toStrictEqual(['data', 'links'])
  })
})
