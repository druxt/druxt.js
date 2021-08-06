import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtViewsStore } from '../../src'
import DruxtViewsSorts from '../../src/components/DruxtViewsSorts.vue'

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
    const wrapper = mountComponent({
      type: 'test'
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Props.
    expect(wrapper.vm.options).toStrictEqual({})
    expect(wrapper.vm.sorts).toStrictEqual([])
    expect(wrapper.vm.type).toBe('test')

    await wrapper.setProps({
      sorts: [{
        expose: {
          label: 'Test',
        },
        id: 'test',
      }],
    })
    expect(wrapper.vm.sorts).toStrictEqual([{
      expose: { label: 'Test' },
      id: 'test',
    }])

    // Methods.
    expect(wrapper.vm.sortBy({ id: 'title' })).toStrictEqual({
      query: {
        sort: 'title'
      }
    })

    // Slots.
    const defaultSlot = wrapper.vm.getScopedSlots().default.call(wrapper.vm)
    expect(defaultSlot.tag).toBe('div')
    expect(wrapper.vm.model).toBe(null)
    defaultSlot.children[1].children[0].children[0].data.nativeOn.click('test')
    expect(wrapper.vm.model).toBe('test')

    // Ensure model change to emit input.
    wrapper.vm.model = 'title'
    await localVue.nextTick()
    expect(wrapper.emitted().input[0]).toStrictEqual(['title'])

    // DruxtModule.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewsSortsTest',
      'DruxtViewsSortsDefault'
    ])
  })
})
