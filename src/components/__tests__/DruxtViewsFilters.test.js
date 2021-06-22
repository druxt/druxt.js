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

    // Ensure model change to emit input.
    wrapper.vm.model = { test: 1 }
    await localVue.nextTick()
    expect(wrapper.emitted().input[0]).toStrictEqual([{ test: 1 }])

    // DruxtComponentMixin.
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

    // Set data but don't change data.
    // await wrapper.setData({ model: wrapper.vm.$refs.module.model })
    expect(wrapper.vm.$refs.module.$options.watch.model.handler.call(
      { component: { is: 'DruxtWrapper' }, mode: { test: 2 } },
      { test: 2 },
      { test: 2 }
    )).toBe()
    expect(Component.methods.onInput).not.toHaveBeenCalledWith({ test: 2 })

    // Change wrapper.
    expect(wrapper.vm.$refs.module.$options.watch.model.handler.call(
      { component: { is: 'NotDruxtWrapper' }, mode: { test: 3 } },
      { test: 3 },
      { test: 3 }
    )).toBe()
    expect(Component.methods.onInput).not.toHaveBeenCalledWith({ test: 3 })
    // wrapper.vm.$refs.module.component.is = 'NotDruxtWrapper'
    // await wrapper.setData({ model: { test: 2 }})
    // expect(Component.methods.onInput).not.toHaveBeenCalledWith({ test: 2 })
  })
})
