import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtViewsStore, DruxtView } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Setup mock Vuex store.
let store

const mocks = {
  $createElement: jest.fn(),
  $fetch: jest.fn(),
  $fetchState: {
    pending: true
  },
  $route: {
    query: {}
  }
}

const mountComponent = (propsData) => mount(DruxtView, { localVue, mocks, propsData, store })

describe('DruxtView', () => {
  beforeEach(() => {
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    DruxtViewsStore({ store })

    store.app = { context: { error: jest.fn() }, store }
  })

  test('featured_articles', async () => {
    const wrapper = mountComponent({
      displayId: 'page_1',
      uuid: 'ab193308-95ab-489d-b662-f7305380c41e',
      viewId: 'featured_articles'
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Props.
    expect(wrapper.vm.displayId).toBe('page_1')
    expect(wrapper.vm.uuid).toBe('ab193308-95ab-489d-b662-f7305380c41e')
    expect(wrapper.vm.viewId).toBe('featured_articles')

    // Computed.
    expect(wrapper.vm.attachments_after).toStrictEqual([])
    expect(wrapper.vm.attachments_before).toStrictEqual([])
    expect(wrapper.vm.filters).toStrictEqual([])
    expect(wrapper.vm.headers).toStrictEqual([])
    expect(wrapper.vm.mode).toBe('card')

    // DruxtModule.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewFeaturedArticlesPage1',
      'DruxtViewFeaturedArticles'
    ])
    expect(Object.keys(wrapper.vm.getScopedSlots())).toStrictEqual([
      'header',
      'attachments_before',
      'results',
      'pager',
      'attachments_after',
      'default'
    ])

    // Query.
    wrapper.vm.model = {
      page: 1,
      filter: { test: 1 },
      sort: 'test'
    }
    expect(wrapper.vm.getQuery(wrapper.vm.component.settings)).toStrictEqual({
      'fields[node--article]': 'uuid',
      page: 1,
      'views-filter': { test: 1 },
      'views-sort[sort_by]': 'test',
    })
    expect(wrapper.vm.showPager).toBe(true)
    expect(wrapper.vm.showSorts).toBe(false)

    wrapper.vm.$route.query = {}
    await localVue.nextTick()
    expect(wrapper.vm.model).toStrictEqual({
      filter: null,
      page: null,
      sort: null
    })
    expect(wrapper.vm.getQuery(wrapper.vm.component.settings)).toStrictEqual({ 'fields[node--article]': 'uuid' })

    // Watches.
    expect(mocks.$fetch).toHaveBeenCalledTimes(1)
    await wrapper.vm.$options.watch.displayId.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(2)
    await wrapper.vm.$options.watch.query.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(3)
    await wrapper.vm.$options.watch.uuid.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(4)
  })

  test('recipes--embed', async () => {
    const wrapper = mountComponent({
      displayId: 'embed_1',
      uuid: 'f6c38097-d534-4bfb-87d9-09526fe44e9c',
      viewId: 'recipes'
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Scoped slots.
    const scopedSlots = wrapper.vm.getScopedSlots.call(mocks)
    expect(Object.keys(scopedSlots)).toStrictEqual([
      'header',
      'filters',
      'sorts',
      'attachments_before',
      'results',
      'pager',
      'attachments_after',
      'default'
    ])

    const mockSlots = DruxtView.methods.getScopedSlots.call({
      $createElement: jest.fn(),
      headers: wrapper.vm.headers,
      filters: wrapper.vm.filters,
      results: wrapper.vm.results,
    })
    for (const key of Object.keys(mockSlots).filter((key) => key !== 'default')) {
      mockSlots[key] = jest.fn()
    }
    mockSlots.default({ foo: 'bar' })
    expect(mockSlots.header).toBeCalledWith({ foo: 'bar' })
    expect(mockSlots.filters).toBeCalledWith({ foo: 'bar' })
    expect(mockSlots.results).toBeCalledWith({ foo: 'bar' })
  })
})
