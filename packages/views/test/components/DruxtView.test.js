import 'regenerator-runtime/runtime'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
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
    store.$druxt = new DruxtClient('https://api.umami.demo.druxtjs.org')

    DruxtViewsStore({ store })

    store.app = { context: { error: jest.fn() }, store }
  })

  test('featured_articles', async () => {
    // One of the component names below is built from the view's uuid, which
    // belongs to the install. It is read here, before the component fetches,
    // and taken out of the snapshot.
    const viewQuery = new DrupalJsonApiParams().addFilter('drupal_internal__id', 'featured_articles')
    const mockView = await getMockResource('view--view', viewQuery)
    const viewUuid = mockView.data.id.replace(/-/g, '')

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
    expect(wrapper.vm.component.options.map((option) => option.replace(new RegExp(viewUuid, 'i'), '{uuid}'))).toMatchSnapshot()

    // A URL holding a filter, which is cleared below. A query that holds
    // nothing new does not reset the view.
    wrapper.vm.$route.query = { 'filter[test]': '1' }
    await localVue.nextTick()

    // Query.
    await wrapper.setProps({ arguments: [1, 2, 3] })
    wrapper.vm.model = {
      page: 1,
      filter: { test: 1 },
      sort: 'test'
    }
    // featured_articles exposes neither a `test` filter nor a sort, so only
    // the page goes to Drupal.
    expect(wrapper.vm.getQuery(wrapper.vm.component.settings)).toStrictEqual({
      page: '1',
      'views-argument[0]': 1,
      'views-argument[1]': 2,
      'views-argument[2]': 3,
    })
    expect(wrapper.vm.showPager).toBe(true)
    expect(wrapper.vm.showSorts).toBe(false)

    wrapper.vm.onFiltersUpdate()
    expect(wrapper.vm.model.page).toBe(null)
    expect(wrapper.vm.model.sort).toBe(null)

    // The URL that held a filter, cleared.
    wrapper.vm.$route.query = {}
    await wrapper.setProps({ arguments: [] })
    await localVue.nextTick()

    expect(wrapper.vm.model).toStrictEqual({
      filter: {},
      page: null,
      sort: null
    })
    expect(wrapper.vm.getQuery(wrapper.vm.component.settings)).toStrictEqual({})

    // Watches. Clearing the URL and the arguments each asked for a fetch,
    // which Nuxt joins into one.
    expect(mocks.$fetch).toHaveBeenCalledTimes(3)
    await DruxtView.watch.displayId.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(4)
    wrapper.vm.model.page = 1
    await localVue.nextTick()
    expect(mocks.$fetch).toHaveBeenCalledTimes(5)
    wrapper.vm.model.sort = 'nid'
    await localVue.nextTick()
    expect(mocks.$fetch).toHaveBeenCalledTimes(6)
    await DruxtView.watch.uuid.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(7)
    await DruxtView.watch.viewId.call(mocks)
    expect(mocks.$fetch).toHaveBeenCalledTimes(8)
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

  test('the pager gets the route setting', () => {
    const h = jest.fn((tag, data) => data)
    const mock = { component: { settings: { route: false } }, filters: [], headers: {}, model: { page: null }, results: [], showPager: true, viewId: 'test' }
    expect(DruxtView.druxt.slots.call(mock, h).pager({}).props.route).toBe(false)
    mock.component.settings = {}
    expect(DruxtView.druxt.slots.call(mock, h).pager({}).props.route).toBe(true)
  })

  test('the sorts get the route setting', () => {
    const h = jest.fn((tag, data) => data)
    const mock = { component: { settings: { route: false } }, filters: [], headers: {}, model: { sort: null }, results: [], showSorts: true, sorts: [], viewId: 'test' }
    expect(DruxtView.druxt.slots.call(mock, h).sorts({}).props.route).toBe(false)
    mock.component.settings = {}
    expect(DruxtView.druxt.slots.call(mock, h).sorts({}).props.route).toBe(true)
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

  // Drupal gives each view on a page what it owns of the query: its pager's
  // place in `page=0,2`, the identifiers of its exposed filters, and the sorts
  // it exposes. Views share a key only where Drupal would.
  describe('what a view owns of the URL query', () => {
    const owner = {
      pagerId: 1,
      filterKeys: ['difficulty'],
      showPager: true,
      sortIds: ['created'],
    }

    test('filterKeys', () => {
      expect(DruxtView.computed.filterKeys.call({ filters: [
        { expose: { identifier: 'title', operator_id: 'title_op', use_operator: true } },
        { expose: { identifier: 'type', operator_id: 'type_op', use_operator: false } },
        { expose: { identifier: 'status' }, group_info: { identifier: 'published' }, is_grouped: true },
      ] })).toStrictEqual(['title', 'title_op', 'type', 'status', 'published'])
    })

    test('pagerId', () => {
      expect(DruxtView.computed.pagerId.call({ pager: { options: { id: 1 } } })).toBe(1)
      expect(DruxtView.computed.pagerId.call({ pager: { options: { id: '2' } } })).toBe(2)
      expect(DruxtView.computed.pagerId.call({ pager: { type: 'full' } })).toBe(0)
      expect(DruxtView.computed.pagerId.call({ pager: false })).toBe(0)
    })

    test('fromRoute', () => {
      const fromRoute = (query, vm = owner) => DruxtView.methods.fromRoute.call(vm, query)

      expect(fromRoute({ page: '0,2', 'filter[difficulty]': 'easy', 'filter[other]': 'x', sort: 'title', utm: 'a' }))
        .toStrictEqual({ filter: { difficulty: 'easy' }, page: 2, sort: null })
      // A bare page is pager 0's.
      expect(fromRoute({ page: '3', sort: 'created' })).toStrictEqual({ filter: {}, page: null, sort: 'created' })
      expect(fromRoute({ page: '3' }, { ...owner, pagerId: 0 })).toStrictEqual({ filter: {}, page: 3, sort: null })
      // A view with no pager takes no page.
      expect(fromRoute({ page: '0,2' }, { ...owner, showPager: false })).toStrictEqual({ filter: {}, page: null, sort: null })
      // Nested values, as qs writes a range.
      expect(fromRoute({ 'filter[difficulty][min]': '1' })).toStrictEqual({ filter: { difficulty: { min: '1' } }, page: null, sort: null })
    })

    test('getQuery', () => {
      const mock = { arguments: [], ...owner, model: { filter: { difficulty: 'easy', other: 'x' }, page: 2, sort: 'title' } }
      expect(DruxtView.methods.getQuery.call(mock)).toStrictEqual({ page: '0,2', 'views-filter': { difficulty: 'easy' } })

      mock.model = { filter: { other: 'x' }, page: null, sort: 'created' }
      expect(DruxtView.methods.getQuery.call(mock)).toStrictEqual({ 'views-sort[sort_by]': 'created' })

      expect(DruxtView.methods.getQuery.call({ ...mock, pagerId: 0, model: { filter: {}, page: 1, sort: null } }))
        .toStrictEqual({ page: '1' })
    })

    describe('updateRoute', () => {
      const write = (query, model, vm = {}) => {
        const mock = {
          ...owner,
          showSorts: false,
          ...vm,
          $route: { hash: '', query },
          $router: { replace: jest.fn() },
          component: { settings: {} },
          model: { filter: {}, page: null, sort: null, ...model },
        }
        DruxtView.methods.updateRoute.call(mock)
        const [call] = mock.$router.replace.mock.calls
        return call && call[0].query
      }

      test('the page goes in the pager\'s place', () => {
        expect(write({ page: '3', utm: 'a' }, { page: 2 })).toStrictEqual({ page: '3,2', utm: 'a' })
        expect(write({ page: '3,2', utm: 'a' }, { page: null })).toStrictEqual({ page: '3', utm: 'a' })
        expect(write({ page: '0,2' }, { page: 1 }, { pagerId: 0 })).toStrictEqual({ page: '1,2' })
        expect(write({ page: '1,2' }, { page: null }, { pagerId: 0 })).toStrictEqual({ page: '0,2' })
        expect(write({ page: '0,2' }, { page: null }, { pagerId: 0 })).toBeUndefined()
        expect(write({}, { page: 2 }, { pagerId: 2 })).toStrictEqual({ page: '0,0,2' })
      })

      test('a view with no pager leaves the page alone', () => {
        expect(write({ page: '2' }, { filter: { difficulty: 'easy' } }, { pagerId: 0, showPager: false }))
          .toStrictEqual({ page: '2', 'filter[difficulty]': 'easy' })
      })

      test('only the view\'s own filters are written', () => {
        expect(write({ 'filter[difficulty]': 'medium', 'filter[other]': 'x' }, { filter: { difficulty: 'easy', other: 'y' } }))
          .toStrictEqual({ 'filter[difficulty]': 'easy', 'filter[other]': 'x' })
        expect(write({ 'filter[difficulty]': 'medium', 'filter[other]': 'x' }, { filter: {} }))
          .toStrictEqual({ 'filter[other]': 'x' })
        expect(write({ 'filter[other]': 'x' }, { filter: { difficulty: 'easy' } }, { filterKeys: [] }))
          .toBeUndefined()
      })

      test('a sort the view exposes, and no other', () => {
        const vm = { showSorts: true }
        expect(write({ sort: 'title' }, { sort: null }, vm)).toBeUndefined()
        expect(write({ sort: 'title' }, { sort: 'created' }, vm)).toStrictEqual({ sort: 'created' })
        expect(write({ sort: 'created' }, { sort: null }, vm)).toStrictEqual({})
      })
    })
  })
})
