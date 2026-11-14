import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import DruxtBlock from '../../src/components/DruxtBlock.vue'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

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
            fields: []
          }
        }
      }
    },
    $fetchState: { pending: false },
    $nuxt: {
      context: {
        isDev: false,
      }
    },
    $route: { meta: {} },
    ...mocks
  }
  return mount(DruxtBlock, { localVue, mocks, propsData, store, stubs: ['DruxtDebug'], ...options })
}

// The block config's own uuid belongs to the install. Its plugin names the
// block_content it renders, which is stable, so tests look the block up by that.
const bannerBlockQuery = () => new DrupalJsonApiParams()
  .addFilter('plugin', 'block_content:9aadf4a1-ded6-4017-a10d-a5e043396edf')

describe('Component - DruxtBlock', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://api.umami.demo.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('uuid', async () => {
    const mockPage = await getMockResource('block--block')
    const wrapper = mountComponent({ uuid: mockPage.data.id })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtBlock.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe(`DruxtBlock:${mockPage.data.id}:0`)

    // Props
    expect(wrapper.vm.id).toBe(null)
    expect(wrapper.vm.uuid).toBe(mockPage.data.id)

    // DruxtModule
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')

    // Default slot.
    expect(wrapper.vm.getScopedSlots().default).toStrictEqual(expect.any(Function))
  })

  test('uuid - pluginId', async () => {
    // The component names below are built from the block's plugin.
    const mockBlock = await getMockResource('block--block', bannerBlockQuery())
    const wrapper = mountComponent({ uuid: mockBlock.data.id })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtBlock.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe(`DruxtBlock:${mockBlock.data.id}:0`)

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

  test('id', async () => {
    const wrapper = mountComponent({ id: 'umami_branding' })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtBlock.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe('DruxtBlock:umami_branding:0')

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

  test('dev mode slot', async () => {
    const mocks = {
      $nuxt: {
        context: {
          isDev: true,
        },
      },
    }
    const mockBlock = await getMockResource('block--block', bannerBlockQuery())
    const wrapper = mountComponent({ uuid: mockBlock.data.id }, {}, mocks)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtBlock.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe(`DruxtBlock:${mockBlock.data.id}:0`)
    expect(wrapper.vm.block).toMatchObject({ id: mockBlock.data.id, type: 'block--block' })

    // Default slot.
    const slot = wrapper.vm.getScopedSlots().default()
    expect(slot.tag.endsWith('DruxtDebug')).toBe(true)
  })

  test('custom default slot', async () => {
    const scopedSlots = { default: jest.fn() }
    const mockBlock = await getMockResource('block--block', bannerBlockQuery())
    const wrapper = mountComponent({ uuid: mockBlock.data.id }, { scopedSlots })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtBlock.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe(`DruxtBlock:${mockBlock.data.id}:0`)

    expect(wrapper.vm.block).toMatchObject({ id: mockBlock.data.id, type: 'block--block' })
    wrapper.vm.getScopedSlots().default.call()
    expect(scopedSlots.default).toHaveBeenCalledWith({
      block: wrapper.vm.block,
    })
  })

  test('watch - props $fetch', async () => {
    const $fetch = jest.fn()
    expect($fetch).toHaveBeenCalledTimes(0)

    DruxtBlock.watch.id.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(1)

    DruxtBlock.watch.uuid.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(2)
  })

  test('error - missing required props', () => {
    const wrapper = mountComponent({})
    // Ensure that error message matches snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})
