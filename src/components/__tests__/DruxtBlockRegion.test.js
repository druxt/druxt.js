import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtBlockRegion } from '..'

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const mocks = {
  $druxtRouter: () => ({
    getResources: jest.fn().mockImplementation(query => Promise.resolve({}))
  })
}
let store

const mountComponent = (name = null, options = {}) => {
  const propsData = { theme: 'test' }
  if (name) {
    propsData.name = name
  }

  return mount(DruxtBlockRegion, { localVue, mocks, propsData, store, ...options })
}

describe('Component - DruxtBlockRegion', () => {
  beforeEach(() => {
    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store({
      modules: {
        druxtRouter: {
          namespaced: true,
          actions: {
            getResources: mocks.$druxtRouter().getResources
          },
          state: {
            route: {
              resolvedPath: '/'
            }
          }
        }
      }
    })
  })

  test('default', async () => {
    const wrapper = mountComponent()
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.name).toBe('content')
    expect(wrapper.vm.theme).toBe('test')

    expect(wrapper.vm.component.options.length).toBe(2)
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtBlockRegionContentTest',
      'DruxtBlockRegionContent'
    ])

    expect(wrapper.vm.component.is).toBe('DruxtWrapper')

    const watch = {
      ...DruxtBlockRegion.watch,
      fetch: jest.fn()
    }
    watch.$route()
    expect(watch.fetch).toHaveBeenCalled()
  })
})