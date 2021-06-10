import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtModule } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()

let mocks

describe('DruxtModule component', () => {
  beforeEach(() => {
    mocks = {
      $createElement: jest.fn(),
      $fetchState: { pending: false },
    }
  })

  test('defaults', async () => {
    mocks.$fetchState.pending = true
    const wrapper = mount(DruxtModule, { localVue, mocks })
    await DruxtModule.fetch.call(wrapper.vm)

    // Data.
    expect(wrapper.vm.component).toStrictEqual({
      $attrs: {},
      is: 'DruxtWrapper',
      options: [],
      props: {},
      propsData: {},
      settings: {},
    })

    // Methods.
    const wrapperData = await wrapper.vm.getWrapperData(wrapper.vm.component.is)
    expect(wrapperData).toStrictEqual({ druxt: {}, props: {} })

    expect(wrapper.vm.getModuleComponents()).toStrictEqual([])
    expect(wrapper.vm.getModulePropsData(wrapperData.props)).toStrictEqual({})

    const scopedSlots = wrapper.vm.getScopedSlots()
    expect(Object.keys(scopedSlots)).toStrictEqual(['default'])
    expect(typeof scopedSlots.default()).toBe('object')

    const mock = {
      _init: jest.fn(),
      $options: { components: { test: jest.fn(() => ({ druxt: {}, props: {} })) }
    }}
    expect(await DruxtModule.methods.getWrapperData.call(mock, 'test')).toStrictEqual({ druxt: {}, props: {} })

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('defaults - v-model', async () => {
    const Component = {
      template: "<DruxtModule v-model='model' ref='module' />",
      components: { DruxtModule },
      data: () => ({ model: null })
    }
    const wrapper = mount(Component, { localVue, mocks, stubs: ['DruxtWrapper'] })

    // Default state.
    expect(wrapper.vm.model).toStrictEqual(null)
    expect(wrapper.vm.$refs.module.component.props.value).toStrictEqual(undefined)
    expect(wrapper.vm.$refs.module.model).toStrictEqual(null)
    expect(wrapper.vm.$refs.module.value).toStrictEqual(null)

    // Change model value.
    await wrapper.setData({ model: { test: true }})

    expect(wrapper.vm.model).toStrictEqual({ test: true })
    expect(wrapper.vm.$refs.module.component.props.value).toStrictEqual({ test: true })
    expect(wrapper.vm.$refs.module.model).toStrictEqual({ test: true })
    expect(wrapper.vm.$refs.module.value).toStrictEqual({ test: true })
  })

  test('custom module - no wrapper', async () => {
    const CustomModule = {
      name: 'CustomModule',
      extends: DruxtModule,
      druxt: {
        componentOptions: () => {},
        propsData: () => ({ foo: 'bar' })
      }
    }

    const wrapper = mount(CustomModule, { localVue, mocks, stubs: ['DruxtWrapper'] })
    await DruxtModule.fetch.call(wrapper.vm)

    // Data.
    expect(wrapper.vm.component).toStrictEqual({
      $attrs: { foo: 'bar' },
      is: 'DruxtWrapper',
      options: [],
      props: {},
      propsData: { foo: 'bar' },
      settings: {},
    })

    // Methods.
    const wrapperData = await wrapper.vm.getWrapperData(wrapper.vm.component.is)
    expect(wrapperData).toStrictEqual({ druxt: {}, props: {} })

    expect(wrapper.vm.getModuleComponents(wrapperData.props)).toStrictEqual([])
    expect(wrapper.vm.getModulePropsData()).toStrictEqual({
      $attrs: { foo: 'bar' },
      props: {},
      propsData: { foo: 'bar' },
    })
    expect(Object.keys(wrapper.vm.getScopedSlots())).toStrictEqual(['default'])

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('custom module - wrapper', async () => {
    localVue.component('CustomModuleWrapper', {
      druxt: { foo: 'bar' },
      props: ['foo'],
      render: () => {}
    })

    const CustomModule = {
      name: 'CustomModule',
      extends: DruxtModule,
      druxt: {
        componentOptions: () => ([['wrapper']]),
        propsData: () => ({ foo: 'bar' }),
      }
    }

    const wrapper = mount(CustomModule, { localVue, mocks, stubs: ['DruxtWrapper'] })
    await DruxtModule.fetch.call(wrapper.vm)

    // Data.
    expect(wrapper.vm.component).toStrictEqual({
      $attrs: {},
      is: 'CustomModuleWrapper',
      options: ['CustomModuleWrapper'],
      props: { foo: 'bar' },
      propsData: { foo: 'bar' },
      settings: { foo: 'bar' },
    })

    // Methods.
    const wrapperData = await wrapper.vm.getWrapperData(wrapper.vm.component.is)
    expect(wrapperData.druxt).toStrictEqual({ foo: 'bar' })
    expect(Object.keys(wrapperData.props)).toStrictEqual(['foo'])

    expect(wrapper.vm.getModuleComponents()).toStrictEqual([{
      global: true,
      name: 'CustomModuleWrapper',
      parts: ['Wrapper']
    }])
    expect(wrapper.vm.getModulePropsData(wrapperData.props)).toStrictEqual({
      $attrs: {},
      props: { foo: 'bar' },
      propsData: { foo: 'bar' },
    })
    expect(Object.keys(wrapper.vm.getScopedSlots())).toStrictEqual(['default'])

    // v-model
    expect(wrapper.vm.model).toBe(null)
    await wrapper.setData({ model: { test: 'true' } })
    expect(wrapper.vm.model).toStrictEqual({ test: 'true' })

    wrapper.vm.$refs.component.$emit('input', { test: false })
    expect(wrapper.vm.model).toStrictEqual({ test: false })

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})
