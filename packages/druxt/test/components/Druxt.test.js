import { createLocalVue, mount } from '@vue/test-utils'

import Druxt from '../../src/components/Druxt.vue'
import DruxtModule from '../../src/components/DruxtModule.vue'

// Setup local vue instance.
const localVue = createLocalVue()

const mountWrapper = (propsData) => {
  return mount(Druxt, { localVue, propsData, stubs: ['DruxtTestModule'] })
}

describe('Druxt component', () => {
  test('defaults', async () => {
    const wrapper = mountWrapper({ module: 'test-module' })

    // Props.
    expect(wrapper.vm.module).toBe('test-module')
    expect(wrapper.vm.propsData).toStrictEqual({})
    expect(wrapper.vm.wrapper.component).toBe('div')
    expect(wrapper.vm.inner.component).toBe('div')

    // Data.
    expect(wrapper.vm.component.is).toBe('DruxtTestModule')
    expect(wrapper.vm.component.propsData).toStrictEqual({})

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('defaults - v-model', async () => {
    const Component = {
      template: "<Druxt v-model='model' ref='druxt' module='test-module' />",
      components: { Druxt },
      data: () => ({ model: null })
    }
    const wrapper = mount(Component, { localVue, stubs: ['DruxtTestModule'] })

    // Default state.
    expect(wrapper.vm.model).toStrictEqual(null)
    expect(wrapper.vm.$refs.druxt.model).toStrictEqual(null)
    expect(wrapper.vm.$refs.druxt.value).toStrictEqual(null)

    // Change model value.
    await wrapper.setData({ model: { test: true }})

    expect(wrapper.vm.model).toStrictEqual({ test: true })
    expect(wrapper.vm.$refs.druxt.model).toStrictEqual({ test: true })
    expect(wrapper.vm.$refs.druxt.value).toStrictEqual({ test: true })

    // Change Druxt component model value.
    wrapper.vm.$refs.druxt.model = { test: false }
    await localVue.nextTick()
    expect(wrapper.vm.model).toStrictEqual({ test: false })
    expect(wrapper.vm.$refs.druxt.model).toStrictEqual({ test: false })
    expect(wrapper.vm.$refs.druxt.value).toStrictEqual({ test: false })
  })

  test('v-model follows an input from the module component', async () => {
    const DruxtTestModule = {
      props: ['value'],
      render(h) {
        return h('button', { on: { click: () => this.$emit('input', { test: 'module' }) } })
      },
    }
    const Component = {
      template: "<Druxt v-model='model' ref='druxt' module='test-module' />",
      components: { Druxt },
      data: () => ({ model: null })
    }
    const wrapper = mount(Component, { localVue, stubs: { DruxtTestModule } })

    await wrapper.find('button').trigger('click')
    await localVue.nextTick()
    expect(wrapper.vm.$refs.druxt.model).toStrictEqual({ test: 'module' })
    expect(wrapper.vm.model).toStrictEqual({ test: 'module' })
  })

  test('v-model follows repeated inputs of the same object', async () => {
    const value = { count: 0 }
    const DruxtTestModule = {
      props: ['value'],
      render(h) {
        // As DruxtEntity does: edit the model in place and emit it again.
        return h('button', { on: { click: () => { value.count += 1; this.$emit('input', value) } } })
      },
    }
    const wrapper = mount(Druxt, { localVue, propsData: { module: 'test-module' }, stubs: { DruxtTestModule } })

    await wrapper.find('button').trigger('click')
    await localVue.nextTick()
    await wrapper.find('button').trigger('click')
    await localVue.nextTick()
    await wrapper.find('button').trigger('click')
    await localVue.nextTick()

    expect(wrapper.emitted().input).toHaveLength(3)
    expect(wrapper.emitted().input.every(([emitted]) => emitted === value)).toBe(true)
  })

  test('v-model with a DruxtModule emits once per inner input and never echoes the parent', async () => {
    const DruxtTestModule = { name: 'DruxtTestModule', extends: DruxtModule }
    const Component = {
      template: "<Druxt v-model='model' ref='druxt' module='test-module' />",
      components: { Druxt },
      data: () => ({ model: null })
    }
    const mocks = {
      $fetchState: { pending: false },
      $nuxt: { context: { isDev: false } },
      $route: { meta: {} },
    }
    const wrapper = mount(Component, { localVue, mocks, stubs: { DruxtTestModule, DruxtDebug: true } })
    const druxt = wrapper.findComponent(Druxt)

    // A value the parent set goes down to the module and is not emitted back.
    await wrapper.setData({ model: { test: true } })
    await localVue.nextTick()
    expect(wrapper.vm.$refs.druxt.$refs.module.model).toStrictEqual({ test: true })
    expect(druxt.emitted().input).toBeUndefined()

    // One input from the module's inner component is one input from Druxt.
    wrapper.vm.$refs.druxt.$refs.module.$refs.component.$emit('input', { test: false })
    await localVue.nextTick()
    await localVue.nextTick()
    expect(wrapper.vm.model).toStrictEqual({ test: false })
    expect(druxt.emitted().input).toHaveLength(1)
  })

  test('missing module', async () => {
    const wrapper = mountWrapper({ module: 'test-missing-module' })
    expect(wrapper.vm.component.is).toBe(undefined)
  })

  test('wrapper', () => {
    const wrapper = mountWrapper({
      module: 'test-module',
      wrapper: {
        component: 'span'
      }
    })

    // Props.
    expect(wrapper.vm.wrapper.component).toBe('span')
    expect(wrapper.vm.inner.component).toBe('div')

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('unwrapped', () => {
    const wrapper = mountWrapper({
      module: 'test-module',
      wrapper: false
    })

    // Props.
    expect(wrapper.vm.wrapper).toBe(false)
    expect(wrapper.vm.inner.component).toBe('div')

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})
