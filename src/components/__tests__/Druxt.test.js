import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtComponent } from '../..'

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
localVue.component('druxt-test', DruxtTestModule)

describe('Druxt component', () => {
  test('defaults', () => {
    const wrapper = mount(DruxtComponent, { localVue })

    // Props.
    expect(wrapper.vm.module).toBe(undefined)
    expect(wrapper.vm.propsData).toStrictEqual({})
    expect(wrapper.vm.wrapper.component).toBe(undefined)

    // Data.
    expect(wrapper.vm.components.module.component).toBe('div')
    expect(wrapper.vm.components.wrapper.component).toBe('div')
  })

  test('test module', () => {
    const propsData = {
      module: 'test'
    }
    const wrapper = mount(DruxtComponent, { localVue, propsData })

    // Props.
    expect(wrapper.vm.module).toBe('test')
    expect(wrapper.vm.propsData).toStrictEqual({})
    expect(wrapper.vm.wrapper.component).toBe(undefined)

    // Data.
    expect(wrapper.vm.components.module.component).toBe('druxt-test')
    expect(wrapper.vm.components.wrapper.component).toBe('div')

    // Druxt module data.
    const druxtModule = DruxtTestModule.druxt({ vm: wrapper.vm })

    expect(druxtModule.componentOptions).toHaveLength(1)
    expect(wrapper.vm.getComponents(druxtModule.componentOptions, { all: true })).toHaveLength(1)

    expect(druxtModule.propsData).toStrictEqual({})
  })

  test('getComponents', () => {
    const mock = { $options: localVue.options }
    const options = [
      ['component', 'wrapper'],
    ]

    // Expect no results as no components are globally registered.
    expect(DruxtComponent.methods.getComponents.call(mock, options)).toHaveLength(0)

    // Expect 2 results.
    const allResults = DruxtComponent.methods.getComponents.call(mock, options, { all: true })
    expect(allResults).toHaveLength(2)

    expect(allResults[0].global).toBe(false)
    expect(allResults[0].kebab).toBe('component-wrapper')
    expect(allResults[0].pascal).toBe('ComponentWrapper')

    expect(allResults[1].global).toBe(false)
    expect(allResults[1].kebab).toBe('component')
    expect(allResults[1].pascal).toBe('Component')

    // Expect 2 prefixed results.
    const prefixedResults = DruxtComponent.methods.getComponents.call(mock, options, true, 'druxt-test')
    expect(prefixedResults).toHaveLength(2)

    expect(prefixedResults[0].kebab).toBe('druxt-test-component-wrapper')
    expect(prefixedResults[0].pascal).toBe('DruxtTestComponentWrapper')

    // Expect 1 globally registered result.
    localVue.component('component-wrapper', {
      name: 'ComponentWrapper'
    })

    const registeredResults = DruxtComponent.methods.getComponents.call(mock, options)
    expect(registeredResults).toHaveLength(1)

    expect(registeredResults[0].global).toBe(true)
    expect(registeredResults[0].pascal).toBe('ComponentWrapper')
  })

  test('setComponent', () => {
    const wrapper = mount(DruxtComponent, { localVue })

    expect(wrapper.vm.components.module).toStrictEqual({ component: 'div', propsData: {} })
    expect(wrapper.vm.components.wrapper).toStrictEqual({ component: 'div', options: [], propsData: {} })

    wrapper.vm.setComponent('module', 'strong', { id: 'test-strong' })
    expect(wrapper.vm.components.module).toStrictEqual({
      component: 'strong',
      propsData: {
        id: 'test-strong'
      }
    })
    expect(wrapper.vm.components.wrapper).toStrictEqual({ component: 'div', options:[], propsData: {} })
  })

  test('updateWrapperComponent', async () => {
    const propsData = { module: 'test' }
    const wrapper = mount(DruxtComponent, { localVue, propsData })

    // Expect 'div' wrapper.
    expect(wrapper.vm.components.wrapper.component).toBe('div')
    expect(wrapper.vm.components.wrapper.options).toStrictEqual([])

    // Register wrapper component.
    localVue.component('druxt-test-wrapper', { name: 'DruxtTestWrapper' })

    // Trigger updateWrapper() method.
    await wrapper.vm.updateWrapperComponent()

    // Expect wrapper component.
    expect(wrapper.vm.components.wrapper.component).toBe('DruxtTestWrapper')
    expect(wrapper.vm.components.wrapper.options).toStrictEqual([{
      global: true,
      kebab: 'druxt-test-wrapper',
      parts: ['wrapper'],
      pascal: 'DruxtTestWrapper',
      prefix: 'druxt-test'
    }])
  })

  test('updateWrapperComponent - user defined wrapper', async () => {
    const propsData = {
      module: 'test',
      wrapper: { component: 'strong' }
    }
    const wrapper = mount(DruxtComponent, { localVue, propsData })

    // Wait for the module component to be set.
    await localVue.nextTick()

    // Wait for the modeData to be loaded.
    await localVue.nextTick()

    // Expect 'strong' wrapper.
    expect(wrapper.vm.components.wrapper.component).toBe('strong')
    expect(wrapper.vm.components.wrapper.options).toHaveLength(1)
  })
})
