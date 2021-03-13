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
    expect(wrapper.vm.component).toStrictEqual({})

    // Methods.
    expect(wrapper.vm.getModuleComponents()).toStrictEqual([])
    expect(wrapper.vm.getModulePropsData()).toStrictEqual({})

    const scopedSlots = wrapper.vm.getScopedSlots()
    expect(Object.keys(scopedSlots)).toStrictEqual(['default'])
    expect(typeof scopedSlots.default()).toBe('object')

    expect(await wrapper.vm.getWrapperData(wrapper.vm.component.is)).toStrictEqual({ druxt: {}, props: {} })

    const mock = {
      _init: jest.fn(),
      $options: { components: { test: jest.fn(() => ({ druxt: {}, props: {} })) }
    }}
    expect(await DruxtModule.methods.getWrapperData.call(mock, 'test')).toStrictEqual({ druxt: {}, props: {} })

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
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
      is: 'DruxtWrapper',
      options: [],
      propsData: { foo: 'bar' },
      settings: {},
    })

    // Methods.
    expect(wrapper.vm.getModuleComponents()).toStrictEqual([])
    expect(wrapper.vm.getModulePropsData()).toStrictEqual({ foo: 'bar' })
    expect(Object.keys(wrapper.vm.getScopedSlots())).toStrictEqual(['default'])
    expect(await wrapper.vm.getWrapperData(wrapper.vm.component.is)).toStrictEqual({ druxt: {}, props: {} })

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
      is: 'CustomModuleWrapper',
      options: ['CustomModuleWrapper'],
      propsData: { foo: 'bar' },
      settings: { foo: 'bar' },
    })

    // Methods.
    expect(wrapper.vm.getModuleComponents()).toStrictEqual([{
      global: true,
      name: 'CustomModuleWrapper',
      parts: ['Wrapper']
    }])
    expect(wrapper.vm.getModulePropsData()).toStrictEqual({ foo: 'bar' })
    expect(Object.keys(wrapper.vm.getScopedSlots())).toStrictEqual(['default'])

    const wrapperData = await wrapper.vm.getWrapperData(wrapper.vm.component.is)
    expect(wrapperData.druxt).toStrictEqual({ foo: 'bar' })
    expect(Object.keys(wrapperData.props)).toStrictEqual(['foo'])

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})
