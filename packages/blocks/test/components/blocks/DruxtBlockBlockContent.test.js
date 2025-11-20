import 'regenerator-runtime/runtime'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import mockAxios from 'jest-mock-axios'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../../../druxt/src'
import DruxtBlockBlockContent from '../../../src/components/blocks/DruxtBlockBlockContent.vue'
import { getMockResource } from '../../../../test-utils/src'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mountComponent = (entity, options = {}) => {
  const propsData = { block: entity }

  const mocks = {
    $fetchState: {
      pending: false,
    },
    $store: store,
    $route: { meta: {} },
  }

  return mount(DruxtBlockBlockContent, {
    localVue,
    mocks,
    propsData,
    stubs: ['DruxtEntity'],
    ...options,
  })
}

describe('Component - DruxtBlockBlockContent', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  // Test default rendering of block content with proper dependencies.
  // This verifies that block content entities are fetched and propsData is correctly constructed from dependencies.
  // How: Get mock block with block_content provider, commit to store, mount component, call fetch, assert propsData contains expected entity props.
  // Why: To ensure block content blocks properly resolve and render their associated content entities.
  test('default', async () => {
    const query = new DrupalJsonApiParams().addFilter(
      'settings.provider',
      'block_content'
    )
    const mockBlock = await getMockResource('block--block', query)
    store.commit('druxt/addResource', { resource: mockBlock })

    const wrapper = mountComponent(mockBlock.data)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(Object.keys(wrapper.vm.propsData)).toStrictEqual([
      'key',
      'langcode',
      'type',
      'uuid',
    ])

    // Assert template rendering
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test propsData when fetch is pending.
  // This covers the pending check branch.
  // How: Mount component with pending true, assert propsData returns false.
  // Why: To ensure component doesn't render incomplete data during loading.
  test('propsData - pending', () => {
    const mockBlock = { type: 'block--block', id: 'test' }
    const wrapper = mountComponent(mockBlock, {
      mocks: {
        $fetchState: { pending: true },
        $store: store,
        $route: { meta: {} },
      },
    })
    expect(wrapper.vm.propsData).toBe(false)

    // Assert template rendering when pending
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test propsData when block data is missing from store.
  // This covers the data existence check.
  // How: Mount component with block not in store (ensure store structure exists but data is empty), assert propsData returns false.
  // Why: To handle cases where block fetch failed or data is unavailable.
  test('propsData - no data', () => {
    const mockBlock = { type: 'block--block', id: 'missing' }
    // Ensure store has the structure but no data
    store.state.druxt.resources = {
      'block--block': {
        missing: {
          undefined: {}, // langcode is undefined
        },
      },
    }
    const wrapper = mountComponent(mockBlock)
    expect(wrapper.vm.propsData).toBe(false)

    // Assert template rendering when no data
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test propsData when block attributes are missing.
  // This covers the attributes existence check.
  // How: Add block to store without attributes, assert propsData returns false.
  // Why: To ensure component handles malformed block data gracefully.
  test('propsData - no attributes', () => {
    const mockBlock = { type: 'block--block', id: 'no-attrs', attributes: null }
    store.commit('druxt/addResource', {
      resource: { data: mockBlock },
      prefix: undefined,
    })
    const wrapper = mountComponent(mockBlock)
    expect(wrapper.vm.propsData).toBe(false)
  })

  // Test propsData when dependencies are missing.
  // This covers the dependencies existence check.
  // How: Add block to store with attributes but no dependencies, assert propsData returns false.
  // Why: To handle blocks that don't have the expected dependency structure.
  test('propsData - no dependencies', () => {
    const mockBlock = {
      type: 'block--block',
      id: 'no-deps',
      attributes: { other: 'data' },
    }
    store.commit('druxt/addResource', {
      resource: { data: mockBlock },
      prefix: undefined,
    })
    const wrapper = mountComponent(mockBlock)
    expect(wrapper.vm.propsData).toBe(false)

    // Assert template rendering when no dependencies
    expect(wrapper.html()).toMatchSnapshot()
  })
})
