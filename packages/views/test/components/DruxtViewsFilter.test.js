import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtViewsStore } from '../../src'
import DruxtViewsFilter from '../../src/components/DruxtViewsFilter.vue'

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
    $nuxt: {
      context: {
        isDev: false,
      },
    },
    $route: {
      query: {}
    }
  }

  return mount(DruxtViewsFilter, { localVue, mocks, propsData, store })
}

describe('DruxtViewsFilter', () => {
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
    const wrapper = mountComponent({ filter })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Ensure model change to emit input.
    wrapper.vm.model = 1
    await localVue.nextTick()
    expect(wrapper.emitted().input[0]).toStrictEqual([1])

    // DruxtComponentMixin.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewsFilterTestTest',
      'DruxtViewsFilterTest',
      'DruxtViewsFilterDefault'
    ])
  })
})
