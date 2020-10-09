import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { Druxt } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Mock Druxt module.
const DruxtTestModule = {
  render: () => ({}),
  druxt: () => ({
    componentOptions: [['wrapper']],
    propsData: {}
  })
}

describe('Druxt component', () => {
  test('defaults', async () => {
    const propsData = { module: 'test-module' }
    const wrapper = await mount(Druxt, { localVue, propsData })

    // Props.
    expect(wrapper.vm.module).toBe('test-module')
    expect(wrapper.vm.propsData).toStrictEqual({})
    expect(wrapper.vm.wrapper.component).toBe('div')

    // Data.
    expect(wrapper.vm.component.is).toBe(undefined)
    expect(wrapper.vm.component.propsData).toStrictEqual({})
  })

  test('test module', () => {
    const propsData = { module: 'test-module' }
    const stubs = { DruxtTestModule }
    const wrapper = mount(Druxt, { localVue, propsData, stubs })

    // Props.
    expect(wrapper.vm.module).toBe('test-module')
    expect(wrapper.vm.propsData).toStrictEqual({})
    expect(wrapper.vm.wrapper.component).toBe('div')

    // Data.
    expect(wrapper.vm.component.is).toBe('DruxtTestModule')

    // Druxt module data.
    const druxtModule = DruxtTestModule.druxt({ vm: wrapper.vm })
    expect(druxtModule.componentOptions).toHaveLength(1)
    expect(druxtModule.propsData).toStrictEqual({})
  })
})
