import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtModule } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()

describe('DruxtModule component', () => {
  test('defaults', async () => {
    const mocks = { $fetchState: { pending: true } }
    const wrapper = mount(DruxtModule, { localVue, mocks })
    await DruxtModule.fetch.call(wrapper.vm)

    // Data.
    expect(wrapper.vm.component).toStrictEqual({})

    // Methods.
    expect(wrapper.vm.getModuleComponents()).toStrictEqual([])
    expect(wrapper.vm.getModulePropsData()).toStrictEqual({})
    expect(Object.keys(wrapper.vm.getScopedSlots())).toStrictEqual(['default'])
    expect(await wrapper.vm.getWrapperData(wrapper.vm.component.is)).toStrictEqual({
      druxt: {},
      props: {},
    })

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

    const mocks = { $fetchState: { pending: false } }
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
    expect(await wrapper.vm.getWrapperData(wrapper.vm.component.is)).toStrictEqual({
      druxt: {},
      props: {},
    })

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

    const mocks = { $fetchState: { pending: false } }
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
