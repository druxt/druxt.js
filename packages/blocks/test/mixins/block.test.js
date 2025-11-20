import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtBlocksBlockMixin } from '../../src/mixins/block'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const component = {
  name: 'DruxtBlockTest',
  mixins: [DruxtBlocksBlockMixin],
  render: () => ({}),
}

describe('DruxtBlocksBlockMixin', () => {
  // Test default settings when block has attributes and settings.
  // This verifies the mixin correctly extracts settings from block data.
  // How: Mount component with block containing settings, assert settings computed property returns expected object.
  // Why: To ensure block mixins provide access to block configuration.
  test('defaults', () => {
    const propsData = {
      block: {
        attributes: {
          settings: {},
        },
      },
    }
    const wrapper = mount(component, { localVue, propsData })

    expect(wrapper.vm.settings).toStrictEqual({})
  })

  // Test settings when block is missing.
  // This covers the case where block prop is not provided.
  // How: Mount component without block prop, assert settings is undefined.
  // Why: To handle cases where block data is not available.
  test('no block', () => {
    const wrapper = mount(component, { localVue, propsData: {} })

    expect(wrapper.vm.settings).toBeUndefined()
  })

  // Test settings when block attributes are missing.
  // This covers malformed block data.
  // How: Mount component with block but no attributes, assert settings is undefined.
  // Why: To ensure mixin handles incomplete block structures gracefully.
  test('no attributes', () => {
    const propsData = {
      block: {
        // No attributes
      },
    }
    const wrapper = mount(component, { localVue, propsData })

    expect(wrapper.vm.settings).toBeUndefined()
  })

  // Test settings when block settings are missing.
  // This covers blocks with attributes but no settings property.
  // How: Mount component with block attributes but no settings, assert settings is undefined.
  // Why: To handle blocks that don't have configuration data.
  test('no settings', () => {
    const propsData = {
      block: {
        attributes: {
          // No settings
        },
      },
    }
    const wrapper = mount(component, { localVue, propsData })

    expect(wrapper.vm.settings).toBeUndefined()
  })
})
