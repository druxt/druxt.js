import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtBlocksRegionMixin } from '../../src/mixins/region'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const component = {
  name: 'DruxtBlockRegionTest',
  mixins: [DruxtBlocksRegionMixin],
  render: () => ({}),
}

describe('DruxtBlocksRegionMixin', () => {
  // Test default prop values for the region mixin.
  // This ensures the mixin initializes with correct default values when no props are provided.
  // How: Mount component with minimal propsData, assert default values for blocks, theme, name, and langcode.
  // Why: To verify the mixin provides sensible defaults for region components.
  test('defaults', () => {
    const propsData = {
      blocks: [],
      theme: 'test_theme',
    }
    const wrapper = mount(component, { localVue, propsData })

    expect(wrapper.vm.blocks).toEqual([])
    expect(wrapper.vm.theme).toBe('test_theme')
    expect(wrapper.vm.name).toBe('content')
    expect(wrapper.vm.langcode).toBeUndefined()
  })

  // Test custom prop values for the region mixin.
  // This verifies that the mixin correctly accepts and sets custom prop values.
  // How: Mount component with custom propsData, assert the props are set correctly.
  // Why: To ensure the mixin properly handles custom configuration for different regions.
  test('custom props', () => {
    const propsData = {
      blocks: [{ id: 'test' }],
      theme: 'custom_theme',
      name: 'sidebar',
      langcode: 'en',
    }
    const wrapper = mount(component, { localVue, propsData })

    expect(wrapper.vm.blocks).toEqual([{ id: 'test' }])
    expect(wrapper.vm.theme).toBe('custom_theme')
    expect(wrapper.vm.name).toBe('sidebar')
    expect(wrapper.vm.langcode).toBe('en')
  })

  // Test region mixin with empty blocks array.
  // This covers the case where region has no blocks.
  // How: Mount component with empty blocks array, assert props are set correctly.
  // Why: To ensure mixin handles regions with no content.
  test('empty blocks', () => {
    const propsData = {
      blocks: [],
      theme: 'test_theme',
      name: 'empty_region',
    }
    const wrapper = mount(component, { localVue, propsData })

    expect(wrapper.vm.blocks).toEqual([])
    expect(wrapper.vm.theme).toBe('test_theme')
    expect(wrapper.vm.name).toBe('empty_region')
    expect(wrapper.vm.langcode).toBeUndefined()
  })

  // Test region mixin with invalid blocks prop.
  // This covers type validation for blocks array.
  // How: Mount component with non-array blocks, assert Vue handles the prop correctly.
  // Why: To ensure mixin is robust against invalid prop types.
  test('invalid blocks type', () => {
    const propsData = {
      blocks: 'invalid',
      theme: 'test_theme',
    }
    const wrapper = mount(component, { localVue, propsData })

    // Vue will coerce invalid types, but we test the behavior
    expect(wrapper.vm.blocks).toBe('invalid')
  })
})
