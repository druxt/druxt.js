import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import DruxtSite from '../../src/components/DruxtSite.vue'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mountComponent = (pending, options) => {
  const mocks = {
    $druxt: { settings: {} },
    $fetchState: { pending }
  }
  const propsData = { theme: 'umami' }
  const stubs = ['DruxtBlockRegion', 'Nuxt']

  return mount(DruxtSite, { localVue, mocks, propsData, store, stubs, ...options })
}

describe('DruxtSite component', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('defaults', async () => {
    const wrapper = mountComponent(false)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.theme).toBe('umami')
    expect(wrapper.vm.regions).toStrictEqual([
      'breadcrumbs',
      'highlighted',
      'pre_header',
      'banner_top',
      'header',
      'content',
      'bottom',
      'footer',
      'tabs',
      'page_title',
      'content_bottom'
    ])
    expect(Object.keys(wrapper.vm.$refs)).toStrictEqual(['component', ...wrapper.vm.regions])

    // Druxt Component mixin.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual(['DruxtSiteUmami', 'DruxtSiteDefault'])

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('pending', async () => {
    const wrapper = mountComponent(true)

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('default slot', async () => {
    const scopedSlots = { default: jest.fn() }
    const wrapper = mountComponent(false, { scopedSlots })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    wrapper.vm.getScopedSlots().default()
    expect(scopedSlots.default).toHaveBeenCalledWith({
      props: wrapper.vm.props,
      regions: wrapper.vm.regions,
      theme: wrapper.vm.theme
    })
  })

  test('no blocks', async () => {
    const wrapper = mountComponent(false)
    expect(wrapper.vm.regions.length).toBe(0)
    expect(wrapper.vm.getScopedSlots().default().componentOptions.tag).toBe('Nuxt')
  })
})
