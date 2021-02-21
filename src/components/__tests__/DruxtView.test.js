import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtViewsStore, DruxtView } from '../..'

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
    $route: {
      query: {}
    }
  }

  return mount(DruxtView, { localVue, mocks, propsData, store })
}

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
    expect(wrapper.vm.headers).toStrictEqual([])
    expect(wrapper.vm.mode).toBe('card')

    // DruxtComponentMixin.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewFeaturedArticlesPage1',
      'DruxtViewFeaturedArticles'
    ])

    // Pagination.
    wrapper.vm.model.page = 1
    expect(wrapper.vm.query).toStrictEqual({ page: 1 })
    expect(wrapper.vm.showPager).toBe(true)

    wrapper.vm.$route.query = {}
    await localVue.nextTick()
    expect(wrapper.vm.model).toStrictEqual({ page: null, sort: null })
    expect(wrapper.vm.query).toStrictEqual({})

    // Sorting.
    wrapper.vm.model.sort = 'test'
    expect(wrapper.vm.query).toStrictEqual({ 'views-sort[sort_by]': 'test' })
    expect(wrapper.vm.showSorts).toBe(false)
  })
})
