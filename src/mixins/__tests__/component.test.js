import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtComponentMixin } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()

// Mock Druxt module.
const DruxtTestModule = {
  mixins: [DruxtComponentMixin],
  druxt: () => ({
    componentOptions: [
      ['wrapper', 'component'],
      ['wrapper'],
    ],
    propsData: {}
  }),
  render: () => ({}),
}

// Mock Druxt module wrapper.
const DruxtTestModuleWrapper = { render: () => ({}) }

let wrapper

describe('DruxtComponentMixin', () => {
  beforeEach(() => {
    wrapper = mount(DruxtTestModule, { localVue, stubs: { DruxtTestModuleWrapper } })
  })

  test('data', () => {
    expect(wrapper.vm.component).toStrictEqual({
      is: 'DruxtWrapper',
      options: [],
      propsData: {}
    })
  })

  test('fetch', async () => {
    // No componentOptions, expect default values.
    wrapper.vm.$options.druxt = () => ({})
    await DruxtComponentMixin.fetch.call(wrapper.vm)
    expect(wrapper.vm.component).toStrictEqual({
      is: 'DruxtWrapper',
      options: [],
      propsData: {}
    })

    // No matching global component, expect default values.
    wrapper.vm.$options.druxt = DruxtTestModule.druxt
    await DruxtComponentMixin.fetch.call(wrapper.vm)
    expect(wrapper.vm.component).toStrictEqual({
      is: 'DruxtWrapper',
      options: ['WrapperComponent', 'Wrapper'],
      propsData: {}
    })

    // Expect matching global component.
    wrapper.vm.$options.name = 'DruxtTestModule'
    await DruxtComponentMixin.fetch.call(wrapper.vm)
    expect(wrapper.vm.component).toStrictEqual({
      is: 'DruxtTestModuleWrapper',
      options: ['DruxtTestModuleWrapperComponent', 'DruxtTestModuleWrapper'],
      propsData: {}
    })
  })
})
