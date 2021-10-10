import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { DruxtViewsStore } from '../../src'
import DruxtView from '../../src/components/DruxtView.vue'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Setup mock Vuex store.
let store

const mocks = {
  $createElement: jest.fn(),
  $druxt: {
    settings: {}
  },
  $fetch: jest.fn(),
  $fetchState: {
    pending: true
  },
  $route: {
    query: {}
  }
}

const stubs = ['DruxtEntity']
const mountComponent = (propsData) => mount(DruxtView, { localVue, mocks, propsData, store, stubs })

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
      viewId: 'featured_articles'
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtView.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe('DruxtView:featured_articles:page_1:0')

    // Props.
    expect(wrapper.vm.displayId).toBe('page_1')
    expect(wrapper.vm.uuid).toBe(null)
    expect(wrapper.vm.viewId).toBe('featured_articles')

    // Computed.
    expect(wrapper.vm.attachments_after).toStrictEqual([])
    expect(wrapper.vm.attachments_before).toStrictEqual([])
    expect(wrapper.vm.filters).toStrictEqual([])
    expect(wrapper.vm.headers).toStrictEqual([])
    expect(wrapper.vm.mode).toBe('card')

    // Slots.
    expect(Object.keys(wrapper.vm.getScopedSlots())).toStrictEqual([
      'header',
      'attachments_before',
      'results',
      'pager',
      'attachments_after',
      'default'
    ])

    const h = jest.fn()
    const slotsMock = {
      $createElement: h,
      display: wrapper.vm.display,
      filters: wrapper.vm.filters,
      results: wrapper.vm.results,
    }
    expect(DruxtView.druxt.slots.call(slotsMock, h).results({}).length).toBe(8)
    expect(h).toHaveBeenCalledTimes(8)
    expect(h).toHaveBeenCalledWith('DruxtEntity', expect.any(Object))

    // Test empty results.
    slotsMock.display.display_options.empty = [{
      content: '<p>No content</p>',
      plugin_id: 'text_custom',
    }]
    slotsMock.results = []
    expect(DruxtView.druxt.slots.call(slotsMock, h).results({}).length).toBe(1)
    expect(h).toHaveBeenCalledTimes(9)
    expect(h).toHaveBeenCalledWith('div', expect.any(Object))

    // DruxtModule.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewFeaturedArticlesPage1',
      'DruxtViewFeaturedArticles'
    ])

    // Query.
    await wrapper.setProps({ arguments: [1, 2, 3] })
    wrapper.vm.model = {
      page: 1,
      filter: { test: 1 },
      sort: 'test'
    }
    expect(wrapper.vm.getQuery(wrapper.vm.component.settings)).toStrictEqual({
      page: 1,
      'views-argument[0]': 1,
      'views-argument[1]': 2,
      'views-argument[2]': 3,
      'views-filter': { test: 1 },
      'views-sort[sort_by]': 'test',
    })
    expect(wrapper.vm.showPager).toBe(true)
    expect(wrapper.vm.showSorts).toBe(false)

    wrapper.vm.onFiltersUpdate()
    expect(wrapper.vm.model.page).toBe(null)
    expect(wrapper.vm.model.sort).toBe(null)

    wrapper.vm.$route.query = {}
    await wrapper.setProps({ arguments: [] })
    await localVue.nextTick()

    expect(wrapper.vm.model).toStrictEqual({
      filter: {},
      page: null,
      sort: null
    })
    expect(wrapper.vm.getQuery(wrapper.vm.component.settings)).toStrictEqual({})

    // Watches.
    expect(mocks.$fetch).toHaveBeenCalledTimes(0)
    await DruxtView.watch.displayId.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(1)
    wrapper.vm.model.page = 1
    await localVue.nextTick()
    expect(mocks.$fetch).toHaveBeenCalledTimes(2)
    wrapper.vm.model.sort = 'nid'
    await localVue.nextTick()
    expect(mocks.$fetch).toHaveBeenCalledTimes(3)
    await DruxtView.watch.query.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(4)
    await DruxtView.watch.uuid.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(5)
    await DruxtView.watch.viewId.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(6)
  })

  // TODO : Fix test for filters / attachments, etc.
  // test('recipes--embed', async () => {
  //   const wrapper = mountComponent({
  //     displayId: 'embed_1',
  //     uuid: 'f6c38097-d534-4bfb-87d9-09526fe44e9c',
  //   })
  //   await wrapper.vm.$options.fetch.call(wrapper.vm)

  //   // Fetch key.
  //   expect(DruxtView.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe('DruxtView:f6c38097-d534-4bfb-87d9-09526fe44e9c:embed_1:0')

  //   // Scoped slots.
  //   const scopedSlots = wrapper.vm.getScopedSlots.call(mocks)
  //   expect(Object.keys(scopedSlots)).toStrictEqual([
  //     'header',
  //     // 'filters',
  //     // 'sorts',
  //     // 'attachments_before',
  //     'results',
  //     // 'pager',
  //     // 'attachments_after',
  //     'default'
  //   ])

  //   const h = jest.fn()
  //   const mockSlots = DruxtView.druxt.slots.call({
  //     $createElement: h,
  //     headers: wrapper.vm.headers,
  //     filters: wrapper.vm.filters,
  //     results: wrapper.vm.results,
  //   }, h)
  //   for (const key of Object.keys(mockSlots).filter((key) => key !== 'default')) {
  //     mockSlots[key] = jest.fn()
  //   }
  //   mockSlots.default({ foo: 'bar' })
  //   expect(mockSlots.header).toBeCalledWith({ foo: 'bar' })
  //   expect(mockSlots.filters).toBeCalledWith({ foo: 'bar' })
  //   expect(mockSlots.results).toBeCalledWith({ foo: 'bar' })
  // })

  test('getQuery', async () => {
    const mock = { arguments: [], model: {} }
    expect(DruxtView.methods.getQuery.call(mock)).toStrictEqual({})

    mock.display = { display_options: { filters: [{
      entity_type: 'node',
      plugin_id: 'bundle',
      value: { page: 'page' }
    }] } }
    expect(DruxtView.methods.getQuery.call(mock)).toStrictEqual({})

    // Druxt query settings.
    const settings = { query: { fields: ['title'] }}
    expect(DruxtView.methods.getQuery.call(mock, settings)).toStrictEqual({})

    settings.query.bundleFilter = true
    expect(DruxtView.methods.getQuery.call(mock, settings)).toStrictEqual({
      'fields[node--page]': 'uuid,title'
    })
  })

  test('v-model', () => {
    const h = jest.fn((tag, options, children) => {
      options.on.input.call(mock, options.attrs.mock)
    })
    const mock = {
      filters: [{
        id: 'test',
        plugin_id: 'test',
        expose: {
          identifier: 'test',
        },
      }],
      model: {
        filter: {},
        page: null,
        sort: null,
      },
      results: [],
      showPager: true,
      showSorts: true,
    }
    const slots = DruxtView.druxt.slots.call(mock, h)

    // Filters
    expect(mock.model.filter).toStrictEqual({})
    slots.filters({ mock: { test: 1 } })
    expect(mock.model.filter).toStrictEqual({ test: 1 })

    // Sorts
    expect(mock.model.sort).toStrictEqual(null)
    slots.sorts({ mock: 'test' })
    expect(mock.model.sort).toStrictEqual('test')

    // Pager
    expect(mock.model.page).toStrictEqual(null)
    slots.pager({ mock: 1 })
    expect(mock.model.page).toStrictEqual(1)
  })
})
