import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'

import DruxtModule from '../../src/components/DruxtModule.vue'
import DruxtWrapper from '../../src/components/DruxtWrapper.vue'

// Attributes are how a module passes data down the wrapper chain, and how a
// wrapper reads what was passed up it. These tests hold that contract at the
// rendered markup, not at the component data that feeds it.

const localVue = createLocalVue()
localVue.component('DruxtWrapper', DruxtWrapper)

let mocks

const mountModule = async ({ template, propsData, wrapper: wrapperOptions, components = {} }) => {
  const Module = {
    name: 'AttrsModule',
    extends: DruxtModule,
    druxt: {
      componentOptions: () => (wrapperOptions ? [['wrapper']] : undefined),
      propsData: () => propsData,
    },
  }
  if (wrapperOptions) {
    localVue.component('AttrsModuleWrapper', { druxt: {}, render: (h) => h('div', 'wrapped'), ...wrapperOptions })
  }

  const Parent = { template, components: { AttrsModule: Module, ...components } }
  const parent = mount(Parent, { localVue, mocks })
  const vm = parent.findComponent(Module).vm
  await vm.$options.fetch.call(vm)
  await parent.vm.$nextTick()
  return { parent, vm }
}

describe('DruxtModule attributes', () => {
  beforeEach(() => {
    mocks = {
      $createElement: jest.fn(),
      $fetchState: { pending: false },
      $options: { druxt: {} },
      $nuxt: { context: { isDev: false } },
      $route: { meta: {} },
    }
  })

  test('an attribute set on the module reaches the markup once, on the module', async () => {
    const { parent } = await mountModule({
      template: '<AttrsModule id="region" data-test="passed" aria-label="Region" />',
      propsData: {},
    })

    // Vue puts a consumer's attributes on the component's root. The wrapper
    // inside it repeating them would mean two elements with one id.
    const root = parent.element
    expect(root.getAttribute('id')).toBe('region')
    expect(root.getAttribute('data-test')).toBe('passed')
    expect(root.getAttribute('aria-label')).toBe('Region')

    expect(parent.html().match(/id="region"/g)).toHaveLength(1)
    expect(parent.html().match(/aria-label="Region"/g)).toHaveLength(1)

    const wrapper = parent.findComponent(DruxtWrapper).element
    expect(wrapper.getAttribute('id')).toBe(null)
  })

  test('propsData never reaches the markup, whatever its type', async () => {
    const { parent } = await mountModule({
      template: '<AttrsModule />',
      propsData: { entity: { id: 'abc' }, fields: { body: {} }, label: 'plain' },
    })

    // An object stringifies to [object Object] when Vue writes it as an attribute.
    expect(parent.html()).not.toContain('[object Object]')
    expect(parent.html()).not.toContain('entity=')
    expect(parent.html()).not.toContain('fields=')
    expect(parent.html()).not.toContain('label=')
  })

  test('a class set on the module reaches its markup', async () => {
    const { parent } = await mountModule({
      template: '<AttrsModule class="site-class" />',
      propsData: {},
    })

    expect(parent.html()).toContain('site-class')
  })

  test('propsData the wrapper declares is a prop, not an attribute', async () => {
    const { parent, vm } = await mountModule({
      template: '<AttrsModule />',
      propsData: { entity: { id: 'abc' }, label: 'plain' },
      wrapper: { props: { entity: { type: Object, default: null } } },
    })

    expect(vm.component.props.entity).toStrictEqual({ id: 'abc' })
    expect(vm.component.$attrs.entity).toBe(undefined)
    expect(parent.html()).not.toContain('entity=')
  })

  test('a wrapper reads propsData it does not declare from its own attributes', async () => {
    // Reading up the chain: a wrapper takes what it wants without declaring props.
    let seen
    const { vm } = await mountModule({
      template: '<AttrsModule />',
      propsData: { label: 'read-me', size: 3 },
      wrapper: {
        render(h) {
          seen = { ...this.$attrs }
          return h('div', 'wrapped')
        },
      },
    })

    expect(vm.component.$attrs.label).toBe('read-me')
    expect(seen.label).toBe('read-me')
    expect(seen.size).toBe(3)
  })

  test('an attribute set on the module reaches a wrapper that declares no props', async () => {
    // Passing down the chain: the wrapper forwards what it was given.
    let seen
    await mountModule({
      template: '<AttrsModule data-source="parent" />',
      propsData: { label: 'plain' },
      wrapper: {
        render(h) {
          seen = { ...this.$attrs }
          return h('div', 'wrapped')
        },
      },
    })

    expect(seen['data-source']).toBe('parent')
    expect(seen.label).toBe('plain')
  })

  test('the default wrapper hands the module attributes to the default slot', async () => {
    // DruxtWrapper binds its parent's attributes into the slot scope, so a
    // consumer's own template can read them.
    const Consumer = {
      template: `
        <AttrsModule data-source="parent">
          <template #default="slotProps"><span>{{ slotProps['data-source'] }}</span></template>
        </AttrsModule>
      `,
      components: {},
    }
    const Module = {
      name: 'AttrsModule',
      extends: DruxtModule,
      druxt: { componentOptions: () => undefined, propsData: () => ({}) },
    }
    Consumer.components.AttrsModule = Module

    const parent = mount(Consumer, { localVue, mocks })
    const vm = parent.findComponent(Module).vm
    await vm.$options.fetch.call(vm)
    await parent.vm.$nextTick()

    expect(parent.html()).toContain('parent')
  })

  test('the default slot gets the module attributes without the id', async () => {
    // A module renders its children through this slot, so anything here lands
    // on the next module down. An id repeated down the chain is invalid markup.
    const Module = {
      name: 'AttrsModule',
      extends: DruxtModule,
      druxt: { componentOptions: () => undefined, propsData: () => ({ label: 'plain' }) },
    }
    const Consumer = {
      template: `
        <AttrsModule id="anchor" data-source="site">
          <template #default="slotProps"><span>{{ Object.keys(slotProps).join(',') }}</span></template>
        </AttrsModule>
      `,
      components: { AttrsModule: Module },
    }

    const parent = mount(Consumer, { localVue, mocks })
    const vm = parent.findComponent(Module).vm
    await vm.$options.fetch.call(vm)
    await parent.vm.$nextTick()

    const keys = parent.find('span').text().split(',')
    expect(keys).toContain('data-source')
    expect(keys).toContain('label')
    expect(keys).not.toContain('id')

    // The id is still on the module itself.
    expect(parent.element.getAttribute('id')).toBe('anchor')
  })

  test('the fetch key stays on the module and is kept out of the wrapper', async () => {
    // Nuxt stamps data-fetch-key on the component that fetches. Passing it down
    // would put the same key on two elements.
    const { parent, vm } = await mountModule({
      template: '<AttrsModule data-fetch-key="AttrsModule:0" />',
      propsData: { label: 'plain' },
      wrapper: { props: {} },
    })

    expect(vm.component.$attrs['data-fetch-key']).toBe(undefined)
    expect(parent.html().match(/data-fetch-key/g)).toHaveLength(1)
  })
})
