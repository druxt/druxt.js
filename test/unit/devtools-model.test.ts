import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDruxtDevtools, sectionData, summaryCounts, watchDruxtDevtoolsSummary } from '../../packages/devtools/src'
import { module } from './devtools-fixtures'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

describe('the development tools\' model', () => {
  // Any import of a framework: from a specifier or a subpath, for its side effects, or dynamically.
  const FRAMEWORK = /(?:\bfrom|\bimport(?:\s*\()?)\s*['"`](?:vue|nuxt|h3|#app|#imports|@nuxt\/[\w-]+|@vue\/[\w-]+)(?:\/[^'"`]*)?['"`]/

  it('finds every form of a framework import', () => {
    for (const source of [
      `import { ref } from 'vue'`,
      `import type { App } from "vue"`,
      `import { useNuxtApp } from 'nuxt/app'`,
      `import 'h3'`,
      `import '@vue/runtime-dom'`,
      `const kit = await import('@nuxt/devtools-kit/iframe-client')`,
      'const { h } = await import(`vue`)',
      `export { defineNuxtPlugin } from '#app'`,
    ]) expect(source, source).toMatch(FRAMEWORK)
    for (const source of [`import { x } from './vue'`, `import { y } from 'vue-router'`, `// vue is not imported`]) expect(source, source).not.toMatch(FRAMEWORK)
  })

  it('imports nothing from Vue, Nuxt or h3', () => {
    const dir = join(root, 'packages/devtools/src')
    const files = readdirSync(dir, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) expect(readFileSync(file, 'utf8'), file).not.toMatch(FRAMEWORK)
  })

  it('keeps every module reported, and groups those rendering the default by component and candidates', () => {
    const devtools = createDruxtDevtools()
    devtools.emit({ type: 'module:missing', module: module('1') })
    devtools.emit({ type: 'module:missing', module: module('2') })
    devtools.emit({ type: 'module:resolved', module: module('3', { component: 'DruxtField', candidates: ['DruxtFieldBody'], wrapper: 'DruxtFieldBody', status: 'ready' }) })
    const snapshot = devtools.snapshot()
    expect(snapshot.modules.map((m) => m.id)).toEqual(['1', '2', '3'])
    expect(snapshot.missing).toEqual([{ component: 'DruxtEntity', entries: [expect.objectContaining({ count: 2, meta: 'node · article · full', candidates: module('1').candidates })] }])

    devtools.emit({ type: 'module:removed', id: '1' })
    expect(devtools.snapshot().missing[0]!.entries[0]!.count).toBe(1)
  })

  it('keeps one note of each kind on a module, including one that arrives first', () => {
    const devtools = createDruxtDevtools()
    devtools.emit({ type: 'module:note', id: '1', note: { kind: 'layout', title: 'Early' } })
    devtools.emit({ type: 'module:resolved', module: module('1', { status: 'ready' }) })
    expect(devtools.snapshot().modules[0]!.notes).toEqual([{ kind: 'layout', title: 'Early' }])
    devtools.emit({ type: 'module:note', id: '1', note: { kind: 'layout', title: 'Later', detail: 'More' } })
    expect(devtools.snapshot().modules[0]!.notes).toEqual([{ kind: 'layout', title: 'Later', detail: 'More' }])
  })

  it('keeps a module\'s notes when the host reports it again with none', () => {
    const devtools = createDruxtDevtools()
    devtools.emit({ type: 'module:missing', module: module('1') })
    devtools.emit({ type: 'module:note', id: '1', note: { kind: 'layout', title: 'Fallback' } })
    devtools.emit({ type: 'module:missing', module: module('1') })
    devtools.emit({ type: 'module:resolved', module: module('1', { status: 'ready', wrapper: 'DruxtEntityNodeArticle' }) })
    expect(devtools.snapshot().modules[0]!.notes).toEqual([{ kind: 'layout', title: 'Fallback' }])
  })

  it('replaces a keyed note rather than adding another, and clears it by its key', () => {
    const devtools = createDruxtDevtools()
    devtools.emit({ type: 'module:resolved', module: module('1', { status: 'ready' }) })
    devtools.emit({ type: 'module:note', id: '1', note: { kind: 'layout', key: 'layout:a', title: 'One' } })
    devtools.emit({ type: 'module:note', id: '1', note: { kind: 'layout', key: 'layout:b', title: 'Other' } })
    devtools.emit({ type: 'module:note', id: '1', note: { kind: 'layout', key: 'layout:a', title: 'One, again' } })
    expect(devtools.snapshot().modules[0]!.notes.map((note) => note.title)).toEqual(['Other', 'One, again'])
    devtools.emit({ type: 'module:note:removed', id: '1', key: 'layout:a' })
    devtools.emit({ type: 'module:resolved', module: module('1', { status: 'ready' }) })
    expect(devtools.snapshot().modules[0]!.notes.map((note) => note.title)).toEqual(['Other'])
  })

  it('holds notes for at most a hundred modules that have not reported, and drops them on a new page', () => {
    const devtools = createDruxtDevtools()
    devtools.emit({ type: 'page', path: '/one' })
    for (let i = 0; i <= 100; i++) devtools.emit({ type: 'module:note', id: `m${i}`, note: { kind: 'k', title: String(i) } })
    devtools.emit({ type: 'module:resolved', module: module('m0', { status: 'ready' }) })
    devtools.emit({ type: 'module:resolved', module: module('m100', { status: 'ready' }) })
    expect(devtools.snapshot().modules.map((m) => m.notes.length)).toEqual([0, 1])
    devtools.emit({ type: 'module:note', id: 'late', note: { kind: 'k', title: 'late' } })
    devtools.emit({ type: 'page', path: '/two' })
    devtools.emit({ type: 'module:resolved', module: module('late', { status: 'ready' }) })
    expect(devtools.snapshot().modules.find((m) => m.id === 'late')!.notes).toEqual([])
  })

  it('splits a quiet error\'s status from its detail, and drops it once it recovers', () => {
    const devtools = createDruxtDevtools()
    devtools.emit({ type: 'quiet', error: { id: 'a', component: 'DruxtEntity', summary: '403: Forbidden' } })
    devtools.emit({ type: 'quiet', error: { id: 'b', component: 'DruxtField', summary: 'field_x is not in the display.' } })
    expect(devtools.snapshot().quiet).toEqual([
      { id: 'a', component: 'DruxtEntity', status: '403', detail: 'Forbidden' },
      { id: 'b', component: 'DruxtField', detail: 'field_x is not in the display.' },
    ])
    devtools.emit({ type: 'quiet', error: { id: 'a', component: 'DruxtEntity', summary: null } })
    expect(devtools.snapshot().quiet.map((q) => q.id)).toEqual(['b'])
  })

  it('keeps a page\'s requests until the next page, and the settings as last reported', () => {
    const devtools = createDruxtDevtools()
    devtools.emit({ type: 'page', path: '/one' })
    devtools.emit({ type: 'request', request: { id: '1', kind: 'jsonapi', path: '/jsonapi', start: 0, duration: 12, source: 'network', side: 'server', status: 200 } })
    devtools.emit({ type: 'settings', settings: [{ key: 'debug', value: true, tier: 'site' }] })
    expect(devtools.snapshot()).toMatchObject({ page: '/one', requests: [{ id: '1' }], settings: [{ key: 'debug', tier: 'site' }] })
    devtools.emit({ type: 'page', path: '/one' })
    expect(devtools.snapshot().requests).toHaveLength(1)
    devtools.emit({ type: 'page', path: '/two' })
    expect(devtools.snapshot().requests).toEqual([])
  })

  it('calls each subscriber with the event once the snapshot has it, until it stops listening', () => {
    const devtools = createDruxtDevtools()
    const seen: string[] = []
    const stop = devtools.subscribe((event) => seen.push(`${event.type}:${devtools.snapshot().modules.length}`))
    devtools.emit({ type: 'module:missing', module: module('1') })
    stop()
    devtools.emit({ type: 'module:removed', id: '1' })
    expect(seen).toEqual(['module:missing:1'])
  })

  it('hands out a snapshot a subscriber cannot change the model through, and that survives JSON', () => {
    const devtools = createDruxtDevtools()
    const reported = module('1')
    devtools.emit({ type: 'module:missing', module: reported })
    reported.candidates.push('Changed')
    const snapshot = devtools.snapshot()
    snapshot.modules[0]!.component = 'Changed'
    expect(devtools.snapshot().modules[0]).toMatchObject({ component: 'DruxtEntity', candidates: module('1').candidates })
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot)
  })
})

describe('the model\'s module extensions', () => {
  it('keeps each module section\'s blocks, updated in place and removable, with its actions', async () => {
    const devtools = createDruxtDevtools()
    devtools.emit({ type: 'section', section: { id: 'route', label: 'Route', blocks: [{ type: 'pairs', items: { path: '/' } }] } })
    devtools.emit({ type: 'section', section: { id: 'views', label: 'Views', blocks: [] } })
    devtools.emit({ type: 'section', section: { id: 'route', label: 'Route', blocks: [{ type: 'pairs', items: { path: '/about' } }] } })
    const handler = vi.fn(() => 'Cleared.')
    const withdraw = devtools.registerAction({ id: 'views:clear', label: 'Clear the cache', section: 'views' }, handler)
    expect(devtools.snapshot().sections).toEqual([
      { id: 'route', label: 'Route', blocks: [{ type: 'pairs', items: { path: '/about' } }], actions: [] },
      { id: 'views', label: 'Views', blocks: [], actions: [{ id: 'views:clear', label: 'Clear the cache', section: 'views' }] },
    ])
    expect(await devtools.runAction('views:clear')).toBe('Cleared.')
    expect(handler).toHaveBeenCalledOnce()
    withdraw()
    await expect(devtools.runAction('views:clear')).rejects.toThrow('No Druxt devtools action "views:clear".')
    devtools.emit({ type: 'section:removed', id: 'views' })
    expect(devtools.snapshot().sections.map((section) => section.id)).toEqual(['route'])
  })

  it('keeps an action registered again with the same handler when the first registration is withdrawn', async () => {
    const devtools = createDruxtDevtools()
    devtools.emit({ type: 'section', section: { id: 'views', label: 'Views', blocks: [] } })
    const action = { id: 'views:clear', label: 'Clear the cache', section: 'views' }
    // One function shared by two registrations, as two instances of a component hand in a store's action.
    const handler = vi.fn(() => 'Cleared.')
    const first = devtools.registerAction(action, handler)
    const second = devtools.registerAction(action, handler)
    first()
    expect(devtools.snapshot().sections[0]!.actions).toEqual([action])
    expect(await devtools.runAction('views:clear')).toBe('Cleared.')
    second()
    expect(devtools.snapshot().sections[0]!.actions).toEqual([])
    await expect(devtools.runAction('views:clear')).rejects.toThrow('No Druxt devtools action "views:clear".')
  })

  it('keeps a page\'s timeline events until the next page', () => {
    const devtools = createDruxtDevtools()
    devtools.emit({ type: 'page', path: '/one' })
    devtools.emit({ type: 'timeline', event: { id: 'e1', label: 'views refetch', detail: 'filter changed', source: 'DruxtView', time: 12 } })
    expect(devtools.snapshot().timeline).toEqual([{ id: 'e1', label: 'views refetch', detail: 'filter changed', source: 'DruxtView', time: 12 }])
    devtools.emit({ type: 'page', path: '/two' })
    expect(devtools.snapshot().timeline).toEqual([])
  })
})

describe('the console summary', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  const out = () => ({ info: vi.fn(), group: vi.fn(), groupCollapsed: vi.fn(), groupEnd: vi.fn(), log: vi.fn() })

  it('prints the defaults in use per page in a collapsed group, and quiet errors apart in an open one', () => {
    const devtools = createDruxtDevtools()
    const console = out()
    watchDruxtDevtoolsSummary(devtools, { console })
    devtools.emit({ type: 'page', path: '/recipes' })
    devtools.emit({ type: 'module:missing', module: module('1') })
    devtools.emit({ type: 'quiet', error: { id: 'a', component: 'DruxtField', summary: '404: Not Found' } })
    vi.advanceTimersByTime(1000)
    expect(console.groupCollapsed).toHaveBeenCalledWith('Druxt: 1 default in use on /recipes')
    expect(console.group).toHaveBeenCalledWith('Druxt: 1 quiet error on /recipes')
    expect(console.log.mock.calls).toEqual([
      ['DruxtEntity (node · article · full) ×1 rendered Druxt\'s default. Looked for, most specific first: DruxtEntityNodeArticleFull, DruxtEntityNodeArticle, DruxtEntityDefault'],
      ['DruxtField failed quietly: 404 Not Found'],
    ])
    expect(console.groupEnd).toHaveBeenCalledTimes(2)

    // The same counts on the same page print nothing more.
    devtools.emit({ type: 'module:missing', module: module('2') })
    vi.advanceTimersByTime(1000)
    expect(console.groupCollapsed).toHaveBeenCalledOnce()
  })

  it('prints the quiet errors again when one changes, the count staying the same', () => {
    const devtools = createDruxtDevtools()
    const console = out()
    watchDruxtDevtoolsSummary(devtools, { console })
    devtools.emit({ type: 'page', path: '/recipes' })
    devtools.emit({ type: 'quiet', error: { id: 'a', component: 'DruxtField', summary: '403: Forbidden' } })
    vi.advanceTimersByTime(1000)
    devtools.emit({ type: 'quiet', error: { id: 'a', component: 'DruxtField', summary: '500: Internal Server Error' } })
    vi.advanceTimersByTime(1000)
    expect(console.group).toHaveBeenCalledTimes(2)
    expect(console.log.mock.calls).toEqual([['DruxtField failed quietly: 403 Forbidden'], ['DruxtField failed quietly: 500 Internal Server Error']])
    // The same error reported again prints nothing more.
    devtools.emit({ type: 'quiet', error: { id: 'a', component: 'DruxtField', summary: '500: Internal Server Error' } })
    vi.advanceTimersByTime(1000)
    expect(console.group).toHaveBeenCalledTimes(2)
  })

  it('leaves out the quiet errors\' group when there are none', () => {
    const devtools = createDruxtDevtools()
    const console = out()
    watchDruxtDevtoolsSummary(devtools, { console })
    for (const id of ['1', '2']) devtools.emit({ type: 'module:missing', module: module(id, { candidates: [`DruxtEntityType${id}`] }) })
    vi.advanceTimersByTime(1000)
    expect(console.groupCollapsed).toHaveBeenCalledWith('Druxt: 2 defaults in use')
    expect(console.group).not.toHaveBeenCalled()
  })

  it('points to DevTools in one line, again only when the counts change, and says nothing with nothing to report', () => {
    const devtools = createDruxtDevtools()
    const console = out()
    watchDruxtDevtoolsSummary(devtools, { console, open: 'Nuxt DevTools > Druxt' })
    devtools.emit({ type: 'module:resolved', module: module('0', { status: 'ready' }) })
    vi.advanceTimersByTime(1000)
    expect(console.info).not.toHaveBeenCalled()
    devtools.emit({ type: 'module:missing', module: module('1') })
    devtools.emit({ type: 'module:missing', module: module('2', { candidates: ['DruxtEntityNodePageFull'] }) })
    vi.advanceTimersByTime(1000)
    expect(console.info).toHaveBeenCalledWith('Druxt: 2 defaults in use. Open Nuxt DevTools > Druxt.')
    devtools.emit({ type: 'page', path: '/other' })
    vi.advanceTimersByTime(1000)
    expect(console.info).toHaveBeenCalledOnce()
    expect(console.groupCollapsed).not.toHaveBeenCalled()
  })

  it('prints nothing for module sections alone, and logs them in the defaults group when there is one', () => {
    const devtools = createDruxtDevtools()
    const console = out()
    watchDruxtDevtoolsSummary(devtools, { console })
    devtools.emit({ type: 'page', path: '/about' })
    devtools.emit({ type: 'section', section: { id: 'route', label: 'Route', blocks: [{ type: 'pairs', items: { 'path': '/about', 'entity type': 'node--page' } }] } })
    devtools.emit({ type: 'module:resolved', module: module('1', { status: 'ready' }) })
    vi.advanceTimersByTime(1000)
    expect(console.groupCollapsed).not.toHaveBeenCalled()
    expect(console.log).not.toHaveBeenCalled()
    devtools.emit({ type: 'module:missing', module: module('2') })
    vi.advanceTimersByTime(1000)
    expect(console.groupCollapsed).toHaveBeenCalledWith('Druxt: 1 default in use on /about')
    expect(console.log).toHaveBeenCalledWith('Route:', { 'path': '/about', 'entity type': 'node--page' })
  })

  it('gives a section\'s data as a table\'s rows or each block by title', () => {
    expect(sectionData({ blocks: [{ type: 'table', columns: ['name', 'count'], rows: [['a', 1]] }] })).toEqual([{ name: 'a', count: 1 }])
    expect(sectionData({ blocks: [{ type: 'tree', title: 'Query', value: { a: 1 } }, { type: 'pairs', items: { b: 2 } }] })).toEqual({ Query: { a: 1 }, 2: { b: 2 } })
  })

  it('counts entries, not instances', () => {
    const devtools = createDruxtDevtools()
    for (const id of ['1', '2', '3']) devtools.emit({ type: 'module:missing', module: module(id) })
    expect(summaryCounts(devtools.snapshot())).toBe('1 default in use')
    devtools.emit({ type: 'quiet', error: { id: 'q', component: 'DruxtField', summary: '403: Forbidden' } })
    expect(summaryCounts(devtools.snapshot())).toBe('1 default in use, 1 quiet error')
  })
})
