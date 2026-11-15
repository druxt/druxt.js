import { describe, expect, it, vi } from 'vitest'
import type { App, ComponentInternalInstance } from 'vue'
import { createDruxtDevtools } from '../../packages/devtools/src'
import { setupDruxtVueDevtools } from '../../packages/core/src/runtime/devel/utils/vue-devtools'
import { module } from './devtools-fixtures'

// Vue DevTools' plugin API, mocked: the plugin's setup runs at once against a recording API.
const api = vi.hoisted(() => {
  const handlers: Record<string, (payload: Record<string, unknown>) => void> = {}
  return {
    handlers,
    descriptor: undefined as Record<string, unknown> | undefined,
    addInspector: vi.fn(),
    addTimelineLayer: vi.fn(),
    addTimelineEvent: vi.fn(),
    sendInspectorTree: vi.fn(),
    sendInspectorState: vi.fn(),
    highlightElement: vi.fn(async () => {}),
    now: () => 1000,
    on: {
      getInspectorTree: (fn: (payload: Record<string, unknown>) => void) => { handlers.tree = fn },
      getInspectorState: (fn: (payload: Record<string, unknown>) => void) => { handlers.state = fn },
    },
  }
})
vi.mock('@vue/devtools-api', () => ({
  setupDevtoolsPlugin: (descriptor: Record<string, unknown>, setup: (a: typeof api) => void) => {
    api.descriptor = descriptor
    setup(api)
  },
}))

describe('the Vue DevTools plugin', () => {
  const app = {} as App
  const instance = (uid: number, parent?: ComponentInternalInstance) => ({ uid, parent }) as unknown as ComponentInternalInstance

  it('registers a Druxt inspector and a Druxt requests timeline layer for the app', () => {
    setupDruxtVueDevtools(app, createDruxtDevtools(), new Map())
    expect(api.descriptor).toMatchObject({ id: 'druxt', label: 'Druxt', packageName: '@druxt/core', app })
    expect(api.addInspector).toHaveBeenCalledWith(expect.objectContaining({ id: 'druxt', label: 'Druxt' }))
    expect(api.addTimelineLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'druxt', label: 'Druxt requests' }))
  })

  it('shows the modules as a tree, each under the module it renders within, named then described', () => {
    const channel = createDruxtDevtools()
    const outer = instance(1)
    const instances = new Map([['1', outer], ['5', instance(5, instance(3, outer))]])
    setupDruxtVueDevtools(app, channel, instances)
    channel.emit({ type: 'module:resolved', module: module('1', { component: 'DruxtRouter', candidates: ['DruxtRouterEntity'], wrapper: 'DruxtRouterEntity', status: 'ready' }) })
    channel.emit({ type: 'module:missing', module: module('5') })
    const payload: Record<string, unknown> = { inspectorId: 'druxt', filter: '' }
    api.handlers.tree!(payload)
    expect(payload.rootNodes).toMatchObject([{ id: '1', label: 'DruxtRouter', children: [{ id: '5', label: 'DruxtEntity', tags: [{ label: 'node · article · full' }, { label: 'default' }] }] }])

    const filtered: Record<string, unknown> = { inspectorId: 'druxt', filter: 'entity' }
    api.handlers.tree!(filtered)
    expect((filtered.rootNodes as { id: string }[]).map((node) => node.id)).toEqual(['1', '5'])
  })

  it('shows a selected module\'s candidates, wrapper, key, props, state and settings, and points at its component', () => {
    api.highlightElement.mockClear()
    const channel = createDruxtDevtools()
    const component = instance(7)
    setupDruxtVueDevtools(app, channel, new Map([['7', component]]))
    channel.emit({ type: 'module:missing', module: module('7', { key: 'DruxtEntity:abc', props: { uuid: 'abc' }, settings: { query: {} } }) })
    const payload: Record<string, unknown> = { inspectorId: 'druxt', nodeId: '7' }
    api.handlers.state!(payload)
    const state = payload.state as Record<string, { key: string, value: unknown }[]>
    expect(state.Module).toEqual(expect.arrayContaining([{ key: 'wrapper', value: 'Druxt\'s default' }, { key: 'key', value: 'DruxtEntity:abc' }]))
    expect(state['Candidates, most specific first']!.map((item) => item.value)).toEqual(module('7').candidates)
    expect(state.Props).toEqual([{ key: 'uuid', value: 'abc' }])
    expect(state.Settings).toEqual([{ key: 'query', value: {} }])
    expect(api.highlightElement).toHaveBeenCalledWith(component)
    // A refresh of the same selection does not point at it again.
    api.handlers.state!({ inspectorId: 'druxt', nodeId: '7' })
    expect(api.highlightElement).toHaveBeenCalledOnce()
  })

  it('adds the requests reported before it ran, the server render\'s labelled with its own clock', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'request', request: { id: 's1', kind: 'jsonapi', path: '/jsonapi', start: 41.6, duration: 8, source: 'network', side: 'server', status: 200 } })
    api.addTimelineEvent.mockClear()
    setupDruxtVueDevtools(app, channel, new Map())
    expect(api.addTimelineEvent.mock.calls.map(([options]) => options.event.title)).toEqual(['Server render, 42 ms: JSON:API /jsonapi'])
  })

  it('adds each request and restore to the timeline, titled by kind and path', () => {
    const channel = createDruxtDevtools()
    setupDruxtVueDevtools(app, channel, new Map())
    api.addTimelineEvent.mockClear()
    channel.emit({ type: 'request', request: { id: '1', kind: 'schema', path: '/api/_druxt/schema/node--article', start: 0, duration: 12.4, source: 'network', side: 'browser', status: 200 } })
    channel.emit({ type: 'module:restored', id: '3', component: 'DruxtEntity', key: 'DruxtEntity:abc' })
    expect(api.addTimelineEvent.mock.calls.map(([options]) => [options.layerId, options.event.title, options.event.subtitle])).toEqual([
      ['druxt', 'Schema /api/_druxt/schema/node--article', '200 12 ms'],
      ['druxt', 'Restore DruxtEntity', 'DruxtEntity:abc'],
    ])
  })

  it('shows a module\'s section as a node with its blocks as state, and its events on the timeline', () => {
    const channel = createDruxtDevtools()
    setupDruxtVueDevtools(app, channel, new Map())
    channel.emit({ type: 'section', section: { id: 'route', label: 'Route', blocks: [{ type: 'pairs', items: { path: '/about' } }, { type: 'table', title: 'Views', columns: ['view', 'results'], rows: [['recipes', 3]] }] } })
    const tree: Record<string, unknown> = { inspectorId: 'druxt', filter: '' }
    api.handlers.tree!(tree)
    expect(tree.rootNodes).toEqual([expect.objectContaining({ id: 'section:route', label: 'Route' })])
    const state: Record<string, unknown> = { inspectorId: 'druxt', nodeId: 'section:route' }
    api.handlers.state!(state)
    expect(state.state).toEqual({ 'Route 1': [{ key: 'path', value: '/about' }], 'Views': [{ key: 'recipes', value: { view: 'recipes', results: 3 } }] })
    api.addTimelineEvent.mockClear()
    channel.emit({ type: 'timeline', event: { id: 'e', label: 'views refetch', detail: 'filter changed', source: 'DruxtView', time: 3 } })
    expect(api.addTimelineEvent.mock.calls.map(([options]) => [options.event.title, options.event.subtitle])).toEqual([['DruxtView: views refetch', 'filter changed']])
  })
})
