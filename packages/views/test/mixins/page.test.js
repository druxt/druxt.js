import Vue from 'vue'
import { createLocalVue, mount } from '@vue/test-utils'
import { DruxtViewsPageMixin } from '../../src/mixins/page'

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
    return h('div', { attrs: { 'data-view': JSON.stringify({ arguments: this.arguments, value: this.value }) } })
  },
})

// A list inside a doc page the site routes itself: the page owns `issue`,
// the view owns `area`.
const page = {
  pattern: '/how-to/troubleshooting/:issue?',
  viewId: 'docs_issues',
  filters: { area: { query: 'area' } },
}

const IssueList = {
  mixins: [DruxtViewsPageMixin],
  render(h) {
    return h('DruxtView', { props: this.viewProps, on: { input: this.onInput } })
  },
}

const mountList = (route = {}) => {
  // Reactive, the way the real router's route is, so a change reaches the list.
  const $route = Vue.observable({
    name: 'how-to-troubleshooting-issue',
    path: '/how-to/troubleshooting/cors-errors',
    meta: {},
    params: { issue: 'cors-errors' },
    query: {},
    ...route,
  })
  const $router = { replace: jest.fn(), push: jest.fn() }
  const wrapper = mount(IssueList, { localVue, propsData: { page }, mocks: { $route, $router } })
  return { wrapper, $route, $router }
}

const handed = (wrapper) => JSON.parse(wrapper.find('[data-view]').attributes('data-view'))
const view = (wrapper) => wrapper.findComponent({ name: 'DruxtView' }).vm

describe('DruxtViewsPageMixin inside a page', () => {
  test('reads the view model from the route, through the page prop', () => {
    const { wrapper } = mountList({ query: { area: 'backend' } })
    expect(wrapper.vm.config.viewId).toBe('docs_issues')
    expect(handed(wrapper)).toEqual({ arguments: [], value: { filter: { area: 'backend' }, page: null, sort: null } })
  })

  test('a pick keeps the open item in the path', async () => {
    const { wrapper, $router } = mountList()
    view(wrapper).$emit('input', { filter: { area: 'backend' }, page: null, sort: null })
    await wrapper.vm.$nextTick()
    expect($router.replace).toHaveBeenCalledWith({
      path: '/how-to/troubleshooting/cors-errors',
      query: { area: 'backend' },
    })
  })

  test('a clear keeps it too', async () => {
    const { wrapper, $router } = mountList({ query: { area: 'backend' } })
    view(wrapper).$emit('input', { filter: {}, page: null, sort: null })
    await wrapper.vm.$nextTick()
    expect($router.replace).toHaveBeenCalledWith({ path: '/how-to/troubleshooting/cors-errors', query: {} })
  })

  test('back to the page without an item becomes a new value, and the pager links follow', async () => {
    const { wrapper, $route } = mountList({ query: { area: 'backend' } })
    $route.path = '/how-to/troubleshooting'
    $route.params = {}
    $route.query = {}
    await wrapper.vm.$nextTick()
    expect(handed(wrapper).value).toEqual({ filter: {}, page: null, sort: null })
    expect(wrapper.vm.link({ page: 1 })).toEqual({ path: '/how-to/troubleshooting', query: { page: '1' } })
  })
})
