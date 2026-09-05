import Vue from 'vue'
import { createLocalVue, mount } from '@vue/test-utils'

import ModuleHeader from '~/components/app/ModuleHeader.vue'

const localVue = createLocalVue()

let observed

/**
 * Mounts the header at a starting route, with the module README missing.
 *
 * `$content` rejects, which is what a package whose generated README has
 * not been written looks like: the component's own catch leaves `module`
 * null, and the header still has to render because the page components
 * suppress theirs on these routes.
 *
 * @param {string} path - The starting route path.
 * @returns {object} The Vue Test Utils wrapper.
 */
const mountHeader = (path) => {
  // Reactive, so assigning `$route.path` re-evaluates `pkg` as a real
  // navigation would.
  const $route = Vue.observable({ path })

  return mount(ModuleHeader, {
    localVue,
    mocks: {
      $route,
      $fetch: jest.fn(),
      $content: () => ({
        only: () => ({ fetch: () => Promise.reject(new Error('no README')) }),
        fetch: () => Promise.reject(new Error('no README')),
      }),
      $store: { state: { modules: [] } },
    },
    stubs: ['AppDropdown', 'AppIconGithub', 'NuxtLink'],
  })
}

beforeEach(() => {
  observed = []
  global.IntersectionObserver = class {
    /** @param {Function} callback - The observer callback. */
    constructor(callback) {
      this.callback = callback
    }

    /** @param {object} el - The observed element. */
    observe(el) {
      observed.push(el)
    }

    /** Stops observing. */
    disconnect() {}
  }
})

describe('AppModuleHeader', () => {
  // The header renders on `pkg` alone, so the sentinel appears for a
  // package whose README never loads. Binding the observer on `module`
  // meant it was never observed on that path and the bar never stuck.
  test('observes the sentinel when the route reaches a package without a README', async () => {
    const wrapper = mountHeader('/how-to/proxy')
    expect(wrapper.vm.pkg).toBe(null)
    expect(observed).toHaveLength(0)

    wrapper.vm.$route.path = '/modules/entity'
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.pkg).toBe('entity')
    expect(wrapper.vm.module).toBe(null)
    expect(observed).toHaveLength(1)
    expect(observed[0]).toBe(wrapper.vm.$refs.sentinel)

    wrapper.destroy()
  })

  // The title has to name the page even with no README, because the page
  // component is not rendering a header of its own on this route.
  test('falls back to the package name when the README is missing', () => {
    const wrapper = mountHeader('/modules/entity')

    expect(wrapper.vm.module).toBe(null)
    expect(wrapper.vm.title).toBe('druxt-entity')
    expect(wrapper.vm.description).toBe(null)
    expect(wrapper.find('h1').text()).toBe('druxt-entity')
    expect(wrapper.find('h1').classes()).toContain('sr-only')

    wrapper.destroy()
  })

  // A heading inside the dropdown's <button> is invalid and unreliably
  // exposed; counting h1s cannot see it, so the placement is pinned here.
  test('keeps the heading out of the dropdown trigger', () => {
    const wrapper = mountHeader('/modules/entity')

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('button h1').exists()).toBe(false)

    wrapper.destroy()
  })
})
