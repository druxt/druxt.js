import 'regenerator-runtime/runtime'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouterStore } from '../../../router/src'
import DruxtBreadcrumb from '../../src/components/DruxtBreadcrumb.vue'
import DruxtDebug from '../../../druxt/src/components/DruxtDebug.vue'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mountComponent = ({ path, routes, propsData, options }) => {
  // Setup mocks.
  const mocks = {
    $route: { path },
    $fetchState: { pending: false }
  }

  if (typeof routes === 'undefined') {
    routes = [path]
  }

  // Add mock route to store.
  for (const route of routes) {
    let path = route
    let label = route
    let isHomePath = path === '/'
    if (typeof route === 'object') {
      path = route.path
      label = route.label || path
      isHomePath = route.isHomePath || undefined
    }
    store.commit('druxtRouter/addRoute', {
      path,
      route: {
        label,
        isHomePath
      }
    })
  }
  if (typeof store.state.druxtRouter.routes[path] !== 'undefined') {
    store.commit('druxtRouter/setRoute', path)
  }

  const components = { DruxtDebug }

  return shallowMount(DruxtBreadcrumb, { components, store, localVue, mocks, propsData, ...options })
}

describe('DruxtBreadcrumb', () => {
  beforeEach(() => {
    // Setup vuex stores.
    store = new Vuex.Store()
    store.$druxtRouter = jest.fn(() => ({
      getRoute: async (to) => {
        if (to === '/error') throw new Error('Error')
        return { data: {} }
      }
    }))
    DruxtRouterStore({ store })
  })

  test('root', async () => {
    const wrapper = mountComponent({ path: '/' })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.route).toStrictEqual({
      isHomePath: true,
      label: '/'
    })
    expect(Object.keys(wrapper.vm.routes)).toHaveLength(1)

    expect(wrapper.vm.crumbs).toHaveLength(1)
    expect(wrapper.vm.crumbs[0].text).toBe('/')

    expect(wrapper.html()).toMatchSnapshot()

    // Default slot.
    const slot = wrapper.vm.getScopedSlots().default()
    expect(slot.tag).toBe('ul')
    expect(slot.children[0].tag).toBe('li')
  })

  test('level 1', async () => {
    const wrapper = mountComponent({ path: '/level-1', routes: ['/', '/level-1'] })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.route).toStrictEqual({
      isHomePath: false,
      label: '/level-1'
    })

    expect(wrapper.vm.crumbs).toHaveLength(2)
    expect(wrapper.vm.crumbs[0].to).toBe('/')

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('level 2', async () => {
    const wrapper = mountComponent({
      path: '/level-1/level-2',
      routes: ['/', '/level-1', '/level-1/level-2']
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.route).toStrictEqual({
      isHomePath: false,
      label: '/level-1/level-2'
    })

    expect(wrapper.vm.crumbs).toHaveLength(3)
    expect(wrapper.vm.crumbs[0].to).toBe('/')

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('manual path', async () => {
    const wrapper = mountComponent({
      path: undefined,
      propsData: {
        path: '/level-1/level-2',
      },
      routes: ['/', '/level-1', '/level-1/level-2']
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.route).toStrictEqual({})

    expect(wrapper.vm.crumbs).toHaveLength(3)
    expect(wrapper.vm.crumbs[0].to).toBe('/')

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('missing parent', async () => {
    const wrapper = mountComponent({ path: '/level-1/level-2', routes: ['/', '/level-1/level-2'] })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.route).toStrictEqual({
      isHomePath: false,
      label: '/level-1/level-2'
    })

    expect(wrapper.vm.crumbs).toHaveLength(2)
    expect(wrapper.vm.crumbs[0].to).toBe('/')

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('404 route', async () => {
    const wrapper = mountComponent({ path: '/level-1/level-2', routes: ['/'] })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.route).toStrictEqual({})
    expect(wrapper.vm.crumbs).toStrictEqual([{
      text: 'Home',
      to: '/'
    }])

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('multilingual home', async () => {
    const wrapper = mountComponent({ path: '/en/level-1', routes: ['/', {
      label: 'Home',
      path: '/en',
      isHomePath: true
    }] })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.route).toStrictEqual({})
    expect(wrapper.vm.crumbs).toStrictEqual([{
      text: 'Home',
      to: '/en'
    }])
  })

  test('error', async () => {
    const wrapper = mountComponent({ path: '/error/level-2', routes: ['/', '/error/level-2'] })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.route).toStrictEqual({
      isHomePath: false,
      label: '/error/level-2'
    })

    expect(wrapper.vm.crumbs).toHaveLength(2)
    expect(wrapper.vm.crumbs[0].to).toBe('/')

    // @TODO - Inconsistent behaviour between local and CI. Investigate.
    // expect(wrapper.html()).toMatchSnapshot()
  })

  test('no home', async () => {
    const wrapper = mountComponent({ path: '/', propsData: { home: false } })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.crumbs).toBe(null)

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('custom default slot', async () => {
    const scopedSlots = { default: jest.fn() }
    const wrapper = mountComponent({ path: '/', options: { scopedSlots } })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    wrapper.vm.getScopedSlots().default.call()
    expect(scopedSlots.default).toHaveBeenCalledWith({
      crumbs: [{
        text: '/',
      }],
      value: [{
        text: '/',
      }],
    })
  })

  test('watch - props $fetch', async () => {
    const $fetch = jest.fn()
    expect($fetch).toHaveBeenCalledTimes(0)

    DruxtBreadcrumb.watch.$route.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(1)

    DruxtBreadcrumb.watch.home.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(2)

    DruxtBreadcrumb.watch.path.call({ $fetch })
    expect($fetch).toHaveBeenCalledTimes(3)
  })
})
