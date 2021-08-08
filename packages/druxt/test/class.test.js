import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtClass } from '../src/class'

// Setup local vue instance.
const localVue = createLocalVue()

const componentOptions = [
  ['one', 'two', 'three'],
  ['one', 'three']
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
const DruxtTestModuleOneTwoThree = { render: () => ({}) }

let druxt
let wrapper

describe('DruxtJS Class', () => {
  beforeEach(() => {
    druxt = new DruxtClass()

    // Mount vm.
    wrapper = mount(DruxtTestModule, { localVue, stubs: { DruxtTestModuleOneTwoThree } })
    wrapper.vm.$options.druxt = DruxtTestModule.druxt
  })

  test('getComponents', () => {
    let components

    // Get global matches, expect no results.
    expect(druxt.getComponents(wrapper.vm, componentOptions).length).toBe(0)

    // Get all matches, expect 4 results.
    components = druxt.getComponents(wrapper.vm, componentOptions, true)
    expect(components.length).toBe(4)
    expect(components[0].pascal).toBe('OneTwoThree')
    expect(components[1].pascal).toBe('OneTwo')
    expect(components[2].pascal).toBe('OneThree')
    expect(components[3].pascal).toBe('One')

    // Get all matches with custom prefix, expect 4 results.
    components = druxt.getComponents(wrapper.vm, componentOptions, true, 'custom-prefix')
    expect(components.length).toBe(4)
    expect(components[0].prefix).toBe('custom-prefix')
    expect(components[0].pascal).toBe('CustomPrefixOneTwoThree')

    // Get global matches with module name prefix, expect 1 result.
    wrapper.vm.$options.name = 'DruxtTestModule'
    components = druxt.getComponents(wrapper.vm, componentOptions)
    expect(components.length).toBe(1)
    expect(components[0]).toStrictEqual({
      global: true,
      kebab: 'druxt-test-module-one-two-three',
      parts: ['one', 'two', 'three'],
      pascal: 'DruxtTestModuleOneTwoThree',
      prefix: 'druxt-test-module'
    })
  })

  test('getModuleData', async () => {
    // Invoke with no vm.
    expect(await druxt.getModuleData()).toBe(false)

    // Invoke with vm.
    expect(await druxt.getModuleData(wrapper.vm)).toStrictEqual({
      componentOptions: [
        ['one', 'two', 'three'],
        ['one', 'three']
      ],
      propsData: {}
    })

    // Invoke with vm name set.
    wrapper.vm.$options.name = 'DruxtTestModule'
    const moduleData = await druxt.getModuleData(wrapper.vm)
    expect(moduleData.name).toBe('druxt-test-module')
  })
})
