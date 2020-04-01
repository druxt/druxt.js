import { shallowMount, createLocalVue } from '@vue/test-utils'
import { DruxtRouterStore } from 'druxt-router'
import Vuex from 'vuex'

import { DruxtBreadcrumb } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mountComponent = ({ path, routes }) => {
  // Setup mocks.
  const mocks = {
    $route: { path }
  }

  if (typeof routes === 'undefined') {
    routes = [path]
  }

  // Add mock route to store.
  for (const route of routes) {
    store.commit('druxtRouter/addRoute', {
      path: route,
      route: {
        data: { label: route }
      }
    })
  }
  store.commit('druxtRouter/setRoute', path)

  return shallowMount(DruxtBreadcrumb, { store, localVue, mocks })
}

describe('DruxtBreadcrumb', () => {
  beforeEach(() => {
    // Setup vuex stores.
    store = new Vuex.Store()
    store.$druxtRouter = jest.fn(() => ({
      getRoute: async () => ({ data: {} })
    }))
    DruxtRouterStore({ store })
  })

  test('root', () => {
    const wrapper = mountComponent({ path: '/' })

    expect(wrapper.vm.route).toStrictEqual({
      label: '/'
    })

    expect(Object.keys(wrapper.vm.routes)).toHaveLength(1)
    expect(Object.keys(wrapper.vm.items)).toHaveLength(1)
    expect(wrapper.vm.crumbs).toHaveLength(1)

    expect(wrapper.vm.crumbs[0].to).toBe('/')
  })

  test('level 1', () => {
    const wrapper = mountComponent({ path: '/level-1', routes: ['/', '/level-1'] })

    expect(wrapper.vm.route).toStrictEqual({
      label: '/level-1'
    })

    expect(Object.keys(wrapper.vm.routes)).toHaveLength(2)
    expect(Object.keys(wrapper.vm.items)).toHaveLength(2)
    expect(wrapper.vm.crumbs).toHaveLength(2)

    expect(wrapper.vm.crumbs[0].to).toBe('/')
  })

  test('level 2', async () => {
    const wrapper = mountComponent({ path: '/level-1/level-2', routes: ['/', '/level-1', '/level-1/level-2'] })

    expect(wrapper.vm.route).toStrictEqual({
      label: '/level-1/level-2'
    })

    expect(Object.keys(wrapper.vm.routes)).toHaveLength(3)
    expect(Object.keys(wrapper.vm.items)).toHaveLength(3)

    // Expect 1 item to be loading.
    expect(wrapper.vm.loading).toBe(1)
    expect(wrapper.vm.crumbs).toHaveLength(0)

    // Wait for loading to complete.
    await localVue.nextTick()

    expect(wrapper.vm.loading).toBe(0)
    expect(wrapper.vm.crumbs).toHaveLength(3)

    expect(wrapper.vm.crumbs[0].to).toBe('/')
  })

  test('missing parent', async () => {
    const wrapper = mountComponent({ path: '/level-1/level-2', routes: ['/', '/level-1/level-2'] })

    expect(wrapper.vm.route).toStrictEqual({
      label: '/level-1/level-2'
    })

    expect(Object.keys(wrapper.vm.routes)).toHaveLength(2)
    expect(Object.keys(wrapper.vm.items)).toHaveLength(3)

    // Expect 1 item to be loading.
    expect(wrapper.vm.loading).toBe(1)
    expect(wrapper.vm.crumbs).toHaveLength(0)

    // Wait for loading to complete.
    // @TODO - Figure out how to do this better.
    await localVue.nextTick()
    await localVue.nextTick()

    expect(wrapper.vm.loading).toBe(0)
    expect(wrapper.vm.crumbs).toHaveLength(2)

    expect(wrapper.vm.crumbs[0].to).toBe('/')
  })

})
