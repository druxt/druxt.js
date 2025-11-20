import 'regenerator-runtime/runtime'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouterStore } from '../../../router/src'
import DruxtRouter from '../../../router/src/components/DruxtRouter.vue'
import { DruxtClient, DruxtStore } from '../../../druxt/src'
import DruxtBlockRegion from '../../src/components/DruxtBlockRegion.vue'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mountComponent = (name = null, options = {}) => {
  const propsData = { theme: 'umami' }
  if (name) {
    propsData.name = name
  }

  const mocks = {
    $fetchState: { pending: true },
    $route: { meta: {} },
  }

  return shallowMount(DruxtBlockRegion, {
    localVue,
    mocks,
    propsData,
    store,
    stubs: ['DruxtBlock'],
    ...options,
  })
}

describe('Component - DruxtBlockRegion', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    DruxtRouterStore({ store })
    store.$druxtRouter = () => new DruxtRouter('https://demo-api.druxtjs.org')
    store.state.druxtRouter.route = {
      isHomePath: true,
      resolvedPath: '/en/node',
    }

    store.app = { context: { error: jest.fn() }, store }
  })

  // Test default region rendering with content region and umami theme.
  // This verifies basic region fetching, block loading, and default slot rendering.
  // How: Mount with default props, call fetch, assert fetch key, props, blocks loaded, visibility, component options, and default slot structure.
  // Why: To ensure regions load blocks correctly and provide proper theming options.
  test('default', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(
      DruxtBlockRegion.fetchKey.call(
        wrapper.vm,
        jest.fn(() => 0)
      )
    ).toBe('DruxtBlockRegion:content:0')

    // Props.
    expect(wrapper.vm.name).toBe('content')
    expect(wrapper.vm.theme).toBe('umami')

    // Data
    expect(wrapper.vm.blocks.length).toBe(1)

    // Vuex
    expect(wrapper.vm.route).toStrictEqual({
      isHomePath: true,
      resolvedPath: '/en/node',
    })

    // Methods.
    expect(wrapper.vm.isVisible(wrapper.vm.blocks[0])).toBe(true)

    // DruxtModule.
    expect(wrapper.vm.component.options.length).toBe(3)
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtBlockRegionContentUmami',
      'DruxtBlockRegionContent',
      'DruxtBlockRegionDefault',
    ])
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')

    // Default slot.
    const slot = wrapper.vm.getScopedSlots().default()
    expect(slot.tag).toBe('div')

    // Template rendering.
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test banner_top region with multiple blocks and visibility conditions.
  // This verifies block sorting, visibility logic with request_path conditions, and route-based filtering.
  // How: Mount with banner_top region, call fetch, assert block sorting, test visibility with different route states, assert component options.
  // Why: To ensure regions handle complex visibility rules and properly sort blocks by weight.
  test('sort', async () => {
    const wrapper = mountComponent('banner_top')
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(
      DruxtBlockRegion.fetchKey.call(
        wrapper.vm,
        jest.fn(() => 0)
      )
    ).toBe('DruxtBlockRegion:banner_top:0')

    // Props.
    expect(wrapper.vm.name).toBe('banner_top')
    expect(wrapper.vm.theme).toBe('umami')

    // Data
    expect(wrapper.vm.blocks.length).toBe(3)

    // Vuex
    expect(wrapper.vm.route).toStrictEqual({
      isHomePath: true,
      resolvedPath: '/en/node',
    })

    // Methods.
    expect(wrapper.vm.isVisible(wrapper.vm.blocks[0])).toBe(false)
    expect(wrapper.vm.isVisible(wrapper.vm.blocks[1])).toBe(true)
    expect(wrapper.vm.isVisible(wrapper.vm.blocks[2])).toBe(true)

    store.state.druxtRouter.route = {
      isHomePath: false,
      resolvedPath: '/recipes',
    }
    expect(wrapper.vm.isVisible(wrapper.vm.blocks[0])).toBe(true)
    expect(wrapper.vm.isVisible(wrapper.vm.blocks[1])).toBe(false)
    expect(wrapper.vm.isVisible(wrapper.vm.blocks[2])).toBe(false)

    // DruxtModule.
    expect(wrapper.vm.component.options.length).toBe(3)
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtBlockRegionBannerTopUmami',
      'DruxtBlockRegionBannerTop',
      'DruxtBlockRegionDefault',
    ])

    // Assert that the results are corectly sorted.
    expect(
      wrapper.vm.blocks[0].attributes.weight <
        wrapper.vm.blocks[1].attributes.weight
    ).toBeTruthy()
  })

  // Test custom default slot integration for region theming.
  // This verifies that parent components can override the default slot and receive region data.
  // How: Mount with custom scopedSlots, call fetch, invoke default slot, assert custom slot called with blocks, name, theme.
  // Why: To ensure regions support custom theming through scoped slots with full context.
  test('custom default slot', async () => {
    const scopedSlots = { default: jest.fn() }
    const wrapper = mountComponent(null, { scopedSlots })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(
      DruxtBlockRegion.fetchKey.call(
        wrapper.vm,
        jest.fn(() => 0)
      )
    ).toBe('DruxtBlockRegion:content:0')

    wrapper.vm.getScopedSlots().default()
    expect(scopedSlots.default).toHaveBeenCalledWith({
      blocks: wrapper.vm.blocks,
      name: 'content',
      theme: 'umami',
    })

    // Template rendering.
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test prop watchers for name and theme changes.
  // This ensures reactivity when region or theme props are updated dynamically.
  // How: Call watch functions directly with mocked $fetch, assert $fetch is called for each prop change.
  // Why: To verify regions refetch blocks when their configuration changes.
  test('watch - props $fetch', async () => {
    const $fetch = jest.fn()
    expect($fetch).toHaveBeenCalledTimes(0)

    DruxtBlockRegion.watch.name.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(1)

    DruxtBlockRegion.watch.theme.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(2)
  })

  // Test isVisible with no visibility conditions.
  // This covers the default return true branch.
  // How: Call isVisible with block having no visibility attributes, assert returns true.
  // Why: To ensure blocks without visibility rules are always visible.
  test('isVisible - no visibility', () => {
    const wrapper = mountComponent()
    const block = { attributes: {} }
    expect(wrapper.vm.isVisible(block)).toBe(true)
  })

  // Test isVisible with negate visibility condition.
  // This covers the negate branch in request_path visibility.
  // How: Set block with negate true and pages not including current path, assert visibility logic.
  // Why: To verify negated visibility conditions work correctly.
  test('isVisible - negate visibility', () => {
    const wrapper = mountComponent()
    const block = {
      attributes: {
        visibility: {
          request_path: {
            negate: true,
            pages: '/other-path\n/admin',
          },
        },
      },
    }
    // Current route is /en/node, not in pages, negate true, so should be visible
    expect(wrapper.vm.isVisible(block)).toBe(true)
  })

  // Test isVisible with <front> page and home path.
  // This covers the <front> branch.
  // How: Set block with <front> in pages, route isHomePath true, assert visible.
  // Why: To ensure home page visibility conditions are handled.
  test('isVisible - front page', () => {
    const wrapper = mountComponent()
    const block = {
      attributes: {
        visibility: {
          request_path: {
            negate: false,
            pages: '<front>\n/node',
          },
        },
      },
    }
    expect(wrapper.vm.isVisible(block)).toBe(true)
  })

  // Test resolvedPath with langcode prefix removal.
  // This covers the langcode replace in resolvedPath.
  // How: Mount with langcode prop, set route with langcode prefix, call isVisible, assert path is processed correctly.
  // Why: To ensure multilingual path matching works.
  test('isVisible - langcode path', () => {
    const wrapper = mountComponent(null, {
      propsData: { theme: 'umami', langcode: 'en' },
    })
    store.state.druxtRouter.route = {
      isHomePath: false,
      resolvedPath: '/en/test-page',
    }
    const block = {
      attributes: {
        visibility: {
          request_path: {
            negate: false,
            pages: '/test-page',
          },
        },
      },
    }
    expect(wrapper.vm.isVisible(block)).toBe(true)
  })
})
