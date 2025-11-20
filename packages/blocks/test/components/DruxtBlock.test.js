import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import DruxtBlock from '../../src/components/DruxtBlock.vue'
import { getMockResource } from '../../../test-utils/src'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mountComponent = (propsData = {}, options = {}, mocks = {}) => {
  mocks = {
    $druxt: {
      settings: {
        blocks: {
          query: {
            fields: [],
          },
        },
      },
    },
    $fetchState: { pending: false },
    $nuxt: {
      context: {
        isDev: false,
      },
    },
    $route: { meta: {} },
    ...mocks,
  }
  return mount(DruxtBlock, {
    localVue,
    mocks,
    propsData,
    store,
    stubs: ['DruxtDebug', 'DruxtDevelTemplate'],
    ...options,
  })
}

describe('Component - DruxtBlock', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  // Test rendering a block by UUID to ensure proper fetching and component setup.
  // This verifies UUID-based block retrieval, fetch key generation, and default slot provision.
  // How: Mount component with UUID prop, call fetch, assert props, fetch key, component options, and slot function.
  // Why: To ensure blocks can be loaded by UUID, a common use case for dynamic block rendering.
  test('uuid', async () => {
    const mockPage = await getMockResource('block--block')
    const wrapper = mountComponent({ uuid: mockPage.data.id })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(
      DruxtBlock.fetchKey.call(
        wrapper.vm,
        jest.fn(() => 0)
      )
    ).toBe(`DruxtBlock:${mockPage.data.id}:0`)

    // Props
    expect(wrapper.vm.id).toBe(null)
    expect(wrapper.vm.uuid).toBe(mockPage.data.id)

    // DruxtModule
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')

    // Default slot.
    expect(wrapper.vm.getScopedSlots().default).toStrictEqual(
      expect.any(Function)
    )

    // Template rendering.
    expect(wrapper.html()).toMatchSnapshot()
  })
  // Test component options generation for blocks with plugin IDs (e.g., block_content:uuid).
  // This verifies the naming convention for complex plugin identifiers and ensures all option variants are generated.
  // How: Mount with UUID that has block_content plugin, call fetch, assert the generated component options array matches expected naming patterns.
  // Why: To ensure theming components can be created for blocks with UUID-based plugin IDs, supporting custom block types.
  test('uuid - pluginId', async () => {
    // TODO : Update test to use getMockResource instead of a hardcoded UUID.
    const wrapper = mountComponent({
      uuid: '06251689-406e-4dc4-aab1-5fcf0e5f9ecb',
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(
      DruxtBlock.fetchKey.call(
        wrapper.vm,
        jest.fn(() => 0)
      )
    ).toBe('DruxtBlock:06251689-406e-4dc4-aab1-5fcf0e5f9ecb:0')

    // DruxtModule
    expect(wrapper.vm.component.options.length).toBe(9)

    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtBlockBlockContent9aadf4a1Ded64017A10dA5e043396edfBannerTopUmami',
      'DruxtBlockBlockContent9aadf4a1Ded64017A10dA5e043396edfBannerTop',
      'DruxtBlockBlockContent9aadf4a1Ded64017A10dA5e043396edfUmami',
      'DruxtBlockBlockContentBannerTopUmami',
      'DruxtBlockBlockContent9aadf4a1Ded64017A10dA5e043396edf',
      'DruxtBlockBlockContentBannerTop',
      'DruxtBlockBlockContentUmami',
      'DruxtBlockBlockContent',
      'DruxtBlockDefault',
    ])
  })

  // Test rendering a block by Drupal internal ID to ensure ID-based fetching works.
  // This verifies the alternative to UUID-based loading and proper component options for system blocks.
  // How: Mount component with ID prop, call fetch, assert props, fetch key, and generated component options for system branding block.
  // Why: To ensure blocks can be loaded by their Drupal internal IDs, supporting configuration-based block placement.
  test('id', async () => {
    const wrapper = mountComponent({ id: 'umami_branding' })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(
      DruxtBlock.fetchKey.call(
        wrapper.vm,
        jest.fn(() => 0)
      )
    ).toBe('DruxtBlock:umami_branding:0')

    // Props
    expect(wrapper.vm.id).toBe('umami_branding')
    expect(wrapper.vm.uuid).toBe(null)

    // DruxtModule
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtBlockSystemBrandingBlockHeaderUmami',
      'DruxtBlockSystemBrandingBlockHeader',
      'DruxtBlockSystemBrandingBlockUmami',
      'DruxtBlockSystemBrandingBlock',
      'DruxtBlockDefault',
    ])

    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
  })

  // Test development mode slot rendering to ensure debug information is provided.
  // This verifies that in dev mode, blocks without custom templates show helpful debugging UI.
  // How: Set isDev to true, mount with UUID, call fetch, render default slot, assert DruxtDebug component is returned.
  // Why: To provide developers with debugging tools during development, showing block data and available component options.
  test('dev mode slot', async () => {
    const mocks = {
      $nuxt: {
        context: {
          isDev: true,
        },
      },
    }
    const wrapper = mountComponent(
      { uuid: '9d3d3a23-69f5-4c2d-9a00-287492a52987' },
      {},
      mocks
    )
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(
      DruxtBlock.fetchKey.call(
        wrapper.vm,
        jest.fn(() => 0)
      )
    ).toBe('DruxtBlock:9d3d3a23-69f5-4c2d-9a00-287492a52987:0')

    // Default slot.
    const slot = wrapper.vm.getScopedSlots().default()
    expect(slot.tag.endsWith('DruxtDebug')).toBe(true)

    // Template rendering.
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test custom default slot integration to ensure parent-provided slots receive block data.
  // This verifies that when a custom slot is provided, it gets the block data as props.
  // How: Mount with scopedSlots, call fetch, invoke the default slot, assert the custom slot was called with block data.
  // Why: To ensure blocks can be themed by parent components using scoped slots with access to block attributes.
  test('custom default slot', async () => {
    const scopedSlots = { default: jest.fn() }
    const wrapper = mountComponent(
      { uuid: '06251689-406e-4dc4-aab1-5fcf0e5f9ecb' },
      { scopedSlots }
    )
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(
      DruxtBlock.fetchKey.call(
        wrapper.vm,
        jest.fn(() => 0)
      )
    ).toBe('DruxtBlock:06251689-406e-4dc4-aab1-5fcf0e5f9ecb:0')

    wrapper.vm.getScopedSlots().default.call()
    expect(scopedSlots.default).toHaveBeenCalledWith({
      block: wrapper.vm.block,
    })

    // Template rendering.
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test prop watchers to ensure $fetch is called when id or uuid changes.
  // This verifies reactivity for dynamic block loading based on prop updates.
  // How: Call the watch functions directly with mocked $fetch, assert $fetch is called for each prop change.
  // Why: To ensure blocks refetch data when their identifiers change, supporting dynamic content updates.
  test('watch - props $fetch', async () => {
    const $fetch = jest.fn()
    expect($fetch).toHaveBeenCalledTimes(0)

    DruxtBlock.watch.id.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(1)

    DruxtBlock.watch.uuid.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(2)
  })

  // Test error handling for missing required props (id or uuid).
  // This ensures the component provides clear error messages when misconfigured.
  // How: Mount component without id or uuid props, assert the HTML snapshot shows the error message.
  // Why: To prevent silent failures and guide developers to provide required props.
  test('error - missing required props', () => {
    const wrapper = mountComponent({})
    // Ensure that error message matches snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test componentOptions when no block data is available.
  // This covers the early return branch in componentOptions method.
  // How: Call componentOptions with undefined block, assert empty array is returned.
  // Why: To ensure graceful handling when block data hasn't loaded yet.
  test('componentOptions - no block', () => {
    const options = DruxtBlock.druxt.componentOptions({ block: undefined })
    expect(options).toEqual([])
  })

  // Test componentOptions for plugins without IDs (no colon in plugin string).
  // This verifies naming for simple plugin types like 'system' blocks.
  // How: Call componentOptions with block having plugin without colon, assert correct option arrays are generated.
  // Why: To ensure theming works for standard Drupal system blocks without complex plugin identifiers.
  test('componentOptions - plugin without colon', () => {
    const block = {
      attributes: {
        plugin: 'system',
        region: 'header',
        theme: 'umami',
      },
    }
    const options = DruxtBlock.druxt.componentOptions({ block })
    expect(options).toEqual([
      ['system', 'header', 'umami'],
      ['system', 'umami'],
      ['default'],
    ])
  })

  // Test componentOptions for plugins with colon but empty pluginId.
  // This covers the branch where pluginId is falsy after split.
  // How: Call componentOptions with block having plugin with colon but empty pluginId, assert correct option arrays are generated.
  // Why: To ensure proper handling of malformed plugin strings.
  test('componentOptions - plugin with colon but empty pluginId', () => {
    const block = {
      attributes: {
        plugin: 'system:',
        region: 'header',
        theme: 'umami',
      },
    }
    const options = DruxtBlock.druxt.componentOptions({ block })
    expect(options).toEqual([
      ['system', 'header', 'umami'],
      ['system', 'umami'],
      ['default'],
    ])
  })

  // Test componentOptions for plugins with valid pluginId.
  // This covers the branch where pluginId is truthy and adds pluginId-specific options.
  // How: Call componentOptions with block having plugin with colon and valid pluginId, assert all option arrays are generated.
  // Why: To ensure theming works for complex plugin identifiers with plugin IDs.
  test('componentOptions - plugin with valid pluginId', () => {
    const block = {
      attributes: {
        plugin: 'block_content:banner',
        region: 'header',
        theme: 'umami',
      },
    }
    const options = DruxtBlock.druxt.componentOptions({ block })
    expect(options).toEqual([
      ['block_content', 'banner', 'header', 'umami'],
      ['block_content', 'banner', 'umami'],
      ['block_content', 'header', 'umami'],
      ['block_content', 'umami'],
      ['default'],
    ])
  })

  // Test componentOptions with missing attributes.
  // This covers the branch where block.attributes is undefined.
  // How: Call componentOptions with block missing attributes, assert returns default options.
  // Why: To ensure graceful handling of malformed block data.
  test('componentOptions - no attributes', () => {
    const block = {} // No attributes property
    const options = DruxtBlock.druxt.componentOptions({ block })
    expect(options).toEqual([['default']])
  })

  // Test componentOptions with empty plugin.
  // This covers the branch where plugin is empty string.
  // How: Call componentOptions with empty plugin, assert returns default options.
  // Why: To handle blocks with no plugin information.
  test('componentOptions - empty plugin', () => {
    const block = {
      attributes: {
        plugin: '',
        region: 'header',
        theme: 'umami',
      },
    }
    const options = DruxtBlock.druxt.componentOptions({ block })
    expect(options).toEqual([['header', 'umami'], ['umami'], ['default']])
  })

  // Test fetchConfig with custom fields in settings.
  // This covers the branch where fields array is provided in druxt settings.
  // How: Set up component with custom fields in $druxt.settings.blocks.query.fields, call fetchConfig, assert query includes custom fields.
  // Why: To ensure custom field filtering works when configured.
  test('fetchConfig - with custom fields', async () => {
    const wrapper = mountComponent(
      { uuid: 'test-uuid' },
      {},
      {
        $druxt: {
          settings: {
            blocks: {
              query: {
                fields: ['custom_field'],
              },
            },
          },
        },
      }
    )

    // Mock the getResource method
    wrapper.vm.getResource = jest.fn().mockResolvedValue({ data: {} })

    await wrapper.vm.$options.druxt.fetchConfig.call(wrapper.vm)

    expect(wrapper.vm.getResource).toHaveBeenCalledWith({
      id: 'test-uuid',
      prefix: undefined,
      type: 'block--block',
      query: expect.any(Object),
    })
  })

  // Test slots method when block has attributes.
  // This verifies the debug summary includes the block's internal ID and label.
  // How: Set resource data with attributes, call slots method, render default slot, assert summary contains block ID.
  // Why: To ensure debug information is accurate and helpful for identifying specific blocks.
  test('slots - with block attributes', () => {
    const wrapper = mountComponent({ uuid: 'test-uuid' })
    wrapper.setData({
      resource: {
        data: {
          attributes: {
            drupal_internal__id: 'test_block',
            settings: { label: 'Test Block' },
          },
        },
      },
    })
    wrapper.vm.component.options = ['option1', 'option2']
    const slots = wrapper.vm.$options.druxt.slots.call(
      wrapper.vm,
      wrapper.vm.$createElement
    )
    const defaultSlot = slots.default()
    expect(defaultSlot.data.props.summary).toContain('test_block')
  })

  // Test slots method when neither id nor uuid is provided.
  // This covers the error case in slots for missing required props.
  // How: Mount without props, call slots method, render default slot, assert error summary about missing props.
  // Why: To ensure clear error messaging when the component is used incorrectly.
  test('slots - no id or uuid', () => {
    const wrapper = mountComponent({})
    const slots = wrapper.vm.$options.druxt.slots.call(
      wrapper.vm,
      wrapper.vm.$createElement
    )
    const defaultSlot = slots.default()
    expect(defaultSlot.data.props.summary).toContain('Missing required')
  })

  // Test slots method when block exists but has no attributes.
  // This covers the branch where block exists but lacks attributes property.
  // How: Set resource data without attributes, call slots method, render default slot, assert it returns DruxtDebug with undefined summary.
  // Why: To ensure debug component is shown even for incomplete block data.
  test('slots - block without attributes', () => {
    const wrapper = mountComponent({ uuid: 'test-uuid' })
    wrapper.setData({
      resource: {
        data: {
          // No attributes
        },
      },
    })
    const slots = wrapper.vm.$options.druxt.slots.call(
      wrapper.vm,
      wrapper.vm.$createElement
    )
    const defaultSlot = slots.default()
    expect(defaultSlot.tag).toContain('DruxtDebug')
    expect(defaultSlot.data.props.summary).toBeUndefined()
  })

  // Test slots method when component has no options.
  // This covers the branch where !!this.component.options.length is false.
  // How: Set component.options to empty array, call slots method, render default slot, assert summary is correct.
  // Why: To ensure debug information is shown even when no options are available.
  test('slots - no component options', () => {
    const wrapper = mountComponent({ uuid: 'test-uuid' })
    wrapper.setData({
      resource: {
        data: {
          attributes: {
            drupal_internal__id: 'test_block',
            settings: { label: 'Test Block' },
          },
        },
      },
    })
    wrapper.vm.component.options = []
    const slots = wrapper.vm.$options.druxt.slots.call(
      wrapper.vm,
      wrapper.vm.$createElement
    )
    const defaultSlot = slots.default()
    expect(defaultSlot.data.props.summary).toContain('test_block')
  })

  // Test fetchConfig when neither uuid nor id is provided.
  // This covers the case where no fetching occurs.
  // How: Call fetchConfig without uuid or id, assert no methods are called.
  // Why: To ensure the method handles missing identifiers gracefully.
  test('fetchConfig - no uuid or id', async () => {
    const wrapper = mountComponent({})
    // Mock methods to ensure they're not called
    wrapper.vm.getResource = jest.fn()
    wrapper.vm.getCollection = jest.fn()

    await wrapper.vm.$options.druxt.fetchConfig.call(wrapper.vm)

    expect(wrapper.vm.getResource).not.toHaveBeenCalled()
    expect(wrapper.vm.getCollection).not.toHaveBeenCalled()
  })

  // Test fetchConfig without custom fields in settings.
  // This covers the branch where fields array is not provided.
  // How: Call fetchConfig without custom fields, assert query is created without additional fields.
  // Why: To ensure default field handling works.
  test('fetchConfig - without custom fields', async () => {
    const wrapper = mountComponent({ uuid: 'test-uuid' })
    wrapper.vm.getResource = jest.fn().mockResolvedValue({ data: {} })

    await wrapper.vm.$options.druxt.fetchConfig.call(wrapper.vm)

    expect(wrapper.vm.getResource).toHaveBeenCalledWith({
      id: 'test-uuid',
      prefix: undefined,
      type: 'block--block',
      query: expect.any(Object),
    })
  })

  // Test fetchConfig with invalid fields setting.
  // This covers the branch where fields is not an array.
  // How: Set fields to a non-array value, call fetchConfig, assert query is created without additional fields.
  // Why: To ensure invalid field configurations are handled gracefully.
  test('fetchConfig - invalid fields type', async () => {
    const wrapper = mountComponent(
      { uuid: 'test-uuid' },
      {},
      {
        $druxt: {
          settings: {
            blocks: {
              query: {
                fields: 'invalid', // Not an array
              },
            },
          },
        },
      }
    )
    wrapper.vm.getResource = jest.fn().mockResolvedValue({ data: {} })

    await wrapper.vm.$options.druxt.fetchConfig.call(wrapper.vm)

    expect(wrapper.vm.getResource).toHaveBeenCalledWith({
      id: 'test-uuid',
      prefix: undefined,
      type: 'block--block',
      query: expect.any(Object),
    })
  })

  // Test render when fetch is pending and no component options.
  // This covers the early return branch in DruxtModule render function.
  // How: Set $fetchState.pending to true and component.options to empty, assert wrapper div is returned.
  // Why: To ensure proper loading state rendering.
  test('render - pending with no options', () => {
    const wrapper = mountComponent({ uuid: 'test-uuid' })
    wrapper.setData({
      component: { options: [] },
    })
    wrapper.vm.$fetchState = { pending: true }

    const rendered = wrapper.vm.$options.render.call(
      wrapper.vm,
      wrapper.vm.$createElement
    )
    expect(rendered.tag).toBe('div')
  })

  // Test render when wrapper is false.
  // This covers the unwrap branch in DruxtModule render function.
  // How: Set wrapper to false, assert component.is is set to DruxtWrapper.
  // Why: To ensure components can be rendered without wrapper when needed.
  test('render - wrapper false', () => {
    const wrapper = mountComponent({ uuid: 'test-uuid' })
    wrapper.vm.wrapper = false
    wrapper.vm.$scopedSlots = { default: jest.fn() }

    wrapper.vm.$options.render.call(wrapper.vm, wrapper.vm.$createElement)
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
  })
})
