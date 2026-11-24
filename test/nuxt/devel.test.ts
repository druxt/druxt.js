import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount } from '@vue/test-utils'
import { defineComponent, getCurrentInstance, h, provide } from 'vue'
import { useNuxtApp, useRouter, useState } from '#imports'
import { useDruxtStore } from '@druxt/core/store'
import { DRUXT_SETTINGS_DRUPAL_KEY } from '@druxt/core/settings'
import { DRUXT_QUIET, druxtModuleEmits, druxtModuleProps, useDruxtModule, useDruxtModuleContext } from '@druxt/core/runtime'
// Through the package, as the modules under test use it: a source import would be a second registry.
import type { DruxtDevtoolsChannel, DruxtDevtoolsRequest } from '@druxt/devtools'
import { addModuleNote, develNotes, missingWrappers, removeModuleNote, useDruxtDevtools } from '@druxt/core/devel'
import { matchAnyPath, nest, settle } from './helpers'

// Unmounting runs Nuxt's onScopeDispose for useAsyncData, which purges the
// key's cached data; without it, tests sharing this file's one Vue app and
// mountSuspended()'s per-mount useId() reset would answer each other's keys.
enableAutoUnmount(afterEach)

const Module = defineComponent({
  name: 'DruxtTest',
  props: druxtModuleProps,
  emits: [...druxtModuleEmits],
  setup: (p) => useDruxtModule(p, { componentOptions: () => [['node--article'], ['default']] }),
})

// The development tools' channel, as the Nuxt DevTools tab reads it.
const druxtDevtools = (): DruxtDevtoolsChannel => (useNuxtApp().$druxtDevtools as { channel: DruxtDevtoolsChannel }).channel

// The settings Drupal published: the config sets no develMessages, so these are used.
const fromDrupal = () => useState(DRUXT_SETTINGS_DRUPAL_KEY('default'))

describe('the development tools', () => {
  afterEach(() => { fromDrupal().value = {} })

  it('keeps a missing-wrapper message out of the page', async () => {
    const wrapper = await mountSuspended(nest(Module))
    await settle()
    expect(wrapper.text()).not.toContain('Missing default slot')
  })

  it('lists a module that rendered no wrapper, with its candidate names', async () => {
    const wrapper = await mountSuspended(nest(Module))
    await settle()
    const entries = [...missingWrappers.values()]
    expect(entries.map((e) => e.component)).toContain('DruxtTest')
    expect(entries.find((e) => e.component === 'DruxtTest')?.options).toEqual(['DruxtTestNodeArticle', 'DruxtTestDefault'])
    wrapper.unmount()
    expect([...missingWrappers.values()].map((e) => e.component)).not.toContain('DruxtTest')
  })

  it('reports the module to the tools, with its candidates, status, data key and the files to create', async () => {
    const module = await mountSuspended(nest(Module))
    await settle()
    const reported = druxtDevtools().snapshot().modules.find((m) => m.component === 'DruxtTest')!
    expect(reported).toMatchObject({ candidates: ['DruxtTestNodeArticle', 'DruxtTestDefault'], wrapper: null, status: 'default', notes: [] })
    expect(reported.key).toContain('DruxtTest')
    expect(reported.props).toEqual({})
    expect(reported.templates!.map((t) => [t.name, t.path])).toEqual([
      ['DruxtTestNodeArticle', 'components/druxt/test/NodeArticle.vue'],
      ['DruxtTestDefault', 'components/druxt/test/Default.vue'],
    ])
    expect(druxtDevtools().snapshot().missing.find((g) => g.component === 'DruxtTest')!.entries[0]).toMatchObject({ count: 1, meta: 'node · article' })
    module.unmount()
    expect(druxtDevtools().snapshot().modules.map((m) => m.component)).not.toContain('DruxtTest')
  })

  it('keeps a note a module adds, for a later task such as Layout Builder\'s fallback', async () => {
    const module = await mountSuspended(nest(Module))
    await settle()
    const id = druxtDevtools().snapshot().modules.find((m) => m.component === 'DruxtTest')!.id
    addModuleNote(Number(id), { kind: 'fallback', title: 'Rendered without its layout.' })
    addModuleNote(Number(id), { kind: 'fallback', title: 'Rendered without its layout, again.' })
    expect(druxtDevtools().snapshot().modules.find((m) => m.id === id)!.notes).toEqual([{ kind: 'fallback', title: 'Rendered without its layout, again.' }])
    module.unmount()
  })

  it('attaches a note from inside the module\'s render to the module, and keeps it through a refresh', async () => {
    let ctx: ReturnType<typeof useDruxtModuleContext>
    // Inside the module's template: its own instance is not the module's, and the note attaches to the module above.
    const Inner = defineComponent({
      setup() {
        ctx = useDruxtModuleContext()
        addModuleNote(getCurrentInstance()!, { kind: 'fallback', key: 'fallback:layout', title: 'From the instance.' })
        addModuleNote(ctx!, { kind: 'fallback', key: 'fallback:context', title: 'From the context.' })
        return () => h('p', 'inner')
      },
    })
    const Templated = defineComponent({
      name: 'DruxtTestNoted',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, {}),
    })
    const wrapper = await mountSuspended(defineComponent({ setup: () => () => h(Templated, null, { default: () => h(Inner) }) }))
    await settle(() => expect(wrapper.text()).toContain('inner'))
    const notes = () => druxtDevtools().snapshot().modules.find((m) => m.component === 'DruxtTestNoted')!.notes.map((note) => note.title)
    expect(notes()).toEqual(['From the instance.', 'From the context.'])
    await ctx!.refresh()
    await settle()
    expect(notes()).toEqual(['From the instance.', 'From the context.'])
    removeModuleNote(ctx!, 'fallback:layout')
    expect(notes()).toEqual(['From the context.'])
    wrapper.unmount()
  })

  it('lets a module add a section, a timeline event and an action, through useDruxtDevtools()', async () => {
    const devtools = useDruxtDevtools()
    let count = 1
    const section = devtools.section({ id: 'test', label: 'Test' }, () => [{ type: 'pairs', items: { count } }])
    const find = () => druxtDevtools().snapshot().sections.find((item) => item.id === 'test')
    expect(find()).toMatchObject({ label: 'Test', blocks: [{ type: 'pairs', items: { count: 1 } }] })
    count = 2
    section.refresh()
    expect(find()!.blocks).toEqual([{ type: 'pairs', items: { count: 2 } }])

    devtools.event('test refetch', 'filter changed')
    expect(druxtDevtools().snapshot().timeline.at(-1)).toMatchObject({ label: 'test refetch', detail: 'filter changed' })

    let ran = 0
    const withdraw = devtools.action({ id: 'test:run', label: 'Run', section: 'test' }, () => { ran += 1 })
    expect(find()!.actions).toEqual([{ id: 'test:run', label: 'Run', section: 'test' }])
    await druxtDevtools().runAction('test:run')
    expect(ran).toBe(1)
    withdraw()
    section.remove()
    expect(find()).toBeUndefined()
  })

  // Read from source, so this is a second copy of the API whose channel is not set yet, as before core's plugin runs.
  it('never shows a section that was removed while the tools were not ready, even when its removal was not kept', async () => {
    const { useDruxtDevtools: early } = await import('../../packages/core/src/runtime/devel/api')
    const { setDruxtDevtools, whenDruxtDevtools } = await import('../../packages/core/src/runtime/devel/utils/channel')
    const { createDruxtDevtools } = await import('@druxt/devtools')
    const provider = vi.fn(() => [])
    const section = early().section({ id: 'gone', label: 'Gone' }, provider)
    // The list of waiting tasks is full, so the removal's own task is dropped.
    for (let i = 0; i < 199; i++) whenDruxtDevtools(() => {})
    section.remove()
    const channel = createDruxtDevtools()
    try {
      setDruxtDevtools(channel)
      expect(provider).not.toHaveBeenCalled()
      expect(channel.snapshot().sections.map((item) => item.id)).not.toContain('gone')
    } finally {
      setDruxtDevtools(undefined)
    }
  })

  it('gives the DevTools tab the channel and the create endpoint, and adds nothing to the page', async () => {
    const host = useNuxtApp().$druxtDevtools as { channel: DruxtDevtoolsChannel, createEndpoint: string, define: unknown }
    expect(host.channel.snapshot).toBeTypeOf('function')
    expect(host.createEndpoint).toBe('/api/_druxt/template')
    expect(typeof host.define).toBe('function')
    expect(document.getElementById('druxt-devel')).toBeNull()
    expect(document.querySelector('druxt-devtools')).toBeNull()
  })

  it('records the client\'s requests with their timing, and the reads the store answered', async () => {
    const nuxtApp = useNuxtApp()
    const before = druxtDevtools().snapshot().requests.length
    await nuxtApp.$druxt.request('/jsonapi')
    const store = useDruxtStore(nuxtApp.$pinia)
    store.addResource({ resource: { data: { type: 'node--page', id: 'held', attributes: { title: 'Held' } } } })
    await store.getResource({ type: 'node--page', id: 'held' })
    const requests = druxtDevtools().snapshot().requests.slice(before)
    expect(requests[0]).toMatchObject({ kind: 'jsonapi', path: '/jsonapi', status: 200, source: 'network', side: 'browser' })
    expect(requests[0]!.duration).toBeGreaterThanOrEqual(0)
    expect(requests[1]).toMatchObject({ kind: 'jsonapi', path: '/jsonapi/node/page/held', source: 'store', duration: 0 })
  })

  // A first load the server rendered lists the server's requests: a navigation within the same page keeps them, and
  // one to another page starts its own list.
  it('keeps the page\'s requests on a navigation to a hash in it, and starts afresh on another page', async () => {
    matchAnyPath()
    const router = useRouter()
    await router.push('/requests-page')
    await settle()
    await useNuxtApp().$druxt.request('/jsonapi')
    const paths = () => druxtDevtools().snapshot().requests.map((r) => r.path)
    expect(paths()).toContain('/jsonapi')
    await router.push('/requests-page#part')
    expect(paths()).toContain('/jsonapi')
    await router.push('/another-page')
    expect(paths()).toEqual([])
  })

  // A navigation a later guard refuses never shows its page, so the page shown keeps its name and its requests.
  it('keeps the page and its requests when a navigation is refused', async () => {
    matchAnyPath()
    const router = useRouter()
    await router.push('/kept-page')
    await settle()
    await useNuxtApp().$druxt.request('/jsonapi')
    const stop = router.beforeEach((to) => to.path === '/refused-page' ? false : undefined)
    try {
      await router.push('/refused-page')
      expect(router.currentRoute.value.path).toBe('/kept-page')
      expect(druxtDevtools().snapshot().page).toBe('/kept-page')
      expect(druxtDevtools().snapshot().requests.map((r) => r.path)).toContain('/jsonapi')
    } finally {
      stop()
    }
    // The refused page is still a new page when a later navigation reaches it.
    await router.push('/refused-page')
    expect(druxtDevtools().snapshot().page).toBe('/refused-page')
    expect(druxtDevtools().snapshot().requests).toEqual([])
  })

  // A page with no visitor input, such as a kiosk, a carousel or a timer, navigates by itself: the server render's
  // requests belong to the page it rendered, and show only there.
  it('shows the server render\'s requests only on the page they were made for, whoever navigates', async () => {
    matchAnyPath()
    const router = useRouter()
    await router.push('/server-page')
    // The state the server render's requests reach the browser in, as core's server plugin fills it, each labelled with
    // the page it rendered.
    const server = useState<DruxtDevtoolsRequest[]>('druxt:devtools:requests', () => [])
    server.value = [{ id: 'server:1', side: 'server', kind: 'jsonapi', path: '/jsonapi/node/article/a', source: 'network', start: 0, duration: 10, status: 200, page: '/server-page' }]
    const paths = () => druxtDevtools().snapshot().requests.map((r) => `${r.side} ${r.path}`)
    try {
      // A navigation with no input before it: the old records do not show on the new path.
      await router.replace('/en/next-slide')
      expect(paths()).toEqual([])
      // Back on the page the server rendered, they show again: the model keeps them, scoped by path.
      await router.push('/server-page')
      expect(paths()).toEqual(['server /jsonapi/node/article/a'])
      await router.push('/server-page#part')
      expect(paths()).toEqual(['server /jsonapi/node/article/a'])
      await router.push('/en/another-slide')
      expect(paths()).toEqual([])
    } finally {
      server.value = []
    }
  })

  it('reports the anchors state the build settled, and the modules that required it', () => {
    const settings = druxtDevtools().snapshot().settings.filter((s) => s.key.startsWith('anchors'))
    expect(settings).toEqual([
      { key: 'anchors', value: true, tier: 'default' },
      { key: 'anchors.requiredBy', value: [], tier: 'default' },
    ])
  })

  it('lists modules with the same candidates once, with a count', async () => {
    const first = await mountSuspended(nest(Module))
    const second = await mountSuspended(nest(Module))
    await settle()
    const entries = [...missingWrappers.values()].filter((e) => e.component === 'DruxtTest')
    expect(entries).toHaveLength(1)
    expect(entries[0]!.count).toBe(2)
    const group = druxtDevtools().snapshot().missing.find((g) => g.component === 'DruxtTest')!
    expect(group.entries).toHaveLength(1)
    expect(group.entries[0]!.count).toBe(2)
    first.unmount()
    second.unmount()
  })

  it('renders nothing for a quiet module that fails, and lists its error in the tools', async () => {
    const Failing = defineComponent({
      name: 'DruxtTestQuiet',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { fetchConfig: () => { throw { response: { status: 403, statusText: 'Forbidden' } } } }),
    })
    const Quiet = defineComponent({
      setup() {
        provide(DRUXT_QUIET, true)
        return () => h('p', { class: 'quiet' }, [h(Failing)])
      },
    })
    const wrapper = await mountSuspended(Quiet)
    await settle(() => expect([...develNotes.values()].map((n) => n.component)).toContain('DruxtTestQuiet'))
    expect(wrapper.find('.druxt-debug').exists()).toBe(false)
    expect(wrapper.find('p.quiet').text()).toBe('')
    expect([...develNotes.values()].find((n) => n.component === 'DruxtTestQuiet')!.summary).toBe('403: Forbidden')

    expect(druxtDevtools().snapshot().quiet.find((q) => q.component === 'DruxtTestQuiet')).toMatchObject({ status: '403', detail: 'Forbidden' })
    expect(druxtDevtools().snapshot().modules.find((m) => m.component === 'DruxtTestQuiet')).toMatchObject({ status: 'error', statusCode: 403, quiet: true })
    wrapper.unmount()
    expect([...develNotes.values()].map((n) => n.component)).not.toContain('DruxtTestQuiet')
    expect(druxtDevtools().snapshot().quiet.map((q) => q.component)).not.toContain('DruxtTestQuiet')
  })

  it('keeps the backend URL and Drupal\'s detail out of a quiet error\'s note', async () => {
    const Failing = defineComponent({
      name: 'DruxtTestQuietNetwork',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { fetchConfig: () => { throw new Error('fetch failed\n\nURL: https://drupal.test/jsonapi/node/page\n\nDetail from Drupal.') } }),
    })
    const Quiet = defineComponent({
      setup() {
        provide(DRUXT_QUIET, true)
        return () => h(Failing)
      },
    })
    await mountSuspended(Quiet)
    await settle(() => expect([...develNotes.values()].map((n) => n.component)).toContain('DruxtTestQuietNetwork'))
    expect([...develNotes.values()].find((n) => n.component === 'DruxtTestQuietNetwork')!.summary).toBe('fetch failed')
  })

  it('keeps a URL inside the first line out of a quiet error\'s note', async () => {
    const Failing = defineComponent({
      name: 'DruxtTestQuietInline',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { fetchConfig: () => { throw new Error('Request to https://drupal.test/jsonapi/node/page?x=1 failed') } }),
    })
    await mountSuspended(defineComponent({
      setup() {
        provide(DRUXT_QUIET, true)
        return () => h(Failing)
      },
    }))
    await settle(() => expect([...develNotes.values()].map((n) => n.component)).toContain('DruxtTestQuietInline'))
    expect([...develNotes.values()].find((n) => n.component === 'DruxtTestQuietInline')!.summary).toBe('Request to failed')
  })

  it('keeps a module nested in a quiet one loud', async () => {
    const Inner = defineComponent({
      name: 'DruxtTestInner',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { fetchConfig: () => { throw { response: { status: 404, statusText: 'Not Found' } } } }),
    })
    const Outer = defineComponent({
      name: 'DruxtTestOuter',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { slots: () => ({ default: () => h(Inner) }) }),
    })
    const Quiet = defineComponent({
      setup() {
        provide(DRUXT_QUIET, true)
        return () => h(Outer)
      },
    })
    const wrapper = await mountSuspended(Quiet)
    await settle(() => expect(wrapper.find('.druxt-debug').exists()).toBe(true))
    expect(wrapper.find('summary').text()).toContain('404: Not Found')
    expect([...develNotes.values()].map((n) => n.component)).not.toContain('DruxtTestInner')
  })

  it('renders DruxtDebug for a failing module that is not quiet', async () => {
    const Failing = defineComponent({
      name: 'DruxtTestLoud',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { fetchConfig: () => { throw { response: { status: 403, statusText: 'Forbidden' } } } }),
    })
    const wrapper = await mountSuspended(nest(Failing))
    await settle(() => expect(wrapper.find('.druxt-debug').exists()).toBe(true))
    expect([...develNotes.values()].map((n) => n.component)).not.toContain('DruxtTestLoud')
  })

  it('renders 1.x\'s inline message when the site asks for it', async () => {
    fromDrupal().value = { develMessages: 'inline' }
    const wrapper = await mountSuspended(nest(Module))
    await settle()
    expect(wrapper.text()).toContain('Missing default slot')
  })

  it('still shows a failure inline', async () => {
    const Failing = defineComponent({
      name: 'DruxtFail',
      props: druxtModuleProps,
      emits: [...druxtModuleEmits],
      setup: (p) => useDruxtModule(p, { fetchConfig: () => { throw { response: { status: 500 } } } }),
    })
    const wrapper = await mountSuspended(nest(Failing))
    await settle()
    expect(wrapper.text()).toContain('500')
  })
})
