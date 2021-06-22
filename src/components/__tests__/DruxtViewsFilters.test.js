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

const mountComponent = (propsData) => {
  return mount(DruxtViewsFilters, { localVue, mocks, propsData })
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

    // Slots.
    const slots = wrapper.vm.getScopedSlots()
    expect(Object.keys(slots)).toStrictEqual([
      'test',
      'default',
    ])
    expect(Object.entries(slots.default.call(wrapper.vm)).length).toBe(1)
    expect(wrapper.vm.model).toStrictEqual({})
    slots.test.call(wrapper.vm).componentOptions.listeners.input(1)
    expect(wrapper.vm.model).toStrictEqual({ test: 1 })

    // Ensure model change to emit input.
    wrapper.vm.model = { test: 2 }
    await localVue.nextTick()
    expect(wrapper.emitted().input[0]).toStrictEqual([{ test: 2 }])

    // DruxtModule.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewsFiltersBasic',
      'DruxtViewsFiltersDefault'
    ])
  })

  test('v-model', async () => {
    const filter = {
      id: 'test',
      plugin_id: 'test',
      expose: {
        identifier: 'test'
      }
    }

    const Component = {
      template: "<DruxtViewsFilters v-model='model' ref='module' v-bind='props' @input='onInput' />",
      components: { DruxtViewsFilters },
      data: () => ({ model: {} }),
      computed: {
        props: () => ({
          filters: [filter]
        })
      },
      methods: {
        onInput: jest.fn(),
      }
    }
    const wrapper = mount(Component, { localVue, mocks, stubs: ['DruxtWrapper', 'NotDruxtWrapper'] })

    // Default state.
    expect(wrapper.vm.model).toStrictEqual({})
    expect(wrapper.vm.$refs.module.component.props.value).toStrictEqual(undefined)
    expect(wrapper.vm.$refs.module.model).toStrictEqual({})
    expect(wrapper.vm.$refs.module.value).toStrictEqual({})
    expect(Component.methods.onInput).not.toHaveBeenCalled()

    // Change model value.
    await wrapper.setData({ model: { test: true }})
    expect(wrapper.vm.model).toStrictEqual({ test: true })
    expect(wrapper.vm.$refs.module.component.props.value).toStrictEqual({ test: true })
    expect(wrapper.vm.$refs.module.value).toStrictEqual({ test: true })
    expect(wrapper.vm.$refs.module.model).toStrictEqual({ test: true })
    expect(Component.methods.onInput).toHaveBeenCalledWith({ test: true })
  })
})
