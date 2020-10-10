import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtClass } from '..'

// Setup local vue instance.
const localVue = createLocalVue()

const componentOptions = [
  ['wrapper', 'component']
]

// Mock Druxt module.
const DruxtTestModule = {
  render: () => ({}),
  druxt: () => ({
    componentOptions,
    propsData: {}
  })
}

// Mock Druxt module wrapper.
const DruxtTestModuleWrapper = { render: () => ({}) }

let druxt
let wrapper

describe('DruxtJS Class', () => {
  beforeEach(() => {
    druxt = new DruxtClass()

    // Mount vm.
    wrapper = mount(DruxtTestModule, { localVue, stubs: { DruxtTestModuleWrapper } })
    wrapper.vm.$options.druxt = DruxtTestModule.druxt
  })

  test('getComponents', () => {
    let components

    // Get global matches, expect no results.
    expect(druxt.getComponents(wrapper.vm, componentOptions).length).toBe(0)

    // Get all matches, expect 2 results.
    components = druxt.getComponents(wrapper.vm, componentOptions, true)
    expect(components.length).toBe(2)
    expect(components[0].pascal).toBe('WrapperComponent'),
    expect(components[1].pascal).toBe('Wrapper'),

    // Get all matches with custom prefix, expect 2 results.
    components = druxt.getComponents(wrapper.vm, componentOptions, true, 'custom-prefix')
    expect(components.length).toBe(2)
    expect(components[0].prefix).toBe('custom-prefix')
    expect(components[0].pascal).toBe('CustomPrefixWrapperComponent')

    // Get global matches with module name prefix, expect 1 result.
    wrapper.vm.$options.name = 'DruxtTestModule'
    components = druxt.getComponents(wrapper.vm, componentOptions)
    expect(components.length).toBe(1)
    expect(components[0]).toStrictEqual({
      global: true,
      kebab: 'druxt-test-module-wrapper',
      parts: ['wrapper'],
      pascal: 'DruxtTestModuleWrapper',
      prefix: 'druxt-test-module'
    })
  })

  test('getModuleData', async () => {
    // Invoke with no vm.
    expect(await druxt.getModuleData()).toBe(false)

    // Invoke with vm.
    expect(await druxt.getModuleData(wrapper.vm)).toStrictEqual({
      componentOptions: [['wrapper', 'component']],
      propsData: {}
    })

    // Invoke with vm name set.
    wrapper.vm.$options.name = 'DruxtTestModule'
    const moduleData = await druxt.getModuleData(wrapper.vm)
    expect(moduleData.name).toBe('druxt-test-module')
  })
})
