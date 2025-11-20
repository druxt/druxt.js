import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouterStore } from '../../../../router/src'
import DruxtRouter from '../../../../router/src/components/DruxtRouter.vue'
import DruxtBlockPageTitleBlock from '../../../src/components/blocks/DruxtBlockPageTitleBlock.vue'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mockBlock = {
  id: 'test-block',
  attributes: {},
}

const mountComponent = (entity, options = {}) => {
  const propsData = { block: entity }

  return mount(DruxtBlockPageTitleBlock, {
    localVue,
    propsData,
    store,
    ...options,
  })
}

describe('Component - DruxtBlockPageTitleBlock', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()

    DruxtRouterStore({ store })
    store.$druxtRouter = () => new DruxtRouter('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  // Test default rendering with route label available.
  // This verifies that the page title is correctly retrieved from the router state.
  // How: Add route with label to store, set current route, mount component, assert title matches route label.
  // Why: To ensure page title blocks display the correct title from the current route.
  test('default', async () => {
    store.commit('druxtRouter/addRoute', {
      path: '/',
      route: { label: 'Test' },
    })
    store.commit('druxtRouter/setRoute', '/')
    const wrapper = mountComponent(mockBlock)

    expect(wrapper.vm.title).toBe('Test')
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test title when route has no label.
  // This covers the case where route.label is undefined.
  // How: Add route without label, set current route, mount component, assert title is undefined.
  // Why: To ensure component handles missing labels gracefully without errors.
  test('no label', () => {
    store.commit('druxtRouter/addRoute', {
      path: '/no-label',
      route: { other: 'data' },
    })
    store.commit('druxtRouter/setRoute', '/no-label')
    const wrapper = mountComponent(mockBlock)

    expect(wrapper.vm.title).toBeUndefined()
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test title when no route is set.
  // This covers when state.route is not set.
  // How: Don't set any route, mount component, assert title is undefined.
  // Why: To handle cases where router state is not initialized.
  test('no route', () => {
    const wrapper = mountComponent(mockBlock)

    expect(wrapper.vm.title).toBeUndefined()
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test title with empty string.
  // This covers edge case where route label is an empty string.
  // How: Add route with empty label, set current route, mount component, assert title is empty string.
  // Why: To ensure component handles empty titles correctly.
  test('empty title', () => {
    store.commit('druxtRouter/addRoute', {
      path: '/empty',
      route: { label: '' },
    })
    store.commit('druxtRouter/setRoute', '/empty')
    const wrapper = mountComponent(mockBlock)

    expect(wrapper.vm.title).toBe('')
    expect(wrapper.html()).toMatchSnapshot()
  })

  // Test title with special characters.
  // This covers HTML entity encoding and special character handling.
  // How: Add route with special characters in label, set current route, mount component, assert title and HTML.
  // Why: To ensure titles with special characters are rendered correctly.
  test('special characters', () => {
    store.commit('druxtRouter/addRoute', {
      path: '/special',
      route: { label: 'Test & Title <>' },
    })
    store.commit('druxtRouter/setRoute', '/special')
    const wrapper = mountComponent(mockBlock)

    expect(wrapper.vm.title).toBe('Test & Title <>')
    expect(wrapper.html()).toMatchSnapshot()
  })
})
