// @vitest-environment happy-dom
// No Vue and no Nuxt: a host that emits the model's events and embeds the element, as a React or Next.js host would.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { DRUXT_DEVTOOLS_SECTION_EVENT, DRUXT_DEVTOOLS_TAG, createDruxtDevtools, defineDruxtDevtoolsElement } from '../../packages/devtools/src'
import type { DruxtDevtoolsElement, DruxtDevtoolsRequest, DruxtDevtoolsSource } from '../../packages/devtools/src'
import { DRUXT_API_BASE } from '../../packages/core/src/routes'
import { module, template } from './devtools-fixtures'

beforeAll(() => { defineDruxtDevtoolsElement() })
afterEach(() => { document.body.replaceChildren() })

/** The element, connected to a channel, in the page. */
const mount = (channel: DruxtDevtoolsSource = createDruxtDevtools(), section?: string): DruxtDevtoolsElement => {
  const element = document.createElement(DRUXT_DEVTOOLS_TAG) as DruxtDevtoolsElement
  if (section) element.setAttribute('section', section)
  document.body.append(element)
  element.connect(channel)
  return element
}
const $ = (element: DruxtDevtoolsElement, selector: string) => element.shadowRoot!.querySelector<HTMLElement>(selector)
const $$ = (element: DruxtDevtoolsElement, selector: string) => [...element.shadowRoot!.querySelectorAll<HTMLElement>(selector)]
const text = (node: Element | null | undefined) => (node?.textContent || '').replace(/\s+/g, ' ').trim()
/** Lets a scheduled render run. */
const frame = () => new Promise((resolve) => setTimeout(resolve, 30))

const request = (id: string, overrides: Partial<DruxtDevtoolsRequest> = {}): DruxtDevtoolsRequest => ({ id, kind: 'jsonapi', path: `/jsonapi/node/article/${id}`, start: 0, duration: 40, source: 'network', side: 'browser', status: 200, ...overrides })

describe('<druxt-devtools>, with no framework', () => {
  it('renders from the events a host emits, and again as they arrive', async () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'page', path: '/en/articles/pasta' })
    const element = mount(channel)
    expect(element.shadowRoot!.mode).toBe('open')
    expect(text($(element, '.dt-nav > .dt-page'))).toBe('/en/articles/pasta')
    expect(text($(element, '.dt-empty-title'))).toBe('No missing wrappers')
    channel.emit({ type: 'module:missing', module: module('1', { templates: [template('DruxtEntityNodeArticleFull')] }) })
    await frame()
    expect(text($(element, '.dt-group'))).toBe('DruxtEntity · 1')
    expect(text($(element, '#dt-tab-missing .dt-count'))).toBe('1')
  })

  it('has the nav and panel parts, the five sections as ARIA tabs, and its styles in its shadow root only', () => {
    const element = mount()
    expect($(element, '[part="nav"]')).not.toBeNull()
    expect($(element, '[part="panel"]')!.getAttribute('role')).toBe('tabpanel')
    expect($$(element, '[role="tab"]').map((tab) => text(tab.querySelector('.dt-long')))).toEqual(['Missing wrappers', 'Quiet errors', 'Modules', 'Requests', 'Settings'])
    expect($$(element, '[role="tab"]').map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false', 'false'])
    expect($(element, '[role="tabpanel"]')!.getAttribute('aria-labelledby')).toBe('dt-tab-missing')
    const css = text($(element, 'style'))
    expect(css).toContain(':host { all: initial;')
    expect(css).toContain('--dt-ink: var(--druxt-ink, #16212b)')
    expect(css).toContain('--druxt-mark-ink: #2f495e')
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \.dt-spinner \{ animation: none; \}/)
    expect(css).toContain('@container (width < 600px)')
    expect(document.head.querySelector('style')).toBeNull()
  })

  it('moves between sections with the arrows, Home and End, and tells the host', () => {
    const element = mount()
    const sections: string[] = []
    element.addEventListener(DRUXT_DEVTOOLS_SECTION_EVENT, (event) => sections.push((event as CustomEvent).detail.section))
    const key = (name: string) => $(element, '[role="tablist"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }))
    key('ArrowDown')
    expect(element.section).toBe('quiet')
    expect(element.shadowRoot!.activeElement?.id).toBe('dt-tab-quiet')
    key('End')
    expect(element.getAttribute('section')).toBe('settings')
    key('ArrowRight')
    expect(element.section).toBe('missing')
    key('ArrowLeft')
    key('Home')
    expect(sections).toEqual(['quiet', 'settings', 'missing', 'settings', 'missing'])
    $(element, '#dt-tab-modules')!.click()
    expect(element.section).toBe('modules')
    expect($(element, '[role="tabpanel"]')!.id).toBe('dt-modules')
  })

  it('follows a theme attribute, and takes its section from one', () => {
    const element = mount(undefined, 'requests')
    element.setAttribute('theme', 'dark')
    expect(element.section).toBe('requests')
    expect(text($(element, 'h2'))).toBe('Requests')
    expect(text($(element, 'style'))).toContain(':host([theme="dark"])')
  })

  it('says it is waiting with no channel, in the host\'s words when it gives them', async () => {
    const element = document.createElement(DRUXT_DEVTOOLS_TAG) as DruxtDevtoolsElement
    document.body.append(element)
    expect($(element, '[role="status"]')!.textContent).toBe('Waiting for the app to connect.')
    element.setAttribute('waiting-text', 'Open this from the Druxt tab in Nuxt DevTools.')
    await frame()
    expect($(element, '[role="status"]')!.textContent).toBe('Open this from the Druxt tab in Nuxt DevTools.')
    element.waitingText = 'Open the Druxt panel.'
    await frame()
    expect($(element, '[role="status"]')!.textContent).toBe('Open the Druxt panel.')
  })
})

describe('the sections\' states', () => {
  it('shows each section\'s empty state, and Settings with none', () => {
    const empties = (['missing', 'quiet', 'modules', 'requests'] as const).map((section) => text($(mount(undefined, section), '.dt-empty-title')))
    expect(empties).toEqual(['No missing wrappers', 'No quiet errors', 'No Druxt modules on this page', 'No requests yet'])
    expect($(mount(undefined, 'settings'), '.dt-empty')).toBeNull()
  })

  it('opens one missing wrapper, with its candidates, the docs link and the create action', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'module:missing', module: module('1', { templates: [template('DruxtEntityNodeArticleFull'), template('DruxtEntityNodeArticle')] }) })
    const element = mount(channel)
    const entry = $(element, 'details.dt-entry') as HTMLDetailsElement
    expect(entry.open).toBe(true)
    expect(text(entry.querySelector('.dt-name'))).toBe('node · article · full')
    expect(text(entry.querySelector('.dt-count'))).toBe('×1')
    expect([...entry.querySelectorAll('.dt-candidates li')].map(text)).toEqual(['DruxtEntityNodeArticleFull', 'DruxtEntityNodeArticle', 'DruxtEntityDefault'])
    expect(entry.querySelector('a')!.getAttribute('href')).toBe('https://druxtjs.org/explanation/component-resolution')
    expect($(element, '.dt-filter')).toBeNull()
    expect($(element, '.dt-foot')).toBeNull()
    const create = $(element, '.dt-create')!
    expect(create.dataset.state).toBe('idle')
    expect(text(create.querySelector('.dt-path'))).toBe('components/druxt/entity/NodeArticleFull.vue')
    // With no endpoint, the starter is offered to copy, and nothing to post.
    expect(create.querySelector('button')).toBeNull()
  })

  it('past six entries, offers a filter, closes every entry, and totals the instances', async () => {
    const channel = createDruxtDevtools()
    for (let i = 0; i < 8; i++) channel.emit({ type: 'module:missing', module: module(String(i), { component: i < 2 ? 'DruxtEntity' : 'DruxtField', candidates: [i < 2 ? `DruxtEntityType${i}` : `DruxtFieldName${i}`] }) })
    channel.emit({ type: 'module:missing', module: module('extra', { component: 'DruxtField', candidates: ['DruxtFieldName7'] }) })
    const element = mount(channel)
    expect($$(element, '.dt-group').map(text)).toEqual(['DruxtEntity · 2', 'DruxtField · 6'])
    expect($$(element, 'details').every((entry) => !(entry as HTMLDetailsElement).open)).toBe(true)
    expect(text($(element, '.dt-foot'))).toBe('9 instances in 8 entries')
    const input = $(element, '.dt-filter input') as HTMLInputElement
    expect(input.getAttribute('aria-label')).toBe('Filter 8 entries')
    input.focus()
    input.value = 'name7'
    input.dispatchEvent(new Event('input'))
    expect($$(element, '.dt-name').map(text)).toEqual(['name7'])
    expect(text($(element, '[aria-live="polite"]'))).toBe('1 entry shown')
    // The filter keeps focus through the render.
    expect(element.shadowRoot!.activeElement).toBe($(element, '.dt-filter input'))
    const again = $(element, '.dt-filter input') as HTMLInputElement
    again.value = 'nothing'
    again.dispatchEvent(new Event('input'))
    expect(text($(element, '.dt-nomatch'))).toBe('No entries match “nothing”')
  })

  it('lists quiet errors with their status apart', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'quiet', error: { id: 'a', component: 'DruxtEntity', summary: '404: Not Found' } })
    channel.emit({ type: 'quiet', error: { id: 'b', component: 'DruxtField', summary: 'fetch failed' } })
    const element = mount(channel, 'quiet')
    expect($$(element, '.dt-row').map((row) => [text(row.querySelector('code')), text(row.querySelector('.dt-status')), text(row.querySelector('.dt-detail'))])).toEqual([['DruxtEntity', '404', 'Not Found'], ['DruxtField', '', 'fetch failed']])
    expect(text($(element, '#dt-tab-quiet .dt-count'))).toBe('2')
  })

  it('lists modules with their status, wrapper and key, and opens to candidates, props, state, settings and notes', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'module:resolved', module: module('1', { wrapper: 'DruxtEntityNodeArticle', status: 'ready', key: 'DruxtEntity:abc', props: { uuid: 'abc' }, state: { model: 'node--article abc' }, settings: { query: { fields: [] } }, schema: 'node--article--full--view', notes: [{ kind: 'layout-builder-fallback', title: 'Rendered the display without its layout.' }] }) })
    channel.emit({ type: 'module:missing', module: module('2') })
    channel.emit({ type: 'module:resolved', module: module('3', { status: 'error', statusCode: 403, error: '403: Forbidden', quiet: true }) })
    const element = mount(channel, 'modules')
    const rows = $$(element, 'details.dt-module')
    expect(rows.map((row) => text(row.querySelector('.dt-state')))).toEqual(['ready', 'default', '403'])
    expect(rows.map((row) => row.querySelector('.dt-state')!.className)).toEqual(['dt-state dt-tone-ready', 'dt-state dt-tone-default', 'dt-state dt-tone-error'])
    expect(text(rows[0]!.querySelector('.dt-wrapper'))).toBe('DruxtEntityNodeArticle · DruxtEntity:abc')
    const body = text(rows[0]!.querySelector('.dt-entry-body'))
    for (const part of ['Candidates', 'uuid', 'abc', 'node--article--full--view', 'query', '{"fields":[]}', 'Rendered the display without its layout.']) expect(body).toContain(part)
    expect(rows[0]!.querySelector('.dt-note')!.getAttribute('data-kind')).toBe('layout-builder-fallback')
    expect(rows[0]!.querySelector('.dt-note')!.getAttribute('data-key')).toBe('layout-builder-fallback')
    expect(text($(element, '.dt-foot'))).toBe('3 modules · 1 with your wrapper · 1 default in use · 1 quiet error')
  })

  it('marks a request Drupal answered partially, with Drupal\'s reason', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'request', request: request('1', { partial: 'Some resources have been omitted because of insufficient authorization.' }) })
    channel.emit({ type: 'request', request: request('2') })
    const rows = $$(mount(channel, 'requests'), '.dt-request')
    expect(rows.map((row) => text(row.querySelector('.dt-source')))).toEqual(['Network, partial: Some resources have been omitted because of insufficient authorization.', 'Network'])
    expect(rows.map((row) => row.querySelector('.dt-source')!.className)).toEqual(['dt-source dt-partial', 'dt-source'])
  })

  it('labels the server render\'s requests when they are the only ones', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'request', request: request('1', { side: 'server', start: 0, duration: 100 }) })
    expect($$(mount(channel, 'requests'), '.dt-group').map(text)).toEqual(['Server render'])
  })

  it('names the page a server render\'s requests were made for', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'request', request: request('1', { side: 'server', start: 0, duration: 100, page: '/en/recipes' }) })
    expect($$(mount(channel, 'requests'), '.dt-group').map(text)).toEqual(['Server render of /en/recipes'])
  })

  it('draws requests on a time axis per side, with the store\'s apart', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'request', request: request('1', { side: 'server', start: 0, duration: 100 }) })
    channel.emit({ type: 'request', request: request('2', { side: 'server', start: 100, duration: 100, status: 404, kind: 'schema', path: `${DRUXT_API_BASE}/schema/node--x` }) })
    channel.emit({ type: 'request', request: request('3', { start: 5, duration: 0, source: 'store', status: undefined, kind: 'date-formats' }) })
    const element = mount(channel, 'requests')
    expect($$(element, '.dt-group').map(text)).toEqual(['Server render', 'Browser'])
    expect($$(element, '.dt-axis span').slice(0, 3).map(text)).toEqual(['0 ms', '100', '200 ms'])
    const rows = $$(element, '.dt-request')
    expect(rows.map((row) => text(row.querySelector('.dt-kind')))).toEqual(['JSON:API', 'Schema', 'Date format'])
    expect(rows.map((row) => text(row.querySelector('.dt-timing')))).toEqual(['200 100 ms', '404 100 ms', 'store'])
    expect(rows.map((row) => row.querySelector('.dt-bar')!.getAttribute('class'))).toEqual(['dt-bar', 'dt-bar dt-bar-error', 'dt-bar dt-bar-store'])
    expect(rows[1]!.querySelector('.dt-bar')!.getAttribute('style')).toBe('left:50.00%;width:50.00%')
    expect(rows.map((row) => text(row.querySelector('.dt-source')))).toEqual(['Network', 'Network', 'Already in the store'])
    expect(text($(element, '.dt-foot'))).toBe('3 requests · 1 from the store · 200 ms on the network')
  })

  it('lists settings with the tier each came from, and a legend of counts', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'settings', settings: [{ key: 'baseUrl', value: 'https://cms.test', tier: 'site' }, { key: 'router.wildcard', value: true, tier: 'drupal' }, { key: 'develMessages', value: 'devtools', tier: 'default' }] })
    const element = mount(channel, 'settings')
    expect($$(element, '.dt-legend .dt-chip').map(text)).toEqual(['site config 1', 'Drupal 1', 'module default 1'])
    expect($$(element, '.dt-setting').map((row) => [...row.children].map(text))).toEqual([
      ['baseUrl', 'https://cms.test', 'site config'],
      ['router.wildcard', 'true', 'Drupal'],
      ['develMessages', 'devtools', 'module default'],
    ])
  })
})

describe('a module\'s section', () => {
  const setup = () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'section', section: { id: 'route', label: 'Route', blocks: [
      { type: 'pairs', title: 'Current', items: { 'path': '/about', 'entity type': 'node--page' } },
      { type: 'table', columns: ['view', 'results'], rows: [['recipes', 3]] },
      { type: 'tree', title: 'Query', value: { filter: { status: 1 }, sort: ['-created'] } },
    ] } })
    return channel
  }

  it('gets a tab after the built-in sections, and renders its data, with no markup of the module\'s own', () => {
    const element = mount(setup(), 'x-route')
    expect($$(element, '[role="tab"]').map((tab) => text(tab.querySelector('.dt-long')))).toEqual(['Missing wrappers', 'Quiet errors', 'Modules', 'Requests', 'Settings', 'Route'])
    expect(text($(element, 'h2'))).toBe('Route')
    expect(text($(element, '.dt-block .dt-caption'))).toBe('Current')
    expect($$(element, '.dt-pairs dt').map(text)).toEqual(['path', 'entity type'])
    expect($$(element, '.dt-table th').map(text)).toEqual(['view', 'results'])
    expect($$(element, '.dt-table td').map(text)).toEqual(['recipes', '3'])
    expect($$(element, '.dt-tree-key').map(text)).toEqual(['filter', 'status', 'sort', '0'])
  })

  it('renders a value as text, never as markup', () => {
    const channel = createDruxtDevtools()
    const html = '<img src=x onerror=alert(1)>'
    channel.emit({ type: 'section', section: { id: 'x', label: html, blocks: [
      { type: 'pairs', title: html, items: { [html]: html } },
      { type: 'table', columns: [html], rows: [[html]] },
      { type: 'tree', value: { [html]: [html] } },
    ] } })
    const element = mount(channel, 'x-x')
    expect(element.shadowRoot!.querySelector('img')).toBeNull()
    expect($$(element, '.dt-pairs dd').map(text)).toEqual([html])
    expect($$(element, '.dt-table td').map(text)).toEqual([html])
    expect(text($(element, 'h2'))).toBe(html)
  })

  it('finds its tab again by an id that needs escaping in a selector', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'section', section: { id: 'views:recipes-1', label: 'Recipes', blocks: [] } })
    const element = mount(channel, 'settings')
    $(element, '[role="tablist"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(element.shadowRoot!.activeElement?.id).toBe('dt-tab-x-views:recipes-1')
  })

  it('is reached with the arrows like the others, and falls back once it has gone', async () => {
    const channel = setup()
    const element = mount(channel, 'settings')
    $(element, '[role="tablist"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(element.section).toBe('x-route')
    channel.emit({ type: 'section:removed', id: 'route' })
    await frame()
    expect($(element, '[role="tabpanel"]')!.id).toBe('dt-missing')
  })

  it('shows its actions when the host can run them, busy, then done or failed', async () => {
    const channel = setup()
    let finish: (value: string) => void = () => {}
    channel.registerAction({ id: 'route:reload', label: 'Fetch again', section: 'route' }, () => new Promise<string>((resolve) => { finish = resolve }))
    channel.registerAction({ id: 'route:fail', label: 'Fail', section: 'route' }, () => { throw new Error('No route.') })
    expect($(mount({ snapshot: channel.snapshot }, 'x-route'), '.dt-actions')).toBeNull()
    document.body.replaceChildren()
    const element = mount(channel, 'x-route')
    const buttons = () => $$(element, '.dt-action button')
    expect(buttons().map(text)).toEqual(['Fetch again', 'Fail'])
    buttons()[0]!.click()
    await frame()
    expect($(element, '.dt-action')!.dataset.state).toBe('busy')
    finish('Fetched.')
    await frame()
    expect(text($(element, '.dt-action [role="status"]'))).toBe('Fetched.')
    buttons()[1]!.click()
    await frame()
    expect(text($(element, '.dt-action [role="alert"]'))).toBe('No route.')
  })

  it('starts each connection with its actions idle, and shows nothing from an action the last one started', async () => {
    const first = setup()
    let finish: (value: string) => void = () => {}
    first.registerAction({ id: 'route:reload', label: 'Fetch again', section: 'route' }, () => new Promise<string>((resolve) => { finish = resolve }))
    const element = mount(first, 'x-route')
    $(element, '.dt-action button')!.click()
    await frame()
    expect($(element, '.dt-action')!.dataset.state).toBe('busy')

    // Another app's channel, with an action of the same id.
    const second = setup()
    second.registerAction({ id: 'route:reload', label: 'Fetch again', section: 'route' }, () => 'Second.')
    element.connect(second)
    expect($(element, '.dt-action')!.dataset.state).toBe('idle')
    expect($(element, '.dt-action button')!.hasAttribute('disabled')).toBe(false)

    // The first channel's action answers late: nothing of it shows.
    finish('First.')
    await frame()
    expect($(element, '.dt-action')!.dataset.state).toBe('idle')
    expect($(element, '.dt-action .dt-result')).toBeNull()
  })

  it('keeps a list where it was scrolled to as events arrive, and starts another section\'s at the top', async () => {
    const channel = setup()
    const element = mount(channel, 'x-route')
    $(element, '.dt-list')!.scrollTop = 120
    $(element, '.dt-list')!.scrollLeft = 8
    const before = $(element, '.dt-list')
    channel.emit({ type: 'request', request: request('1') })
    await frame()
    expect($(element, '.dt-list')).not.toBe(before)
    expect($(element, '.dt-list')!.scrollTop).toBe(120)
    expect($(element, '.dt-list')!.scrollLeft).toBe(8)
    element.section = 'requests'
    await frame()
    expect($(element, '.dt-list')!.scrollTop).toBe(0)
  })

  it('takes a withdrawn action away', async () => {
    const channel = setup()
    const withdraw = channel.registerAction({ id: 'route:reload', label: 'Fetch again', section: 'route' }, () => {})
    const element = mount(channel, 'x-route')
    expect($$(element, '.dt-action button').map(text)).toEqual(['Fetch again'])
    withdraw()
    await frame()
    expect($(element, '.dt-actions')).toBeNull()
    expect(channel.snapshot().sections[0]!.actions).toEqual([])
  })

  it('lists module events beside the requests', () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'timeline', event: { id: 'e', label: 'views refetch', detail: 'filter changed', source: 'DruxtView', time: 41.6 } })
    const element = mount(channel, 'requests')
    expect(text($(element, '.dt-group'))).toBe('Module events')
    expect([...$(element, '.dt-event')!.children].map(text)).toEqual(['DruxtView views refetch', '42 ms', 'filter changed'])
  })
})

describe('the create action\'s states', () => {
  // The route the host gives the element, as core's development plugin does.
  const createEndpoint = `${DRUXT_API_BASE}/template`
  const setup = () => {
    const channel = createDruxtDevtools()
    channel.emit({ type: 'module:missing', module: module('1', { templates: [template('DruxtEntityNodeArticleFull'), template('DruxtEntityNodeArticle')] }) })
    const element = mount(channel)
    element.createEndpoint = createEndpoint
    element.render()
    return element
  }
  afterEach(() => { vi.unstubAllGlobals() })

  it('previews the chosen name\'s path, busy while it posts, then done, and opens the file', async () => {
    let answer: (response: Response) => void = () => {}
    const fetch = vi.fn(() => new Promise<Response>((resolve) => { answer = resolve }))
    vi.stubGlobal('fetch', fetch)
    const element = setup()
    const opened: string[] = []
    element.openInEditor = (file) => opened.push(file)
    const select = $(element, '.dt-create select') as HTMLSelectElement
    expect($(element, '.dt-create label')!.getAttribute('for')).toBe(select.id)
    select.value = 'DruxtEntityNodeArticle'
    select.dispatchEvent(new Event('change'))
    expect(text($(element, '.dt-path'))).toBe('components/druxt/entity/NodeArticle.vue')
    $(element, '.dt-create button')!.click()
    await frame()
    expect($(element, '.dt-create')!.dataset.state).toBe('busy')
    expect($(element, '.dt-create')!.getAttribute('aria-busy')).toBe('true')
    expect(text($(element, '.dt-create button'))).toBe('Creating')
    expect($(element, '.dt-spinner')).not.toBeNull()
    // The preview stays while busy, so nothing shifts until the outcome replaces it.
    expect($(element, '.dt-preview')).not.toBeNull()
    expect(fetch).toHaveBeenCalledWith(createEndpoint, expect.objectContaining({ method: 'POST', body: JSON.stringify({ component: 'DruxtEntity', name: 'DruxtEntityNodeArticle' }) }))
    answer(new Response(JSON.stringify({ file: '/app/components/druxt/entity/NodeArticle.vue' }), { status: 200 }))
    await frame()
    expect($(element, '.dt-create')!.dataset.state).toBe('done')
    expect(text($(element, '[role="status"]'))).toBe('Created components/druxt/entity/NodeArticle.vue. Hot reload will swap it in.')
    expect($(element, '.dt-preview')).toBeNull()
    expect(opened).toEqual(['/app/components/druxt/entity/NodeArticle.vue'])
  })

  it('announces a refusal off localhost as an alert, says what to do, and offers to copy', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ statusMessage: 'The template tool answers this machine only.' }), { status: 403 })))
    const element = setup()
    $(element, '.dt-create button')!.click()
    await frame()
    expect($(element, '.dt-create')!.dataset.state).toBe('refused')
    expect(text($(element, '[role="alert"]'))).toBe('Not created. Wrapper files are only written when the dev server runs on localhost. Create the file yourself at components/druxt/entity/NodeArticleFull.vue.')
    expect(text($(element, '.dt-button-secondary'))).toBe('Copy path and starter')
  })

  it('leaves out making the file by hand when the name exists', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ statusMessage: 'The file exists already.' }), { status: 409 })))
    const element = setup()
    $(element, '.dt-create button')!.click()
    await frame()
    expect(text($(element, '[role="alert"]'))).toBe('Not created. The file exists already.')
    expect($(element, '.dt-button-secondary')).toBeNull()
  })

  it('shows the starter selected to copy by hand when the clipboard refuses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const element = setup()
    $(element, '.dt-create button')!.click()
    await frame()
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Denied')) } })
    $(element, '.dt-button-secondary')!.click()
    await frame()
    expect(text($(element, '.dt-button-secondary'))).toBe('Copy unavailable: select and copy below')
    expect($(element, 'pre[data-select]')!.getAttribute('aria-label')).toBe('Starter for components/druxt/entity/NodeArticleFull.vue, selected to copy')
  })
})
