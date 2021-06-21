import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtViewsStore, DruxtViewsFilter, DruxtViewsFilters } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.component(DruxtViewsFilter.name, DruxtViewsFilter)
localVue.use(Vuex)

// Setup mock Vuex store.
let store

const mountComponent = (propsData) => {
  const mocks = {
    $fetch: jest.fn(),
    $fetchState: {
      pending: true
    },
    $nuxt: {
      context: {
        isDev: false,
      },
    },
    $route: {
      query: {}
    }
  }

  return mount(DruxtViewsFilters, { localVue, mocks, propsData, store })
}

describe('DruxtViewsFilters', () => {
  beforeEach(() => {
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    DruxtViewsStore({ store })

    store.app = { context: { error: jest.fn() }, store }
  })

  test('Component', async () => {
    const filter = {
      id: 'test',
      plugin_id: 'test',
      expose: {
        identifier: 'test'
      }
    }
    const wrapper = mountComponent({ filters: [filter] })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Ensure model change to emit input.
    wrapper.vm.model = { test: 1 }
    await localVue.nextTick()
    expect(wrapper.emitted().input).toStrictEqual([[{ test: 1 }]])

    // DruxtComponentMixin.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewsFiltersBasic',
      'DruxtViewsFiltersDefault'
    ])
  })
})
