import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount } from '@vue/test-utils'
import { defineAsyncComponent, defineComponent, h, ref, resolveComponent } from 'vue'
import type { Component, FunctionalComponent } from 'vue'
import { druxtModuleEmits, druxtModuleProps, useDruxtModule } from '@druxt/core/runtime'
import { nest, settle } from './helpers'

// Unmounting runs Nuxt's onScopeDispose for useAsyncData, which purges the
// key's cached data; without it, tests sharing this file's one Vue app and
// mountSuspended()'s per-mount useId() reset would answer each other's keys.
enableAutoUnmount(afterEach)

const Module = defineComponent({
  name: 'DruxtTest',
  props: druxtModuleProps,
  emits: [...druxtModuleEmits],
  setup: (p) => useDruxtModule(p, { componentOptions: () => [['default']], propsData: () => ({ title: 'Hi' }) }),
})

describe('Druxt core components', () => {
  it('DruxtWrapper renders an element only for the module\'s own class', async () => {
    const plain = await mountSuspended(nest(Module), { slots: { default: (d: { title: string }) => h('span', d.title) } })
    await settle(() => expect(plain.html()).toBe('<span>Hi</span>'))
    const classed = await mountSuspended(nest(Module), { attrs: { class: 'teaser' }, slots: { default: (d: { title: string }) => h('span', d.title) } })
    await settle(() => expect(classed.html()).toBe('<div class="teaser"><span>Hi</span></div>'))
  })

  it('DruxtWrapper keeps the element for a class set on itself, even around nothing', async () => {
    const Card = defineComponent({ setup: () => () => h(resolveComponent('DruxtWrapper'), { class: 'card' }) })
    const CardModule = defineComponent({
      name: 'DruxtCardProbe',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { componentOptions: () => [['default']] }),
    })
    const wrapper = await mountSuspended(nest(CardModule), { global: { components: { DruxtCardProbeDefault: Card } } })
    await settle(() => expect(wrapper.html()).toBe('<div class="card"></div>'))
  })

  // The precedence wrapperAttrs() documents: classes join, an id and a style the site sets replace the module's.
  it('DruxtWrapper joins the module\'s classes to the site\'s, and takes the site\'s id and style whole', async () => {
    const Owned = defineComponent({
      name: 'DruxtOwnedProbe',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, {
        componentOptions: () => [['default']],
        slots: () => ({ default: () => h('span', 'Hi') }),
        wrapperAttrs: () => ({ id: 'own', class: 'own', style: { color: 'red' } }),
      }),
    })
    const alone = await mountSuspended(nest(Owned))
    await settle(() => expect(alone.find('div').exists()).toBe(true))
    expect(alone.find('div').attributes()).toMatchObject({ id: 'own', class: 'own', style: 'color: red;' })
    const site = await mountSuspended(nest(Owned), { attrs: { id: 'site', class: 'site', style: { margin: '0px' } } })
    await settle(() => expect(site.find('div').exists()).toBe(true))
    expect(site.find('div').attributes()).toMatchObject({ id: 'site', class: 'own site', style: 'margin: 0px;' })
    // Set on the module and on the site's DruxtWrapper, the module's wins.
    const Card = defineComponent({ setup: () => () => h(resolveComponent('DruxtWrapper'), { id: 'card', class: 'card', style: { padding: '1px' } }, () => h('span', 'Hi')) })
    const both = await mountSuspended(nest(Module), { attrs: { id: 'module', class: 'module', style: { margin: '0px' } }, global: { components: { DruxtTestDefault: Card } } })
    await settle(() => expect(both.find('div').exists()).toBe(true))
    expect(both.find('div').attributes()).toMatchObject({ id: 'module', class: 'card module', style: 'margin: 0px;' })
  })

  it('<Druxt> renders a module by name, with modelValue only', async () => {
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => h(resolveComponent('Druxt'), { module: 'test', modelValue: 'm' }) }), {
      global: { components: { DruxtTest: Module, DruxtTestDefault: defineComponent({ props: { modelValue: String }, setup: (p) => () => h('p', p.modelValue) }) } },
    })
    await settle()
    expect(wrapper.text()).toBe('m')
  })

  it('declares no value prop and no input event', () => {
    expect(Object.keys(druxtModuleProps)).not.toContain('value')
    expect(druxtModuleEmits).not.toContain('input')
  })

  // The three tests below pin <Druxt>'s own contract (distinct from the
  // generic druxtModuleProps/Emits checked above, which Druxt.ts doesn't
  // use): they go red if `value` or `input` are ever restored to Druxt.ts.
  it('<Druxt>\'s own definition declares no value prop and no input emit', async () => {
    let resolved: unknown
    await mountSuspended(defineComponent({
      setup: () => {
        resolved = resolveComponent('Druxt')
        return () => h('div')
      },
    }))
    // Core registers Druxt sync, so the registry holds its definition. Were it an async wrapper, its loader gives it.
    const asyncLoader = (resolved as { __asyncLoader?: () => Promise<unknown> }).__asyncLoader
    expect(asyncLoader).toBeUndefined()
    const definition = resolved as Record<string, unknown>
    expect(Object.keys(definition.props as Record<string, unknown>)).not.toContain('value')
    expect(definition.emits as string[]).not.toContain('input')
  })

  it('ignores a bare `value` attribute: only modelValue reaches the module as its model', async () => {
    // A module of its own, named to match its own wrapper candidate: reusing
    // `Module` (named DruxtTest) would resolve test 2's DruxtTestDefault instead.
    const ValueProbeModule = defineComponent({
      name: 'DruxtValueProbe',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { componentOptions: () => [['default']] }),
    })
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => h(resolveComponent('Druxt'), { module: 'value-probe', value: 'v' }) }), {
      global: {
        components: {
          DruxtValueProbe: ValueProbeModule,
          DruxtValueProbeDefault: defineComponent({ props: { modelValue: String }, setup: (p) => () => h('p', p.modelValue === undefined ? 'no-model' : p.modelValue) }),
        },
      },
    })
    await settle()
    await vi.waitFor(() => expect(wrapper.text()).toBe('no-model'))
  })

  it('emits update:modelValue only, never input, when the wrapper updates the model', async () => {
    const onUpdateModelValue = vi.fn()
    const onInput = vi.fn()
    const EmitProbeModule = defineComponent({
      name: 'DruxtEmitProbe',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { componentOptions: () => [['default']] }),
    })
    const Wrapper = defineComponent({
      props: { modelValue: { type: String, default: '' } },
      emits: ['update:modelValue'],
      setup: (p, { emit }) => () => h('button', { onClick: () => emit('update:modelValue', 'changed') }, p.modelValue),
    })
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h(resolveComponent('Druxt'), { module: 'emit-probe', modelValue: 'start', 'onUpdate:modelValue': onUpdateModelValue, onInput }),
    }), {
      global: { components: { DruxtEmitProbe: EmitProbeModule, DruxtEmitProbeDefault: Wrapper } },
    })
    await settle()
    await vi.waitFor(() => expect(wrapper.find('button').exists()).toBe(true))
    await wrapper.find('button').trigger('click')
    expect(onUpdateModelValue).toHaveBeenCalledWith('changed')
    expect(onInput).not.toHaveBeenCalled()
  })
})

// A module with nothing to render, such as an empty menu or a silent block, says so from its data: it renders no
// wrapper and no element, whatever the site bound.
describe('an empty module root', () => {
  afterEach(() => vi.restoreAllMocks())

  /** A module with a root of its own, from wrapperAttrs, empty while `empty` says so. */
  const rooted = (name: string, empty: () => boolean, extra: Record<string, unknown> = {}) => defineComponent({
    name,
    props: druxtModuleProps,
    emits: [...druxtModuleEmits],
    setup: (p) => useDruxtModule(p, {
      componentOptions: () => [['default']],
      propsData: () => ({ title: 'Hi' }),
      wrapperAttrs: () => ({ class: 'druxt-root-probe' }),
      empty,
      ...extra,
    }),
  })

  /** What Vue warned about. */
  const vueWarnings = (warn: { mock: { calls: unknown[][] } }) => warn.mock.calls.map((call) => String(call[0])).filter((message) => message.includes('[Vue warn]'))
  /** Whether markup holds nothing but comments: what is left once each is cut out is white space. */
  const onlyComments = (html: string): boolean => {
    let rest = html
    for (let start = rest.indexOf('<!--'); start !== -1; start = rest.indexOf('<!--')) {
      const end = rest.indexOf('-->', start + 4)
      if (end === -1) return false
      rest = rest.slice(0, start) + rest.slice(end + 3)
    }
    return rest.trim() === ''
  }

  it('leaves no element and no warning, and renders no wrapper, while the hook says the module is empty', async () => {
    const warn = vi.spyOn(console, 'warn')
    const render = vi.fn(() => h('p', 'wrapper'))
    const wrapper = await mountSuspended(nest(rooted('DruxtEmptyWrapperProbe', () => true)), {
      global: { components: { DruxtEmptyWrapperProbeDefault: defineComponent({ setup: () => render }) } },
    })
    await settle()
    expect(onlyComments(wrapper.html())).toBe(true)
    expect(render).not.toHaveBeenCalled()
    expect(vueWarnings(warn)).toEqual([])
  })

  it.each([
    ['a class', { attrs: { class: 'hero' } }],
    ['an id and a style', { attrs: { id: 'top', style: 'color: red' } }],
    ['a wrapper option', { props: { wrapper: { component: 'section', class: 'hero' } } }],
  ])('leaves no element for %s the site set on an empty module', async (_, options) => {
    const warn = vi.spyOn(console, 'warn')
    const wrapper = await mountSuspended(nest(rooted('DruxtSilentSiteProbe', () => true, { wrapperTag: 'nav', slots: () => ({ default: () => h('p', 'content') }) })), options)
    await settle()
    expect(onlyComments(wrapper.html())).toBe(true)
    expect(vueWarnings(warn)).toEqual([])
  })

  it('follows the data the hook reads', async () => {
    const empty = ref(true)
    const wrapper = await mountSuspended(nest(rooted('DruxtToggleEmptyProbe', () => empty.value, { slots: () => ({ default: () => h('p', 'line') }) })))
    await settle()
    expect(onlyComments(wrapper.html())).toBe(true)
    empty.value = false
    await settle(() => expect(wrapper.html()).toBe('<div class="druxt-root-probe">\n  <p>line</p>\n</div>'))
    empty.value = true
    await settle(() => expect(onlyComments(wrapper.html())).toBe(true))
  })

  // One render function, as a functional and as a stateful wrapper, each registered sync and async: the markup is the
  // same, so it never depends on how a wrapper is written or registered.
  it('renders the same markup for a functional and a stateful wrapper, registered sync or async', async () => {
    const warn = vi.spyOn(console, 'warn')
    const render = (props: { title?: string }) => h('section', props.title)
    const functional: FunctionalComponent<{ title?: string }> = (props) => render(props)
    functional.props = ['title']
    const stateful = defineComponent({ props: { title: { type: String, default: undefined } }, setup: (p) => () => render(p) })
    const registrations: Record<string, Component> = {
      'functional, sync': functional as Component,
      'stateful, sync': stateful,
      'functional, async': defineAsyncComponent(async () => functional as Component),
      'stateful, async': defineAsyncComponent(async () => stateful),
    }
    const markup: Record<string, string> = {}
    for (const [label, component] of Object.entries(registrations)) {
      const wrapper = await mountSuspended(nest(rooted('DruxtRegistrationProbe', () => false)), {
        attrs: { class: 'hero' },
        global: { components: { DruxtRegistrationProbeDefault: component } },
      })
      await settle(() => expect(wrapper.find('section').exists()).toBe(true))
      markup[label] = wrapper.html()
      wrapper.unmount()
    }
    expect(new Set(Object.values(markup)).size).toBe(1)
    expect(markup['functional, sync']).toBe('<section class="druxt-root-probe hero">Hi</section>')
    expect(vueWarnings(warn)).toEqual([])
  })
})
