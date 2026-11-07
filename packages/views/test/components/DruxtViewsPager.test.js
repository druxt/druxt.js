import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
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
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

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

  test('infinite_scroll: a load more link, and the next page while in view', async () => {
    const next = { href: '?page=1' }
    const wrapper = mountComponent({
      type: 'infinite_scroll',
      options: { views_infinite_scroll: { button_text: 'More recipes', automatically_load_content: true } },
      resource: { links: { next } },
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    const slot = wrapper.vm.getScopedSlots().default.call(wrapper.vm)
    expect(slot.tag).toBe('div')
    expect(slot.children[0].children[0].text).toBe('More recipes')
    slot.children[0].data.nativeOn.click()
    expect(wrapper.vm.model).toBe(1)

    // Without a next page there is nothing to load.
    await wrapper.setProps({ resource: { links: {} } })
    expect(wrapper.vm.getScopedSlots().default.call(wrapper.vm).children[0]).toBeFalsy()

    // Loads the next page only while observed in view.
    wrapper.vm.model = 0
    await wrapper.setProps({ resource: { links: { next: { href: '?page=2' } } } })
    wrapper.vm.loadNext()
    expect(wrapper.vm.model).toBe(0)
    let callback
    const observe = jest.fn()
    global.IntersectionObserver = jest.fn((cb) => { callback = cb; return { observe, disconnect: jest.fn() } })
    wrapper.vm.observe()
    expect(observe).toHaveBeenCalledWith(wrapper.vm.$el)
    callback([{ isIntersecting: false }])
    expect(wrapper.vm.model).toBe(0)
    callback([{ isIntersecting: true }])
    expect(wrapper.vm.model).toBe(2)
    wrapper.destroy()
    delete global.IntersectionObserver
  })

  test('infinite_scroll: the default button text, and no observer unless it loads automatically', async () => {
    global.IntersectionObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() }))
    const wrapper = mountComponent({ type: 'infinite_scroll', resource: { links: { next: { href: '?page=1' } } } })
    await wrapper.vm.$options.fetch.call(wrapper.vm)
    expect(wrapper.vm.getScopedSlots().default.call(wrapper.vm).children[0].children[0].text).toBe('Load more')
    wrapper.vm.observe()
    expect(global.IntersectionObserver).not.toHaveBeenCalled()
    delete global.IntersectionObserver
  })

  test('takes its route from a providing page', async () => {
    const link = jest.fn(({ page }) => ({ path: '/shop/women', query: { brand: 'centarro', page: String(page) } }))
    const wrapper = mount(DruxtViewsPager, {
      localVue,
      mocks: {
        $fetch: jest.fn(),
        $fetchState: { pending: true },
        $nuxt: { context: { isDev: false } },
        $route: { query: { brand: 'centarro' } },
      },
      propsData: { type: 'full' },
      provide: { druxtViewsPage: { link } },
      store,
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)
    expect(wrapper.vm.getRoute({ href: '?page=2' })).toStrictEqual({ path: '/shop/women', query: { brand: 'centarro', page: '2' } })
    expect(link).toHaveBeenCalledWith({ page: 2 })
  })
})
