import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtViewsStore, DruxtViewsSorts } from '../..'

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
    $route: {
      query: {}
    }
  }

  return mount(DruxtViewsSorts, { localVue, mocks, propsData, store })
}

describe('DruxtViewsSorts', () => {
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

    expect(wrapper.vm.sortBy({ id: 'title' })).toStrictEqual({
      query: {
        sort: 'title'
      }
    })

    // Ensure model change to emit input.
    wrapper.vm.model = 'title'
    await localVue.nextTick()
    expect(wrapper.emitted().input).toStrictEqual([['title']])

    // DruxtComponentMixin.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewsSortsTest',
      'DruxtViewsSortsDefault'
    ])
  })
})
