import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount } from '@vue/test-utils'
import { defineAsyncComponent, defineComponent, h, ref, resolveComponent, toRaw, useModel } from 'vue'
import type { Component, VNode } from 'vue'
import { createError, useNuxtApp, useState } from '#imports'
import { DRUXT_LANGUAGES_STATE, druxtModuleEmits, druxtModuleProps, useDruxtLanguages, useDruxtModule, useDruxtModuleContext } from '@druxt/core/runtime'
import type { DruxtModuleContext, DruxtModuleContract, DruxtModuleProps } from '@druxt/core/runtime'
import { useDruxtStore } from '@druxt/core/store'
import { matchAnyPath, nest, payloadKeys, settle } from './helpers'
import DruxtTestScriptSetup from './components/DruxtTestScriptSetup.vue'
import DruxtTestLanguages from './components/DruxtTestLanguages.vue'

// Unmounting runs Nuxt's onScopeDispose for useAsyncData, which purges the
// key's cached data; without it, tests sharing this file's one Vue app and
// mountSuspended()'s per-mount useId() reset would answer each other's keys.
enableAutoUnmount(afterEach)

/**
 * A module for the tests: an entity-like module whose contract each test
 * sets. Wrapper candidates are declared as the module's own local
 * `components`, not `global.components`: @nuxt/test-utils reuses one Vue
 * app's component registry for the whole file, so a global registration
 * from an earlier test would still answer this one.
 */
const testModule = (contract: DruxtModuleContract, components: Record<string, Component> = {}, props: Record<string, unknown> = {}) => nest(defineComponent({
  name: 'DruxtTest',
  props: { ...druxtModuleProps, ...props },
  emits: [...druxtModuleEmits],
  components,
  setup: (p) => useDruxtModule(p, contract),
}))

const article = { componentOptions: () => [['node--article', 'default'], ['default']] }

describe('useDruxtModule()', () => {
  it('renders the most specific registered wrapper', async () => {
    const wrapper = await mountSuspended(testModule(article, {
      DruxtTestDefault: defineComponent({ setup: () => () => h('p', 'default') }),
      DruxtTestNodeArticle: defineComponent({ setup: () => () => h('p', 'article') }),
    }))
    await settle()
    expect(wrapper.text()).toBe('article')
  })

  it('delivers only the props the wrapper declares', async () => {
    const wrapper = await mountSuspended(testModule({ ...article, propsData: () => ({ entity: { id: 1 }, extra: 'x' }) }, {
      DruxtTestDefault: defineComponent({ props: { entity: Object }, setup: (p) => () => h('p', JSON.stringify(p.entity)) }),
    }))
    await settle()
    expect(wrapper.text()).toBe('{"id":1}')
    expect(wrapper.html()).not.toContain('extra')
  })

  it('falls back to DruxtWrapper, and renders a template slot with the propsData', async () => {
    const wrapper = await mountSuspended(testModule({ ...article, propsData: () => ({ title: 'Hello' }) }), {
      slots: { default: (data: { title: string }) => h('h1', data.title) },
    })
    await settle()
    expect(wrapper.find('h1').text()).toBe('Hello')
  })

  it('renders no element of its own', async () => {
    const wrapper = await mountSuspended(testModule(article, {
      DruxtTestDefault: defineComponent({ setup: () => () => h('p', 'x') }),
    }))
    await settle()
    expect(wrapper.html()).toBe('<p>x</p>')
  })

  it('runs again when a watched input changes', async () => {
    const fetchConfig = vi.fn()
    // The watch reads the prop, so the contract is built inside setup.
    const wrapper = await mountSuspended(nest(defineComponent({
      name: 'DruxtTest',
      props: { ...druxtModuleProps, id: { type: Number, default: 1 } },
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { ...article, fetchConfig, watch: () => [p.id] }),
    })), { props: { id: 1 } })
    await settle()
    expect(fetchConfig).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ id: 2 })
    await vi.waitFor(() => expect(fetchConfig).toHaveBeenCalledTimes(2))
  })

  it('does not re-run the pipeline when a watched value is structurally unchanged', async () => {
    const fetchConfig = vi.fn()
    const wrapper = await mountSuspended(nest(defineComponent({
      name: 'DruxtTest',
      props: { ...druxtModuleProps, entity: { type: Object, default: () => ({ id: 1 }) } },
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { ...article, fetchConfig, watch: () => [p.entity] }),
    })), { props: { entity: { id: 1 } } })
    await settle()
    expect(fetchConfig).toHaveBeenCalledTimes(1)
    // A new object, same content: a parent re-rendering with a fresh literal must not refetch.
    await wrapper.setProps({ entity: { id: 1 } })
    await settle()
    expect(fetchConfig).toHaveBeenCalledTimes(1)
  })

  it('runs again when the language changes', async () => {
    const fetchConfig = vi.fn()
    const wrapper = await mountSuspended(testModule({ ...article, fetchConfig }, {
      DruxtTestDefault: defineComponent({ setup: () => () => h('p', 'x') }),
    }), { props: { langcode: 'en' } })
    await settle()
    expect(fetchConfig).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ langcode: 'fr' })
    await vi.waitFor(() => expect(fetchConfig).toHaveBeenCalledTimes(2))
  })

  it('renders DruxtDebug with the status and URL when a request fails', async () => {
    const failure = { response: { status: 403, statusText: 'Forbidden' }, druxt: { url: 'https://drupal.test/jsonapi/node/article' } }
    const wrapper = await mountSuspended(testModule({ ...article, fetchConfig: () => { throw failure } }))
    // Until the JSON shows: DruxtDebug's folding JSON view loads asynchronously, and renders nothing until it has.
    await settle(() => expect(wrapper.text()).toContain('https://drupal.test/jsonapi/node/article'))
    expect(wrapper.text()).toContain('403: Forbidden')
  })

  it('renders DruxtDebug when fetchData fails', async () => {
    const failure = { response: { status: 500, statusText: 'Internal Server Error' } }
    const wrapper = await mountSuspended(testModule({ ...article, fetchData: () => { throw failure } }, {
      DruxtTestDefault: defineComponent({ setup: () => () => h('p', 'x') }),
    }))
    await settle()
    expect(wrapper.text()).toContain('500: Internal Server Error')
  })

  it('passes through an error a module already shaped, keeping its status and data', async () => {
    const wrapper = await mountSuspended(testModule({
      ...article,
      fetchConfig: () => { throw createError({ statusCode: 404, statusMessage: 'Not Found', data: { path: '/x' } }) },
    }))
    await settle()
    expect(wrapper.text()).toContain('Not Found')
    const errors = useNuxtApp().payload._errors as Record<string, { statusCode?: number, data?: unknown } | undefined>
    // Keys from watching tests linger, as their inputs make them the same across tests: pick the entry that holds an error.
    const key = Object.keys(errors).find((k) => k.startsWith('druxt:DruxtTest:') && errors[k])
    expect(errors[key!]?.statusCode).toBe(404)
    expect(errors[key!]?.data).toEqual({ path: '/x' })
  })

  it('takes the model from a wrapper that declares update:modelValue, and passes it up', async () => {
    const Wrapper = defineComponent({
      props: { modelValue: { type: String, default: '' } },
      emits: ['update:modelValue'],
      setup: (p, { emit }) => () => h('button', { onClick: () => emit('update:modelValue', 'changed') }, p.modelValue),
    })
    const wrapper = await mountSuspended(testModule(article, { DruxtTestDefault: Wrapper }), { props: { modelValue: 'start' } })
    await settle()
    expect(wrapper.text()).toBe('start')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['changed']])
  })

  it('keeps a local model when the parent binds no v-model, and still emits it', async () => {
    const Wrapper = defineComponent({
      props: { modelValue: { type: String, default: undefined } },
      emits: ['update:modelValue'],
      setup(props) {
        const model = useModel(props, 'modelValue')
        return () => h('p', model.value ?? 'none')
      },
    })
    const wrapper = await mountSuspended(testModule({ ...article, fetchConfig: (ctx) => { ctx.model.value = 'loaded' } }, { DruxtTestDefault: Wrapper }))
    await settle(() => expect(wrapper.text()).toBe('loaded'))
    expect(wrapper.emitted('update:modelValue')).toEqual([['loaded']])
  })

  it('follows a parent that binds v-model, both ways', async () => {
    const Wrapper = defineComponent({
      props: { modelValue: { type: String, default: undefined } },
      emits: ['update:modelValue'],
      setup(props) {
        const model = useModel(props, 'modelValue')
        return () => h('button', { onClick: () => { model.value = 'changed' } }, model.value ?? 'none')
      },
    })
    const Module = testModule(article, { DruxtTestDefault: Wrapper })
    const value = ref('start')
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h(Module, { 'modelValue': value.value, 'onUpdate:modelValue': (next: string) => { value.value = next } }),
    }))
    await settle(() => expect(wrapper.text()).toBe('start'))
    await wrapper.find('button').trigger('click')
    await settle(() => expect(wrapper.text()).toBe('changed'))
    expect(value.value).toBe('changed')
    value.value = 'from parent'
    await settle(() => expect(wrapper.text()).toBe('from parent'))
  })

  it('renders what it writes for a parent bound to an empty value that never re-renders, as on the server', async () => {
    const firsts: unknown[] = []
    const Wrapper = defineComponent({
      props: { modelValue: { type: String, default: undefined } },
      emits: ['update:modelValue'],
      setup(props) {
        const model = useModel(props, 'modelValue')
        firsts.push(model.value)
        return () => h('p', model.value ?? 'none')
      },
    })
    // Not nested: nest() leaves an undefined modelValue out, and this parent binds it.
    const Module = defineComponent({
      name: 'DruxtTest',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      components: { DruxtTestDefault: Wrapper },
      setup: (p) => useDruxtModule(p, { ...article, fetchConfig: (ctx) => { ctx.model.value = 'loaded' } }),
    })
    let held: unknown
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h(Module, { 'modelValue': undefined, 'onUpdate:modelValue': (next: unknown) => { held = next } }),
    }))
    await settle(() => expect(wrapper.text()).toBe('loaded'))
    expect(firsts[0]).toBe('loaded')
    expect(held).toBe('loaded')
  })

  it('reads a parent\'s empty value after the parent rejected a write while its value was set', async () => {
    const Wrapper = defineComponent({
      props: { modelValue: { type: String, default: undefined } },
      emits: ['update:modelValue'],
      setup(props) {
        const model = useModel(props, 'modelValue')
        return () => h('button', { onClick: () => { model.value = 'rejected' } }, model.value ?? 'none')
      },
    })
    const Module = testModule(article, { DruxtTestDefault: Wrapper })
    const value = ref<string | undefined>('start')
    // The parent binds v-model but drops every update.
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h(Module, { 'modelValue': value.value, 'onUpdate:modelValue': () => {} }),
    }))
    await settle(() => expect(wrapper.text()).toBe('start'))
    await wrapper.find('button').trigger('click')
    await settle()
    expect(wrapper.text()).toBe('start')
    value.value = undefined
    await settle(() => expect(wrapper.text()).toBe('none'))
  })

  it('calls restore after restoring state from a payload it did not produce', async () => {
    const resource = ref<unknown>(null)
    const restore = vi.fn((ctx: DruxtModuleContext) => { ctx.model.value = resource.value })
    useNuxtApp().static.data['druxt:restore-hook:wrapper'] = {
      is: 'DruxtTestDefault', options: ['DruxtTestDefault'], settings: {}, wrapperProps: ['modelValue'], listens: false, state: { resource: { title: 'Restored' } },
    }
    const wrapper = await mountSuspended(nest(defineComponent({
      name: 'DruxtTest',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      components: { DruxtTestDefault: defineComponent({ props: { modelValue: Object }, setup: (p) => () => h('p', (p.modelValue as { title?: string } | undefined)?.title ?? 'none') }) },
      setup: (p) => useDruxtModule(p, { ...article, key: () => 'restore-hook', state: { resource }, restore }),
    })))
    await settle()
    expect(restore).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toBe('Restored')
  })

  it('ignores update:modelValue from a wrapper that does not declare it', async () => {
    const Inner = defineComponent({ emits: ['update:modelValue'], setup: (_p, { emit }) => () => h('button', { onClick: () => emit('update:modelValue', 'changed') }) })
    // The wrapper's root is a component that emits; the wrapper itself declares nothing.
    const Wrapper = defineComponent({ setup: () => () => h(Inner) })
    const wrapper = await mountSuspended(testModule(article, { DruxtTestDefault: Wrapper }), { props: { modelValue: 'start' } })
    await settle()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('wraps the resolved wrapper in an element when the wrapper prop asks for one', async () => {
    const wrapper = await mountSuspended(testModule(article, {
      DruxtTestDefault: defineComponent({ setup: () => () => h('p', 'x') }),
    }), { props: { wrapper: { component: 'section', class: 'x' } } })
    await settle()
    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.classes()).toContain('x')
    expect(wrapper.find('p').text()).toBe('x')
  })

  it('renders the module\'s own slots when wrapper is false, even with a registered wrapper', async () => {
    const wrapper = await mountSuspended(testModule({ ...article, slots: () => ({ default: () => h('p', 'module output') }) }, {
      DruxtTestDefault: defineComponent({ setup: () => () => h('p', 'wrapper') }),
    }), { props: { wrapper: false } })
    await settle()
    expect(wrapper.text()).toBe('module output')
    expect(wrapper.text()).not.toBe('wrapper')
  })

  it('lets a wrapper without props read the module context', async () => {
    const Wrapper = defineComponent({
      setup: () => {
        const context = useDruxtModuleContext()
        return () => h('p', context?.name)
      },
    })
    const wrapper = await mountSuspended(testModule(article, { DruxtTestDefault: Wrapper }))
    await settle()
    expect(wrapper.text()).toBe('DruxtTest')
  })

  it('prefers a langcode-specific wrapper', async () => {
    const wrapper = await mountSuspended(testModule(article, {
      DruxtTestDefault: defineComponent({ setup: () => () => h('p', 'default') }),
      DruxtTestDefaultEn: defineComponent({ setup: () => () => h('p', 'en') }),
    }), { props: { langcode: 'en' } })
    await settle()
    expect(wrapper.text()).toBe('en')
  })

  it('falls back to druxt:<Name>:<path>:<useId()> when the contract has no inputs', async () => {
    matchAnyPath()
    await mountSuspended(testModule(article, {
      DruxtTestDefault: defineComponent({ setup: () => () => h('p', 'x') }),
    }), { route: '/fallback-page' })
    await settle()
    const keys = payloadKeys()
    // The path keeps two prerendered pages, whose useId() sequences match, from sharing one entry.
    expect(keys.some((key) => key.startsWith('druxt:DruxtTest:/fallback-page:'))).toBe(true)
  })

  const keyed = (fetchConfig: () => unknown = () => {}) => nest(defineComponent({
    name: 'DruxtKeyed',
    props: { ...druxtModuleProps, name: String },
    emits: [...druxtModuleEmits],
    setup: (p) => useDruxtModule(p, { ...article, fetchConfig, watch: () => [p.name] }),
  }))
  const keyedKeys = () => payloadKeys().filter((k) => k.startsWith('druxt:DruxtKeyed'))

  it('keys two instances with different inputs apart', async () => {
    const Keyed = keyed()
    await mountSuspended(Keyed, { props: { name: 'main' } })
    await mountSuspended(Keyed, { props: { name: 'footer' } })
    await settle()
    const keys = keyedKeys()
    expect(keys).toHaveLength(2)
    expect(keys.some((k) => k.includes('"main"'))).toBe(true)
    expect(keys.some((k) => k.includes('"footer"'))).toBe(true)
  })

  it('keys an instance with a template apart from one without, so each renders its own way', async () => {
    const Keyed = nest(defineComponent({
      name: 'DruxtKeyed',
      props: { ...druxtModuleProps, name: String },
      emits: [...druxtModuleEmits],
      components: { DruxtKeyedDefault: defineComponent({ setup: () => () => h('p', 'wrapper') }) },
      setup: (p) => useDruxtModule(p, { ...article, watch: () => [p.name] }),
    }))
    // The template first: sharing its entry would leave the second with no wrapper resolved.
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h('div', [
        h(Keyed, { name: 'main' }, { default: () => h('h1', 'template') }),
        h(Keyed, { name: 'main' }),
      ]),
    }))
    await settle()
    expect(keyedKeys()).toHaveLength(2)
    expect(wrapper.find('h1').text()).toBe('template')
    expect(wrapper.find('p').text()).toBe('wrapper')
  })

  it('shares one fetch between instances with the same inputs in one render', async () => {
    const fetchConfig = vi.fn()
    const Keyed = keyed(fetchConfig)
    await mountSuspended(defineComponent({
      setup: () => () => h('div', [h(Keyed, { name: 'main' }), h(Keyed, { name: 'main' })]),
    }))
    await settle()
    expect(fetchConfig).toHaveBeenCalledTimes(1)
    expect(keyedKeys()).toHaveLength(1)
  })

  it('writes under the new inputs\' key when an input changes, leaving another instance\'s entry alone', async () => {
    const fetchConfig = vi.fn()
    const nuxtApp = useNuxtApp()
    const Keyed = keyed(fetchConfig)
    const name = ref('main')
    await mountSuspended(defineComponent({
      setup: () => () => h('div', [h(Keyed, { name: 'main' }), h(Keyed, { name: name.value })]),
    }))
    await settle()
    expect(fetchConfig).toHaveBeenCalledTimes(1)
    const mainKey = keyedKeys().find((k) => k.includes('"main"'))!
    const main = nuxtApp.payload.data[mainKey]
    expect(main).toBeDefined()
    name.value = 'footer'
    await vi.waitFor(() => expect(keyedKeys().some((k) => k.includes('"footer"'))).toBe(true))
    await settle()
    expect(keyedKeys()).toHaveLength(2)
    expect(nuxtApp.payload.data[mainKey]).toBe(main)
    expect(nuxtApp.payload.data[keyedKeys().find((k) => k.includes('"footer"'))!]).toBeDefined()
    // One more run for the change: the key change and the watch do not both fetch.
    expect(fetchConfig).toHaveBeenCalledTimes(2)
  })

  it('restores the first entry again after an input changes and changes back, while another instance holds it', async () => {
    const fetchData = vi.fn()
    // As a generated site holds it: getCachedData answers the key from static data, so switching back fetches nothing.
    useNuxtApp().static.data['druxt:DruxtListing:["main"]:wrapper'] = {
      is: 'DruxtListingDefault', options: ['DruxtListingDefault'], settings: {}, wrapperProps: ['label'], listens: false, state: { label: 'Prerendered main' },
    }
    const Listing = nest(defineComponent({
      name: 'DruxtListing',
      props: { ...druxtModuleProps, name: String },
      emits: [...druxtModuleEmits],
      components: { DruxtListingDefault: defineComponent({ props: { label: String }, setup: (p) => () => h('p', { class: 'label' }, p.label) }) },
      setup: (p) => {
        const label = ref<string>()
        return useDruxtModule(p, {
          componentOptions: () => [['default']],
          fetchData: () => { fetchData(p.name); label.value = `Fetched ${p.name}` },
          propsData: () => ({ label: label.value }),
          state: { label },
          watch: () => [p.name],
        })
      },
    }))
    const name = ref('main')
    try {
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h('div', [h(Listing, { name: 'main' }), h(Listing, { name: name.value })]),
      }))
      const labels = () => wrapper.findAll('p.label').map((label) => label.text())
      await settle(() => expect(labels()).toEqual(['Prerendered main', 'Prerendered main']))
      name.value = 'footer'
      await settle(() => expect(labels()).toEqual(['Prerendered main', 'Fetched footer']))
      name.value = 'main'
      await settle()
      expect(labels()).toEqual(['Prerendered main', 'Prerendered main'])
      expect(fetchData.mock.calls).toEqual([['footer']])
    } finally {
      delete useNuxtApp().static.data['druxt:DruxtListing:["main"]:wrapper']
    }
  })

  it('refresh() on the module context runs the pipeline again', async () => {
    const fetchConfig = vi.fn()
    let context: ReturnType<typeof useDruxtModuleContext>
    const Wrapper = defineComponent({
      setup: () => {
        context = useDruxtModuleContext()
        return () => h('p', 'x')
      },
    })
    await mountSuspended(testModule({ ...article, fetchConfig }, { DruxtTestDefault: Wrapper }))
    await settle()
    expect(fetchConfig).toHaveBeenCalledTimes(1)
    await context!.refresh()
    expect(fetchConfig).toHaveBeenCalledTimes(2)
  })

  it('refresh() starts a fresh run while the first is still in flight', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    // The first run's context: the wrapper has not rendered yet, so fetchConfig hands it out.
    let ctx: DruxtModuleContext | undefined
    const fetchConfig = vi.fn((c: DruxtModuleContext) => { ctx ??= c; return gate })
    mountSuspended(testModule({ ...article, fetchConfig })).catch(() => {})
    await vi.waitFor(() => expect(fetchConfig).toHaveBeenCalledTimes(1))
    const refreshed = ctx!.refresh()
    release()
    await refreshed
    await settle()
    expect(fetchConfig).toHaveBeenCalledTimes(2)
  })

  it('restores declared state from data already loaded, without running the pipeline', async () => {
    const fetchConfig = vi.fn()
    const resource = ref<unknown>(null)
    useNuxtApp().static.data['druxt:restored:wrapper'] = {
      is: 'DruxtTestDefault', options: ['DruxtTestDefault'], settings: {}, wrapperProps: ['resource'], listens: false, state: { resource: { title: 'Saved' } },
    }
    const wrapper = await mountSuspended(nest(defineComponent({
      name: 'DruxtTest',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      components: { DruxtTestDefault: defineComponent({ props: { resource: Object }, setup: (p) => () => h('p', (p.resource as { title: string }).title) }) },
      setup: (p) => useDruxtModule(p, { ...article, fetchConfig, key: () => 'restored', state: { resource }, propsData: () => ({ resource: resource.value }) }),
    })))
    await settle()
    expect(fetchConfig).not.toHaveBeenCalled()
    expect(wrapper.text()).toBe('Saved')
  })

  it('keeps a state ref live after a client run, instead of replacing it with a copy', async () => {
    const original = { title: 'x', greet: () => 'hi' }
    const resource = ref<unknown>(null)
    await mountSuspended(nest(defineComponent({
      name: 'DruxtTest',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, {
        ...article,
        fetchConfig: () => { resource.value = original },
        state: { resource },
      }),
    })))
    await settle()
    // toRaw: ref() wraps an assigned object in its own reactive proxy, unrelated to the fix under test.
    expect(toRaw(resource.value)).toBe(original)
    expect((resource.value as typeof original).greet()).toBe('hi')
  })

  it('restores declared state during hydration, from the payload', async () => {
    const fetchConfig = vi.fn()
    const resource = ref<unknown>(null)
    const nuxtApp = useNuxtApp()
    nuxtApp.isHydrating = true
    nuxtApp.payload.data['druxt:hydrated:wrapper'] = {
      is: 'DruxtTestDefault', options: ['DruxtTestDefault'], settings: {}, wrapperProps: ['resource'], listens: false, state: { resource: { title: 'Hydrated' } },
    }
    try {
      const wrapper = await mountSuspended(nest(defineComponent({
        name: 'DruxtTest',
        props: druxtModuleProps,
        emits: [...druxtModuleEmits],
        components: { DruxtTestDefault: defineComponent({ props: { resource: Object }, setup: (p) => () => h('p', (p.resource as { title: string }).title) }) },
        setup: (p) => useDruxtModule(p, { ...article, fetchConfig, key: () => 'hydrated', state: { resource }, propsData: () => ({ resource: resource.value }) }),
      })))
      await settle()
      expect(fetchConfig).not.toHaveBeenCalled()
      expect(wrapper.text()).toBe('Hydrated')
    } finally {
      nuxtApp.isHydrating = false
    }
  })

  it('runs the pipeline once when restore answers false, as a shared entry naming what the stores lack gives', async () => {
    const fetchData = vi.fn((_ctx: DruxtModuleContext) => { resource.value = { title: 'Read again' } })
    const resource = ref<unknown>(null)
    const nuxtApp = useNuxtApp()
    nuxtApp.isHydrating = true
    nuxtApp.payload.data['druxt:missed:wrapper'] = {
      is: 'DruxtTestDefault', options: ['DruxtTestDefault'], settings: {}, wrapperProps: ['resource'], listens: false, state: { resource: { title: 'Shared' } },
    }
    try {
      const wrapper = await mountSuspended(nest(defineComponent({
        name: 'DruxtTest',
        props: druxtModuleProps,
        emits: [...druxtModuleEmits],
        components: { DruxtTestDefault: defineComponent({ props: { resource: Object }, setup: (p) => () => h('p', (p.resource as { title: string } | null)?.title) }) },
        setup: (p) => useDruxtModule(p, { ...article, fetchData, key: () => 'missed', state: { resource }, restore: () => false, propsData: () => ({ resource: resource.value }) }),
      })))
      await settle(() => expect(wrapper.text()).toBe('Read again'))
      expect(fetchData).toHaveBeenCalledTimes(1)
    } finally {
      nuxtApp.isHydrating = false
    }
  })

  it('reads again for an instance mounted after a cache clear, though the entry came from this app', async () => {
    // What the module reads lives in a store a cache clear empties, as a menu's links do.
    const held = new Set<string>()
    const fetchData = vi.fn(() => { held.add('read') })
    const contract = { ...article, fetchData, key: () => 'cleared', restore: () => held.has('read') }
    const Probe = testModule(contract)
    const first = await mountSuspended(Probe)
    await settle(() => expect(fetchData).toHaveBeenCalledTimes(1))
    // A cache clear, as a login or a logout makes, empties the store while the first instance stays on the page.
    useDruxtStore().clearCache()
    held.clear()
    const second = await mountSuspended(Probe)
    await settle(() => expect(fetchData).toHaveBeenCalledTimes(2))
    await settle()
    expect(fetchData).toHaveBeenCalledTimes(2)
    first.unmount()
    second.unmount()
  })

  it('drops a read again whose key changed while it ran, as a language switch mid-flight gives', async () => {
    // The first read, for the missed entry, waits until the test lets it go, after the input has changed.
    let release: () => void = () => {}
    const held = new Promise<void>((resolve) => { release = resolve })
    const resource = ref<unknown>(null)
    const fetchData = vi.fn(async (ctx: DruxtModuleContext) => {
      const input = (ctx.propsData.value as { input?: string }).input
      if (input === 'first') await held
      resource.value = { title: input }
    })
    const nuxtApp = useNuxtApp()
    nuxtApp.isHydrating = true
    nuxtApp.payload.data[`druxt:DruxtTest:${JSON.stringify(['first'])}:wrapper`] = {
      is: 'DruxtTestDefault', options: ['DruxtTestDefault'], settings: {}, wrapperProps: ['resource'], listens: false, state: { resource: { title: 'Shared' } },
    }
    try {
      const wrapper = await mountSuspended(nest(defineComponent({
        name: 'DruxtTest',
        props: { ...druxtModuleProps, input: { type: String, default: 'first' } },
        emits: [...druxtModuleEmits],
        components: { DruxtTestDefault: defineComponent({ props: { resource: Object }, setup: (p) => () => h('p', (p.resource as { title: string } | null)?.title) }) },
        setup: (p) => useDruxtModule(p, { ...article, fetchData, restore: () => false, state: { resource }, watch: () => [p.input], propsData: () => ({ resource: resource.value, input: p.input }) }),
      })))
      nuxtApp.isHydrating = false
      await wrapper.setProps({ input: 'second' })
      await settle(() => expect(wrapper.text()).toBe('second'))
      // The first read finishes after the switch: its result is for a key the module has left.
      release()
      await settle()
      expect(wrapper.text()).toBe('second')
    } finally {
      nuxtApp.isHydrating = false
    }
  })

  // The server's half is test/standalone/shared.test.ts: only a real server render runs no watcher after setup.
  it.each([2, 3])('restores the same entry into each of %i instances with the same inputs during hydration, with no request', async (count) => {
    const fetchConfig = vi.fn()
    const nuxtApp = useNuxtApp()
    nuxtApp.isHydrating = true
    nuxtApp.payload.data['druxt:shared:wrapper'] = {
      is: 'DruxtTestDefault', options: ['DruxtTestDefault'], settings: {}, wrapperProps: ['items'], listens: false, state: { items: ['First', 'Second', 'Third'] },
    }
    // Each instance's own state ref, as a contract built in setup holds it.
    const Shared = nest(defineComponent({
      name: 'DruxtTest',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      components: { DruxtTestDefault: defineComponent({ props: { items: Array }, setup: (p) => () => h('ul', (p.items as string[]).map((item) => h('li', item))) }) },
      setup: (p) => {
        const items = ref<string[]>([])
        return useDruxtModule(p, { ...article, fetchConfig, key: () => 'shared', state: { items }, propsData: () => ({ items: items.value }) })
      },
    }))
    try {
      const wrapper = await mountSuspended(defineComponent({ setup: () => () => h('div', Array.from({ length: count }, () => h(Shared))) }))
      await settle()
      expect(wrapper.findAll('ul').map((list) => list.findAll('li').map((item) => item.text()))).toEqual(Array.from({ length: count }, () => ['First', 'Second', 'Third']))
      expect(fetchConfig).not.toHaveBeenCalled()
      expect(payloadKeys().filter((key) => key.startsWith('druxt:shared'))).toEqual(['druxt:shared:wrapper'])
    } finally {
      nuxtApp.isHydrating = false
    }
  })

  // A regression guard, settled in a browser: the server renders the parent before the module's setup emits, and never
  // again, so the parent's own markup shows the model only after hydration, and the first client render matches.
  it('renders a parent bound to an empty ref without the model at hydration, and with it after, with no mismatch', async () => {
    const nuxtApp = useNuxtApp()
    nuxtApp.isHydrating = true
    nuxtApp.payload.data['druxt:parent-text:wrapper'] = {
      is: 'DruxtTestDefault', options: ['DruxtTestDefault'], settings: {}, wrapperProps: [], listens: false, state: { route: { label: 'Restored' } },
    }
    const Restoring = nest(defineComponent({
      name: 'DruxtTest',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      components: { DruxtTestDefault: defineComponent({ setup: () => () => h('span') }) },
      setup: (p) => {
        const route = ref<{ label: string } | undefined>()
        return useDruxtModule(p, { ...article, key: () => 'parent-text', state: { route }, restore: (ctx) => { ctx.model.value = route.value } })
      },
    }))
    const texts: string[] = []
    const logged = [vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')]
    try {
      const wrapper = await mountSuspended(defineComponent({
        setup: () => {
          const value = ref<{ label: string } | undefined>()
          return () => {
            texts.push(String(value.value?.label))
            return h('div', [h('p', { class: 'parent' }, String(value.value?.label)), h(Restoring, { 'modelValue': value.value, 'onUpdate:modelValue': (next: { label: string }) => { value.value = next } })])
          }
        },
      }))
      await settle()
      expect(texts[0]).toBe('undefined')
      expect(wrapper.find('p.parent').text()).toBe('Restored')
      expect(logged.flatMap((spy) => spy.mock.calls).filter(([message]) => /hydration|mismatch/i.test(String(message)))).toEqual([])
    } finally {
      nuxtApp.isHydrating = false
    }
  })

  it('reports a module without a name once in development, naming its file, and names it DruxtUnnamed', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    let name: string | undefined
    // Nested: mountSuspended's own clone always has a name, so an unnamed module needs a real, separate instance.
    const Unnamed = nest(defineComponent({
      props: druxtModuleProps,
      __file: 'components/druxt/Unnamed.ts',
      setup: (p: DruxtModuleProps) => useDruxtModule(p, { fetchConfig: (ctx) => { name = ctx.name } }),
    } as Parameters<typeof defineComponent>[0]))
    await mountSuspended(defineComponent({ setup: () => () => h('div', [h(Unnamed), h(Unnamed)]) }))
    await settle()
    const reports = error.mock.calls.filter(([message]) => String(message).includes('needs a `name`'))
    expect(reports).toHaveLength(1)
    expect(reports[0]![0]).toContain('components/druxt/Unnamed.ts')
    expect(name).toBe('DruxtUnnamed')
    error.mockRestore()
  })

  it('takes a <script setup> module\'s name from its file, and renders it from its template', async () => {
    const DruxtTestScriptSetupDefault = defineComponent({ props: { title: String }, setup: (p) => () => h('h2', p.title) })
    useNuxtApp().vueApp.component('DruxtTestScriptSetupDefault', DruxtTestScriptSetupDefault)
    const warn = vi.spyOn(console, 'warn')
    const wrapper = await mountSuspended(nest(DruxtTestScriptSetup as Component))
    await settle(() => expect(wrapper.find('h2').exists()).toBe(true))
    expect(wrapper.find('h2').text()).toBe('From script setup')
    expect(warn.mock.calls.filter(([message]) => String(message).includes('never rendered'))).toHaveLength(0)
  })

  it('warns once when a <script setup> module\'s file name is not the name it is registered under', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // As components/druxt/Nested.vue: the compiler names it Nested, and Nuxt registers it as DruxtNested.
    const nested = (file: string) => defineComponent({ __name: file, props: druxtModuleProps, setup: (p: DruxtModuleProps) => useDruxtModule(p, {}) } as Parameters<typeof defineComponent>[0])
    const Direct = nested('Nested')
    const Lazy = nested('LazyLoaded')
    const app = useNuxtApp().vueApp
    app.component('DruxtNested', Direct)
    // A global Nuxt component is registered as an async wrapper.
    app.component('DruxtLazyLoaded', defineAsyncComponent(() => Promise.resolve(Lazy)))
    const named = nested('DruxtNamedRight')
    app.component('DruxtNamedRight', named)
    await mountSuspended(defineComponent({
      setup: () => () => h('div', ['DruxtNested', 'DruxtNested', 'DruxtLazyLoaded', 'DruxtNamedRight'].map((component) => h(resolveComponent(component) as Component))),
    }))
    await settle()
    const reports = warn.mock.calls.map(([message]) => String(message)).filter((message) => message.includes('from its file'))
    expect(reports).toEqual([
      expect.stringContaining('DruxtNested takes its module name, Nested, from its file'),
      expect.stringContaining('DruxtLazyLoaded takes its module name, LazyLoaded, from its file'),
    ])
    expect(reports[0]).toContain("defineOptions({ name: 'DruxtNested' })")
  })

  it('warns in development when a module never renders its render function', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await mountSuspended(nest(defineComponent({
      name: 'DruxtTestDestructured',
      props: druxtModuleProps,
      setup: (p) => {
        // As a module that expects an object back: useDruxtModule() returns the render function itself.
        const { render } = useDruxtModule(p, {}) as unknown as { render?: () => VNode }
        return render
      },
    })))
    await settle()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('DruxtTestDestructured never rendered'))
  })

  it('hands the hooks the client and the store, which a hook reads after an await', async () => {
    let seen: { client: unknown, store: unknown } | undefined
    await mountSuspended(testModule({
      ...article,
      async fetchData(ctx) {
        await new Promise((resolve) => setTimeout(resolve, 0))
        seen = { client: ctx.client, store: ctx.store }
      },
    }))
    await settle(() => expect(seen).toBeDefined())
    expect(seen!.client).toBe(useNuxtApp().$druxt)
    expect(seen!.store).toBe(useDruxtStore())
  })
})

// What a site's component imports to read the site's languages, as @druxt/blocks does.
describe('useDruxtLanguages(), from @druxt/core/runtime', () => {
  it('gives a component the languages the build read, and the default language', async () => {
    // As a build of a site serving English unprefixed and Spanish under es would hold them.
    useState(DRUXT_LANGUAGES_STATE).value = [{ langcode: 'en', prefix: '' }, { langcode: 'es', prefix: 'es' }]
    const wrapper = await mountSuspended(defineComponent({
      setup: () => {
        const { languages, defaultLangcode } = useDruxtLanguages()
        return () => h('p', JSON.stringify({ languages: languages.value, defaultLangcode: defaultLangcode.value ?? null }))
      },
    }))
    expect(JSON.parse(wrapper.text())).toEqual({ languages: [{ langcode: 'en', prefix: '' }, { langcode: 'es', prefix: 'es' }], defaultLangcode: 'en' })
  })

  // Auto-imported, as useDruxtClient() and its siblings are: test/nuxt/components/DruxtTestLanguages.vue imports nothing.
  it('is auto-imported, and gives no default language when every language is prefixed', async () => {
    useState(DRUXT_LANGUAGES_STATE).value = [{ langcode: 'en', prefix: 'en' }, { langcode: 'es', prefix: 'es' }]
    const wrapper = await mountSuspended(DruxtTestLanguages)
    expect(JSON.parse(wrapper.text())).toEqual({ languages: [{ langcode: 'en', prefix: 'en' }, { langcode: 'es', prefix: 'es' }], defaultLangcode: null })
  })
})
