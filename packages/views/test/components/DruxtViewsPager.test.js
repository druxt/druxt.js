import 'regenerator-runtime/runtime'
import { createLocalVue, mount, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { DruxtViewsStore } from '../../src'
import DruxtViewsPager from '../../src/components/DruxtViewsPager.vue'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Setup mock Vuex store.
let store

const mountComponent = (propsData) => {
  const mocks = {
    $fetch: jest.fn(),
    $fetchState: {
      pending: true
    },
    $nuxt: {
      context: {
        isDev: false,
      },
    },
    $route: {
      query: {}
    }
  }

  return mount(DruxtViewsPager, { localVue, mocks, propsData, store })
}

describe('DruxtViewsPager', () => {
  beforeEach(() => {
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://api.umami.demo.druxtjs.org')

    DruxtViewsStore({ store })

    store.app = { context: { error: jest.fn() }, store }
  })

  test('Component', async () => {
    const wrapper = mountComponent({ type: 'test' })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Props
    expect(wrapper.vm.count).toBe(false)
    expect(wrapper.vm.options).toStrictEqual({})
    expect(wrapper.vm.resource).toStrictEqual({})
    expect(wrapper.vm.type).toBe('test')
    expect(wrapper.vm.value).toBe(0)

    // Methods.
    const link = { href: '?page=1' }
    expect(wrapper.vm.getQuery(link)).toStrictEqual({ page: 1 })
    expect(wrapper.vm.getRoute(link)).toStrictEqual({
      query: {
        page: 1
      }
    })

    // Slots.
    await wrapper.setProps({
      options: { tags: { next: 'Next', previous: 'Previous' } },
      resource: { links: { next: link, prev: { href: '?page=-1' } } }
    })
    const defaultSlot = wrapper.vm.getScopedSlots().default.call(wrapper.vm)
    expect(defaultSlot.tag).toBe('ul')
    expect(wrapper.vm.model).toBe(0)
    defaultSlot.children[0].children[0].data.nativeOn.click()
    expect(wrapper.vm.model).toBe(-1)
    defaultSlot.children[1].children[0].data.nativeOn.click()
    expect(wrapper.vm.model).toBe(1)

    // Ensure model change to emit input.
    wrapper.vm.setPage(link)
    await localVue.nextTick()
    expect(wrapper.emitted().input[0]).toStrictEqual([1])

    // DruxtModule.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewsPagerTest',
      'DruxtViewsPagerDefault'
    ])
  })

  test('a pager whose ID is not 0 reads and writes its own place in the page', () => {
    const mount = (query) => shallowMount(DruxtViewsPager, {
      localVue,
      mocks: { $fetch: jest.fn(), $fetchState: { pending: true }, $nuxt: { context: { isDev: false } }, $route: { query } },
      propsData: { options: { id: 1 }, type: 'full' },
      store,
    })

    // Drupal writes every pager on the page into one page, by ID.
    const link = { href: '?page=0,2' }
    let wrapper = mount({ page: '3', utm: 'a' })
    expect(wrapper.vm.getQuery(link)).toStrictEqual({ page: 2 })
    expect(wrapper.vm.getRoute(link)).toStrictEqual({ query: { page: '3,2', utm: 'a' } })
    expect(wrapper.vm.getRoute({ href: '?page=0,0' })).toStrictEqual({ query: { page: '3', utm: 'a' } })

    // Pager 0 keeps another pager's place.
    wrapper = shallowMount(DruxtViewsPager, {
      localVue,
      mocks: { $fetch: jest.fn(), $fetchState: { pending: true }, $nuxt: { context: { isDev: false } }, $route: { query: { page: '0,2' } } },
      propsData: { type: 'full' },
      store,
    })
    expect(wrapper.vm.getRoute({ href: '?page=1' })).toStrictEqual({ query: { page: '1,2' } })
  })
})
