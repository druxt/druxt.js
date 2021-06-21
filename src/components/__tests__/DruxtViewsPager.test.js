import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtViewsStore, DruxtViewsPager } from '../..'

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

  return mount(DruxtViewsPager, { localVue, mocks, propsData, store })
}

describe('DruxtViewsPager', () => {
  beforeEach(() => {
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    DruxtViewsStore({ store })

    store.app = { context: { error: jest.fn() }, store }
  })

  test('Component', async () => {
    const wrapper = mountComponent({ type: 'test' })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    const link = { href: '?page=1' }
    expect(wrapper.vm.getQuery(link)).toStrictEqual({ page: 1 })
    expect(wrapper.vm.getRoute(link)).toStrictEqual({
      query: {
        page: 1
      }
    })

    // Ensure model change to emit input.
    wrapper.vm.setPage(link)
    await localVue.nextTick()
    expect(wrapper.emitted().input[0]).toStrictEqual([1])

    // DruxtComponentMixin.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewsPagerTest',
      'DruxtViewsPagerDefault'
    ])
  })
})
