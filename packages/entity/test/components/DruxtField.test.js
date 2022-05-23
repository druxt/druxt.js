import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import { getMockResource } from 'druxt-test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { DruxtSchemaStore } from '../../../schema/src'
import DruxtEntity from '../../src/components/DruxtEntity.vue'
import DruxtField from '../../src/components/DruxtField.vue'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.component('DruxtEntity', DruxtEntity)
localVue.use(Vuex)

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
    }
  },
  $route: { meta: {} }
}

const mountComponent = async ({ data, entity, field, mode = 'default', options = {}, uuid, schema }) => {
  data = data || { ...entity.attributes, ...entity.relationships }

  if (!schema) {
    schema = require(`../../../../test/__fixtures__/schemas/${entity.type}--${mode}--view.json`)
  }

  const fieldSchema = schema.fields.find(element => element.id === field)

  const propsData = {
    data: data[field],
    schema: {
      config: schema.config,
      ...fieldSchema,
    },
    value: data[field],
    relationship: !!entity.relationships[field]
  }

  return mount(DruxtField, { ...options, localVue, mocks, propsData, store })
}

describe('DruxtField', () => {
  beforeEach(() => {
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

  test('defaults', async () => {
    const mockPage = await getMockResource('node--page')
    const wrapper = await mountComponent({
      entity: mockPage.data,
      field: 'body',
      uuid: mockPage.data.id,
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
    expect(wrapper.vm.isBoolean).toStrictEqual(false)
    expect(wrapper.vm.isDateTime).toStrictEqual(false)
    expect(wrapper.vm.isFile).toStrictEqual(false)
    expect(wrapper.vm.isImage).toStrictEqual(false)
    expect(wrapper.vm.isLink).toStrictEqual(false)
    expect(wrapper.vm.isMultiple).toStrictEqual(false)
    expect(wrapper.vm.isText).toStrictEqual(false)

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
    expect(Object.keys(wrapper.vm.getScopedSlots())).toStrictEqual([
      'label',
      'field-0',
      'default',
    ])

    const h = jest.fn()
    const slotsMock = {
      ...mocks,
      component: {
        options: ['DruxtFieldTest'],
      },
      label: {
        position: 'above',
        text: 'Label',
      },
      schema: {
        label: {
          text: 'Label',
        },
      },
    }
    expect(Object.keys(DruxtField.druxt.slots.call(slotsMock, h))).toStrictEqual([
      'label',
      'label-above',
      'field-0',
      'default',
    ])

    slotsMock.label.position = 'inline'
    slotsMock.$nuxt.context.isDev = true
    const slots = DruxtField.druxt.slots.call(slotsMock, h)
    expect(Object.keys(slots)).toStrictEqual([
      'label',
      'label-inline',
      'field-0',
      'default'
    ])
    slots.default({})
  })

  test('body - view', async () => {
    // Register custom wrapper component.
    localVue.component('DruxtFieldTextDefault', {
      render(h) {
        return h('slot')
      }
    })

    const mockPage = await getMockResource('node--page')
    const wrapper = await mountComponent({
      entity: mockPage.data,
      field: 'body',
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtField.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe('DruxtField:body:0')

    // Computed props.
    expect(wrapper.vm.data).toStrictEqual(wrapper.vm.model)
    expect(wrapper.vm.isBoolean).toStrictEqual(false)
    expect(wrapper.vm.isDateTime).toStrictEqual(false)
    expect(wrapper.vm.isFile).toStrictEqual(false)
    expect(wrapper.vm.isImage).toStrictEqual(false)
    expect(wrapper.vm.isLink).toStrictEqual(false)
    expect(wrapper.vm.isMultiple).toStrictEqual(false)
    expect(wrapper.vm.isText).toStrictEqual(false)

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

  test('boolean - form', async () => {
    const mockPage = await getMockResource('node--page')
    const wrapper = await mountComponent({
      entity: mockPage.data,
      field: 'status',
      schema: {
        config: { schemaType: 'form' },
        fields: [{
          id: 'status',
          type: 'boolean_checkbox',
        }],
      },
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Rendered element.
    expect(wrapper.vm.isBoolean).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()

    // Input.
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.exists()).toBe(true)
    expect(wrapper.vm.model).toBe(true)
    input.trigger('click')
    // expect(wrapper.vm.model).toBe(false)
  })

  test('datetime - form', async () => {
    const mockPage = await getMockResource('node--page')
    const wrapper = await mountComponent({
      entity: mockPage.data,
      field: 'created',
      schema: {
        config: { schemaType: 'form' },
        fields: [{
          id: 'created',
          settings: { display: {} },
          type: 'datetime_timestamp',
        }],
      },
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Rendered element.
    expect(wrapper.vm.isDateTime).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()

    // Input.
    const input = wrapper.find('input[type="datetime-local"]')
    expect(input.exists()).toBe(true)
    expect(input.element.value).toBe('2021-10-25T00:48:44.000')
    input.element.value = '2021-07-03T16:20'
    input.trigger('input')
    expect(wrapper.vm.model).toBe('2021-07-03T16:20+00:00')
  })

  test('file - view', async () => {
    const mockImage = await getMockResource('media--image')
    const wrapper = await mountComponent({
      components: { DruxtEntity },
      entity: mockImage.data,
      field: 'field_media_image',
      schema: {
        config: { schemaType: 'view' },
        fields: [{
          id: 'field_media_image',
          settings: { display: {} },
          type: 'file_default',
        }],
      },
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)
    const entity = wrapper.findComponent(DruxtEntity)
    expect(entity.exists()).toBe(true)
    await entity.vm.$options.fetch.call(entity.vm)

    // Rendered element.
    expect(wrapper.vm.isFile).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('image - view', async () => {
    const mockImage = await getMockResource('media--image')
    const wrapper = await mountComponent({
      components: { DruxtEntity },
      entity: mockImage.data,
      field: 'field_media_image',
      schema: {
        config: { schemaType: 'view' },
        fields: [{
          id: 'field_media_image',
          settings: { display: {} },
          type: 'image',
        }],
      },
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)
    const entity = wrapper.findComponent(DruxtEntity)
    expect(entity.exists()).toBe(true)
    await entity.vm.$options.fetch.call(entity.vm)

    // Rendered element.
    expect(wrapper.vm.isImage).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('link - view', async () => {
    const mockPage = await getMockResource('node--page')
    const wrapper = await mountComponent({
      entity: mockPage.data,
      field: 'field_link',
      schema: {
        config: { schemaType: 'view' },
        fields: [{
          id: 'field_link',
          settings: { display: {} },
          type: 'link',
        }],
      },
      data: { field_link: {
        title: 'DruxtJS',
        uri: 'https://druxtjs.org',
      }},
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Rendered element.
    expect(wrapper.vm.isLink).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('text - form', async () => {
    const mockPage = await getMockResource('node--page')
    const wrapper = await mountComponent({
      entity: mockPage.data,
      field: 'title',
      schema: {
        config: { schemaType: 'form' },
        fields: [{
          id: 'title',
          settings: { display: {} },
          type: 'string_textfield',
        }],
      },
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Rendered element.
    expect(wrapper.vm.isText).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()

    // Input.
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(wrapper.vm.model).toBe('About Umami')
    input.element.value = 'Test'
    input.trigger('input')
    expect(wrapper.vm.model).toBe('Test')
  })

  test('relationship - view', async () => {
    const mockArticle = await getMockResource('node--article')
    const wrapper = await mountComponent({
      entity: mockArticle.data,
      field: 'field_media_image',
      mode: 'card',
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtField.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe('DruxtField:field_media_image:0')

    // Computed props.
    expect(wrapper.vm.data).toStrictEqual(wrapper.vm.model)
    expect(wrapper.vm.isBoolean).toStrictEqual(false)
    expect(wrapper.vm.isDateTime).toStrictEqual(false)
    expect(wrapper.vm.isFile).toStrictEqual(false)
    expect(wrapper.vm.isImage).toStrictEqual(false)
    expect(wrapper.vm.isLink).toStrictEqual(false)
    expect(wrapper.vm.isMultiple).toStrictEqual(false)
    expect(wrapper.vm.isText).toStrictEqual(false)

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

  test('fallback - form', async () => {
    const mockPage = await getMockResource('node--page')
    const wrapper = await mountComponent({
      entity: mockPage.data,
      field: 'path',
      schema: {
        config: { schemaType: 'form' },
        fields: [{
          id: 'path',
          settings: { display: {} },
        }],
      },
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Rendered element.
    expect(wrapper.html()).toMatchSnapshot()

    // Input.
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(wrapper.vm.model).toStrictEqual({
      alias: '/about-umami',
      langcode: 'en',
      pid: 101,
    })
    textarea.element.value = 'Test'
    textarea.trigger('input')
    expect(wrapper.vm.model).toBe('Test')
  })
})
