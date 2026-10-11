import Vue from 'vue'
import { createLocalVue, mount } from '@vue/test-utils'
import DruxtViewsPage from '../../src/components/DruxtViewsPage.vue'

/* eslint-disable vue/one-component-per-file */
const localVue = createLocalVue()
// The real DruxtView fetches; a stub shows what the page handed it.
localVue.component('DruxtView', {
  props: {
    viewId: { type: String, default: '' },
    displayId: { type: String, default: '' },
    arguments: { type: Array, default: () => [] },
    value: { type: Object, default: null },
  },
  render(h) {
    return h('div', {
      attrs: {
        'data-view': JSON.stringify({
          viewId: this.viewId,
          displayId: this.displayId,
          arguments: this.arguments,
          value: this.value,
        }),
      },
    })
  },
})
localVue.component('DruxtDebug', {
  props: { summary: { type: String, default: '' } },
  render(h) {
    return h('p', [this.summary, this.$slots.default])
  },
})

const pages = {
  '/shop/:collection?': {
    viewId: 'products',
    displayId: 'page_1',
    arguments: ['collection'],
    filters: { brand: { query: 'brand' } },
    aliases: { collection: { women: '12' }, brand: { centarro: '3' } },
  },
}

const mountPage = (route = {}, history) => {
  // Reactive, the way the real router's route is, so a change reaches the page.
  const $route = Vue.observable({
    name: 'druxt-views-page-shop-collection',
    path: '/shop',
    meta: { druxtViewsPage: '/shop/:collection?' },
    params: {},
    query: {},
    ...route,
  })
  const $router = { replace: jest.fn(), push: jest.fn() }
  const map = history
    ? {
        ...pages,
        '/shop/:collection?': { ...pages['/shop/:collection?'], history },
      }
    : pages
  const wrapper = mount(DruxtViewsPage, {
    localVue,
    mocks: { $route, $router, $druxtViewsPages: map },
  })
  return { wrapper, $route, $router }
}

const handed = (wrapper) => JSON.parse(wrapper.find('[data-view]').attributes('data-view'))
const view = (wrapper) => wrapper.findComponent({ name: 'DruxtView' }).vm

describe('DruxtViewsPage', () => {
  test('hands DruxtView the model from the route', () => {
    const { wrapper } = mountPage({
      path: '/shop/women',
      params: { collection: 'women' },
      query: { brand: 'centarro', page: '2', sort: 'created' },
    })
    expect(handed(wrapper)).toEqual({
      viewId: 'products',
      displayId: 'page_1',
      arguments: ['12'],
      value: { filter: { brand: '3' }, page: 2, sort: 'created' },
    })
  })

  test('sends all for a missing argument', () => {
    const { wrapper } = mountPage()
    expect(handed(wrapper).arguments).toEqual(['all'])
  })

  test('writes a model change to the URL with replace, and does nothing for the same location', async () => {
    const { wrapper, $router } = mountPage({
      path: '/shop/women',
      params: { collection: 'women' },
    })
    view(wrapper).$emit('input', {
      filter: { brand: '3' },
      page: null,
      sort: null,
    })
    await wrapper.vm.$nextTick()
    expect($router.replace).toHaveBeenCalledWith({
      path: '/shop/women',
      query: { brand: 'centarro' },
    })
    expect($router.push).not.toHaveBeenCalled()
    $router.replace.mockClear()
    view(wrapper).$emit('input', { filter: {}, page: null, sort: null })
    await wrapper.vm.$nextTick()
    expect($router.replace).not.toHaveBeenCalled()
  })

  test('pushes when configured, and clears a filter from the URL', async () => {
    const { wrapper, $router } = mountPage(
      {
        path: '/shop/women',
        params: { collection: 'women' },
        query: { brand: 'centarro' },
      },
      'push'
    )
    view(wrapper).$emit('input', { filter: {}, page: null, sort: null })
    await wrapper.vm.$nextTick()
    expect($router.push).toHaveBeenCalledWith({
      path: '/shop/women',
      query: {},
    })
    expect($router.replace).not.toHaveBeenCalled()
  })

  test('a route change, such as back, becomes a new value', async () => {
    const { wrapper, $route } = mountPage({
      path: '/shop/women',
      params: { collection: 'women' },
      query: { brand: 'centarro' },
    })
    $route.query = {}
    await wrapper.vm.$nextTick()
    expect(handed(wrapper).value).toEqual({
      filter: {},
      page: null,
      sort: null,
    })
    $route.params = { collection: 'other' }
    await wrapper.vm.$nextTick()
    expect(handed(wrapper).arguments).toEqual(['other'])
  })

  test('provides links for the pager', () => {
    const { wrapper } = mountPage({
      path: '/shop/women',
      params: { collection: 'women' },
      query: { brand: 'centarro' },
    })
    expect(wrapper.vm.link({ page: 2 })).toEqual({
      path: '/shop/women',
      query: { brand: 'centarro', page: '2' },
    })
  })

  test('renders a DruxtDebug when the route names no page', () => {
    const wrapper = mount(DruxtViewsPage, {
      localVue,
      mocks: {
        $route: { meta: {}, path: '/x', params: {}, query: {} },
        $router: {},
        $druxtViewsPages: {},
      },
    })
    expect(wrapper.text()).toContain('No Views page')
    expect(wrapper.text()).toContain('/x')
  })
})
