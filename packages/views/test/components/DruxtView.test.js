import 'regenerator-runtime/runtime'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { DruxtViewsStore } from '../../src'
import DruxtView from '../../src/components/DruxtView.vue'
import { getMockResource } from '../../../test-utils/src'

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
  $nuxt: {
    context: {
      isDev: false,
    }
  },
  $route: {
    query: {}
  }
}

const stubs = ['DruxtDebug', 'DruxtEntity']
const mountComponent = (propsData) => shallowMount(DruxtView, { localVue, mocks, propsData, store, stubs })

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
      viewId: wrapper.vm.viewId,
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
    expect(wrapper.vm.component.options).toMatchSnapshot()

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
    expect(mocks.$fetch).toHaveBeenCalledTimes(2)
    await DruxtView.watch.displayId.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(3)
    wrapper.vm.model.page = 1
    await localVue.nextTick()
    expect(mocks.$fetch).toHaveBeenCalledTimes(4)
    wrapper.vm.model.sort = 'nid'
    await localVue.nextTick()
    expect(mocks.$fetch).toHaveBeenCalledTimes(5)
    await DruxtView.watch.uuid.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(6)
    await DruxtView.watch.viewId.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(7)
  })

  test('fetch by uuid', async () => {
    const mockView = await getMockResource('view--view')
    const wrapper = mountComponent({
      uuid: mockView.data.id,
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Fetch key.
    expect(DruxtView.fetchKey.call(wrapper.vm, jest.fn(() => 0))).toBe(`DruxtView:${mockView.data.id}:default:0`)
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
    const h = jest.fn((tag, options) => {
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
      viewId: 'test'
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

  test('error - missing required props', async () => {
    const wrapper = mountComponent({})
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    const h = jest.fn()
    const slotsMock = {
      $createElement: h,
      display: wrapper.vm.display,
      filters: wrapper.vm.filters,
      results: wrapper.vm.results,
      viewId: wrapper.vm.viewId,
    }
    const slots = DruxtView.druxt.slots.call(slotsMock, h)
    expect(Object.entries(slots).length).toBe(1)
    slots.default()
    expect(h).toHaveBeenCalledWith(
      'DruxtDebug',
      expect.any(Object),
      expect.any(Array)
    )
  })

  test('takes its model from a value and emits input on change', async () => {
    const value = { filter: { brand: '3' }, page: 2, sort: 'created' }
    // A stable arguments array, since a re-render with the default factory
    // would give a new one and fire that watcher instead.
    const wrapper = mountComponent({ viewId: 'test', displayId: 'page_1', value, arguments: [] })
    expect(wrapper.vm.model).toEqual(value)

    // A replaced model emits one copy, however many watchers it fires.
    // DruxtModule's own model watcher emits the model object itself as well.
    wrapper.vm.model = { filter: { brand: '4' }, page: 3, sort: 'title' }
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    const copies = wrapper.emitted('input').filter(([v]) => v !== wrapper.vm.model)
    expect(copies).toHaveLength(1)
    expect(copies[0][0]).toEqual({ filter: { brand: '4' }, page: 3, sort: 'title' })

    // The same value again does not touch the model; a new one sets it.
    const spy = jest.spyOn(wrapper.vm, 'refetch')
    await wrapper.setProps({ value: { filter: { brand: '4' }, page: 3, sort: 'title' } })
    await wrapper.vm.$nextTick()
    expect(spy).not.toHaveBeenCalled()
    await wrapper.setProps({ value: { filter: {}, page: null, sort: null } })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.model).toEqual({ filter: {}, page: null, sort: null })
    expect(spy).toHaveBeenCalled()
  })

  test('with a value, an empty route query does not reset the model', async () => {
    const value = { filter: { brand: '3' }, page: null, sort: null }
    const wrapper = mountComponent({ viewId: 'test', value })
    // Extended components hold watchers as arrays.
    const routeQuery = (vm) =>
      [].concat(vm.$options.watch['$route.query']).forEach((w) => (w.handler || w).call(vm, {}))
    routeQuery(wrapper.vm)
    expect(wrapper.vm.model.filter).toEqual({ brand: '3' })
    // Without a value the reset still applies.
    const plain = mountComponent({ viewId: 'test' })
    plain.vm.model.filter = { brand: '3' }
    routeQuery(plain.vm)
    expect(plain.vm.model.filter).toEqual({})
  })

  test('load more appends each page, up to the one asked for', async () => {
    const page = (id, next) => ({ data: [{ id }], links: next ? { next: { href: `?page=${next}` } } : {} })
    const responses = { '': page('a', 1), 'page=1': page('b', 2), 'page=2': page('c') }
    const getResults = jest.fn(async ({ query }) => responses[query] || page(`filtered:${query}`))
    const vm = {
      displayId: 'default',
      getResults,
      lang: 'en',
      loaded: { key: null, pages: [] },
      model: { filter: {}, page: 2, sort: null },
      pager: { type: 'infinite_scroll' },
      viewId: 'recipes',
    }
    vm.getQuery = (settings) => DruxtView.methods.getQuery.call({ arguments: [], model: vm.model }, settings)
    const fetch = () => DruxtView.druxt.fetchData.call(vm, {})
    const ids = () => DruxtView.computed.results.call(vm).map((result) => result.id)
    const queries = () => getResults.mock.calls.splice(0).map(([payload]) => payload.query)

    // A page in the URL loads every page up to it.
    await fetch()
    expect(queries()).toStrictEqual(['', 'page=1', 'page=2'])
    expect(ids()).toStrictEqual(['a', 'b', 'c'])
    expect(vm.resource).toBe(responses['page=2'])

    // Going back a page keeps the pages before it.
    vm.model.page = 1
    await fetch()
    expect(queries()).toStrictEqual(['page=1'])
    expect(ids()).toStrictEqual(['a', 'b'])

    // The next page is the only request.
    vm.model.page = 2
    await fetch()
    expect(queries()).toStrictEqual(['page=2'])
    expect(ids()).toStrictEqual(['a', 'b', 'c'])

    // Another filter starts again from the first page.
    vm.model = { filter: { q: 'soup' }, page: null, sort: null }
    await fetch()
    expect(queries()).toStrictEqual(['views-filter%5Bq%5D=soup'])
    expect(ids()).toStrictEqual(['filtered:views-filter%5Bq%5D=soup'])
  })

  test('load more with "Initially load all pages" asks for the page once', async () => {
    const getResults = jest.fn(async ({ query }) => ({ data: query ? [{ id: 'a' }, { id: 'b' }] : [{ id: 'a' }] }))
    const vm = {
      displayId: 'default',
      getResults,
      lang: 'en',
      loaded: { key: null, pages: [] },
      model: { filter: {}, page: 1, sort: null },
      pager: { type: 'infinite_scroll', options: { views_infinite_scroll: { initially_load_all_pages: true } } },
      viewId: 'recipes',
    }
    vm.getQuery = (settings) => DruxtView.methods.getQuery.call({ arguments: [], model: vm.model }, settings)
    await DruxtView.druxt.fetchData.call(vm, {})
    expect(getResults.mock.calls.map(([payload]) => payload.query)).toStrictEqual(['page=1'])
    expect(DruxtView.computed.results.call(vm).map((result) => result.id)).toStrictEqual(['a', 'b'])
  })

  test('the loadMore setting overrides the display pager', async () => {
    const getResults = jest.fn(async () => ({ data: [{ id: 'a' }] }))
    const vm = { displayId: 'default', getResults, lang: 'en', loaded: { key: null, pages: [] }, model: { filter: {}, page: 1, sort: null }, viewId: 'recipes' }
    vm.getQuery = (settings) => DruxtView.methods.getQuery.call({ arguments: [], model: vm.model }, settings)

    vm.pager = { type: 'infinite_scroll' }
    await DruxtView.druxt.fetchData.call(vm, { pager: { loadMore: false } })
    expect(vm.loadMore).toBe(false)
    expect(getResults).toHaveBeenCalledTimes(1)

    vm.pager = { type: 'mini' }
    await DruxtView.druxt.fetchData.call(vm, { pager: { loadMore: true } })
    expect(vm.loadMore).toBe(true)
    expect(getResults).toHaveBeenCalledTimes(3)
    expect(DruxtView.computed.results.call(vm)).toHaveLength(2)

    // Its pager is the load more pager.
    vm.showPager = true
    vm.count = 2
    vm.resource = {}
    vm.$scopedSlots = {}
    const h = jest.fn((tag, options) => options)
    const slots = DruxtView.druxt.slots.call({ ...vm, attachments_after: false, attachments_before: false, headers: [], results: [], display: {}, showSorts: false, filters: [] }, h)
    expect(slots.pager({}).props.type).toBe('infinite_scroll')
  })

  test('refetch waits out a running fetch', async () => {
    const wrapper = mountComponent({ viewId: 'test' })
    let release
    wrapper.vm._fetchPromise = new Promise((resolve) => { release = resolve })
    const calls = wrapper.vm.$fetch.mock.calls.length
    const pending = wrapper.vm.refetch()
    expect(wrapper.vm.$fetch.mock.calls.length).toBe(calls)
    release()
    await pending
    expect(wrapper.vm.$fetch.mock.calls.length).toBe(calls + 1)
  })
})
