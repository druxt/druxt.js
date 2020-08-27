import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'
import { DruxtFieldNumberInteger } from '..'

jest.mock('axios')

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const stubs = ['nuxt-link']
let store

const mountComponent = (prefix = false, suffix = false, options) => {
  const propsData = {
    items: [0, 1, 2],
    schema: {
      settings: {
        config: {
          prefix,
          suffix
        },
        display: {
          prefix_suffix: !!(prefix || suffix)
        }
      }
    }
  }

  return shallowMount(DruxtFieldNumberInteger, { ...options, localVue, propsData, store, stubs })
}

describe('Component - DruxtFieldNumberInteger', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtRouter = new DruxtRouter(baseURL, {})
    DruxtRouterStore({ store })
  })

  test('default', async () => {
    const wrapper = mountComponent()

    expect(wrapper.vm.prefix).toBe(false)
    expect(wrapper.vm.suffix).toBe(false)

    expect(wrapper.vm.items.length).toBe(3)
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('prefix', async () => {
    const wrapper = mountComponent('#')

    expect(wrapper.vm.prefix).toBe('#')
    expect(wrapper.vm.suffix).toBe(false)

    expect(wrapper.vm.items.length).toBe(3)
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('suffix', async () => {
    const wrapper = mountComponent(false, ' item(s)')

    expect(wrapper.vm.prefix).toBe(false)
    expect(wrapper.vm.suffix).toBe(' item(s)')

    expect(wrapper.vm.items.length).toBe(3)
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('prefix_suffix', async () => {
    const wrapper = mountComponent('AUD $', '.00')

    expect(wrapper.vm.prefix).toBe('AUD $')
    expect(wrapper.vm.suffix).toBe('.00')

    expect(wrapper.vm.items.length).toBe(3)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
