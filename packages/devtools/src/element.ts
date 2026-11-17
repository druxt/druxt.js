import { DRUXT_MARK_PATHS, druxtMonoMark } from './icon'
import { DRUXT_DEVTOOLS_SECTIONS, describeCandidate, noteKey } from './model'
import type { DruxtDevtoolsBlock, DruxtDevtoolsChannel, DruxtDevtoolsModule, DruxtDevtoolsModuleSection, DruxtDevtoolsRequest, DruxtDevtoolsSection, DruxtDevtoolsSnapshot, DruxtDevtoolsTemplate, DruxtDevtoolsTier } from './model'
import { DRUXT_DEVTOOLS_CSS } from './utils/styles'

/** The element's tag. */
export const DRUXT_DEVTOOLS_TAG = 'druxt-devtools'

/** The event the element dispatches when its section changes. A host can use it to keep the section in the tab's URL. */
export const DRUXT_DEVTOOLS_SECTION_EVENT = 'druxt-devtools-section'

/**
 * What the element reads: a channel, or a fixed snapshot.
 *
 * Without `subscribe`, the element gets no updates. Without `runAction`, it offers no actions.
 */
export type DruxtDevtoolsSource = Pick<DruxtDevtoolsChannel, 'snapshot'> & Partial<Pick<DruxtDevtoolsChannel, 'subscribe' | 'runAction'>>

/**
 * Gets the tab key of a module's section.
 *
 * The key is the section's id with an `x-` prefix, so it never clashes with a built-in section.
 *
 * @param id - The section's id.
 * @returns The key.
 */
export const moduleSectionKey = (id: string): string => `x-${id}`

/** The element's public interface. */
export interface DruxtDevtoolsElement extends HTMLElement {
  /**
   * The section shown, as the `section` attribute sets it.
   *
   * It is a built-in section, or the key of a module's section, `x-<id>`. Any other value reads as `missing`.
   */
  section: string
  /**
   * The URL the create action posts a file's request to.
   *
   * Without one, the element has no Create button. It shows the file's path and starter, to copy by hand.
   */
  createEndpoint: string | null
  /** Opens a created file in the developer's editor, when the host can. */
  openInEditor: ((file: string) => void) | null
  /** The text the element shows before a host connects it, as the `waiting-text` attribute sets it. */
  waitingText: string
  /**
   * The documentation links. `wrappers` explains wrapper names, and `quiet` explains quiet failures.
   *
   * A link that is left out is not shown.
   */
  links: { wrappers?: string, quiet?: string }
  /** Reads a channel, and renders again on each of its events. */
  connect: (source: DruxtDevtoolsSource) => void
  /** Stops reading the channel. */
  disconnect: () => void
  /** Renders now, without waiting for the next frame. */
  render: () => void
}

type CreateState = 'idle' | 'busy' | 'done' | 'refused'
interface ActionUi { state: 'idle' | 'busy' | 'done' | 'failed', message: string }
interface CreateUi { name: string, state: CreateState, message: string, byHand: boolean, copied: 'idle' | 'copied' | 'manual' }
type Child = Node | string | false | null | undefined | Child[]

const LABELS: Record<DruxtDevtoolsSection, [long: string, short: string]> = {
  missing: ['Missing wrappers', 'Missing'],
  quiet: ['Quiet errors', 'Quiet'],
  modules: ['Modules', 'Modules'],
  requests: ['Requests', 'Requests'],
  settings: ['Settings', 'Settings'],
}
const KINDS: Record<DruxtDevtoolsRequest['kind'], string> = { 'jsonapi': 'JSON:API', 'schema': 'Schema', 'date-formats': 'Date format', 'other': 'Other' }
const TIERS: Record<DruxtDevtoolsTier, string> = { site: 'site config', drupal: 'Drupal', default: 'module default' }
const REFUSED_HOST = 'Wrapper files are only written when the dev server runs on localhost.'

/** A list with more entries than this offers a filter. */
const MANY = 6

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`
const isSection = (value: unknown): value is DruxtDevtoolsSection => DRUXT_DEVTOOLS_SECTIONS.includes(value as DruxtDevtoolsSection)

/** Escapes a string for use in a CSS selector. It uses the window's `CSS.escape` when the window has one. */
const cssEscape = (win: (Window & typeof globalThis) | null, value: string): string =>
  win?.CSS?.escape ? win.CSS.escape(value) : value.replace(/[^\w-]/g, (character) => `\\${character}`)
const isTree = (value: unknown): value is Record<string, unknown> | unknown[] => !!value && typeof value === 'object'

/** Shows a value in one line, for a list of keys and values. JSON longer than 120 characters is cut short. */
const show = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value === undefined) return 'undefined'
  const json = JSON.stringify(value)
  return json && json.length > 120 ? `${json.slice(0, 117)}...` : String(json)
}

const icons = {
  chevron: '<svg class="dt-chevron" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4l4 4-4 4"/></svg>',
  down: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>',
  search: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>',
  spinner: '<svg class="dt-spinner" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8" cy="8" r="5.5" opacity="0.35"/><path d="M8 2.5a5.5 5.5 0 0 1 5.5 5.5" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>',
  alert: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5M8 11h0"/></svg>',
  // The coloured mark, for the title. Its blue and green are fixed, and its ink follows the theme.
  mark: `<svg viewBox="0 0 452 342" width="20" height="15" aria-hidden="true"><path fill="#3498db" d="${DRUXT_MARK_PATHS[0]}"/><path fill="#108775" d="${DRUXT_MARK_PATHS[1]}"/><path fill="var(--druxt-mark-ink)" d="${DRUXT_MARK_PATHS[2]}"/></svg>`,
}

/**
 * Defines `<druxt-devtools>` in a window, and returns its class.
 *
 * The element is defined once for each window. A second call returns the class already defined.
 *
 * The element is plain DOM in an open shadow root. It uses no framework, so any host can embed it. It takes a channel
 * through `connect()`, and renders the five sections from the channel's snapshot.
 *
 * Each window has its own element registry. So a host passes the window to define the element in, such as a DevTools
 * frame's window.
 *
 * @param win - The window to define it in. The default is the current window.
 * @returns The element's class.
 *
 * @example
 * defineDruxtDevtoolsElement()
 * const tools = document.createElement('druxt-devtools')
 * document.body.append(tools)
 * tools.connect(createDruxtDevtools())
 */
export function defineDruxtDevtoolsElement(win: Window & typeof globalThis = window): CustomElementConstructor {
  const defined = win.customElements.get(DRUXT_DEVTOOLS_TAG)
  if (defined) return defined

  class DruxtDevtools extends win.HTMLElement implements DruxtDevtoolsElement {
    static get observedAttributes(): string[] {
      return ['section', 'theme', 'waiting-text']
    }

    createEndpoint: string | null = null
    openInEditor: ((file: string) => void) | null = null
    links: { wrappers?: string, quiet?: string } = { wrappers: 'https://druxtjs.org/explanation/component-resolution' }

    private source: DruxtDevtoolsSource | undefined
    private unsubscribe: (() => void) | undefined
    private scheduled = false
    private filters: Partial<Record<DruxtDevtoolsSection, string>> = {}
    // Which entries are open, by section and key. An entry that is not listed is open or closed by its default.
    private opened = new Map<string, boolean>()
    private creates = new Map<string, CreateUi>()
    private actionUi = new Map<string, ActionUi>()
    // The number of sources connected so far. An action's result is dropped when another source was connected while
    // the action ran.
    private connection = 0
    // The section last rendered. Its list keeps its scroll position when the same section renders again.
    private rendered: string | undefined
    // The tab keys as last rendered, in order: the built-in sections, then the modules' sections.
    private keys: string[] = [...DRUXT_DEVTOOLS_SECTIONS]
    private root: ShadowRoot

    constructor() {
      super()
      this.root = this.attachShadow({ mode: 'open' })
    }

    get section(): string {
      const value = this.getAttribute('section')
      return value && (isSection(value) || value.startsWith('x-')) ? value : 'missing'
    }

    set section(value: string) {
      this.setAttribute('section', value)
    }

    get waitingText(): string {
      return this.getAttribute('waiting-text') || 'Waiting for the app to connect.'
    }

    set waitingText(value: string) {
      this.setAttribute('waiting-text', value)
    }

    connectedCallback(): void {
      this.render()
    }

    attributeChangedCallback(name: string, previous: string | null, value: string | null): void {
      if ((name === 'section' || name === 'waiting-text') && previous !== value) this.schedule()
    }

    connect(source: DruxtDevtoolsSource): void {
      this.disconnect()
      this.source = source
      this.connection += 1
      this.actionUi.clear()
      this.unsubscribe = source.subscribe?.(() => this.schedule())
      this.render()
    }

    disconnect(): void {
      this.unsubscribe?.()
      this.unsubscribe = undefined
    }

    private schedule(): void {
      if (this.scheduled) return
      this.scheduled = true
      const view = this.ownerDocument.defaultView

      // An element that is out of the page is not rendered here. It renders when it is put back.
      const run = () => {
        this.scheduled = false
        if (this.isConnected) this.render()
      }
      if (view?.requestAnimationFrame) view.requestAnimationFrame(run)
      else Promise.resolve().then(run)
    }

    /**
     * Creates an element in this element's document, with attributes and children.
     *
     * - An attribute whose value is `false`, null or undefined is left out.
     * - A function is added as an event listener. Its key names the event, so `onClick` listens for `click`.
     * - The `html` key sets the element's inner HTML.
     * - `true` sets an empty attribute.
     */
    private h(tag: string, attrs: Record<string, string | number | boolean | null | undefined | ((event: Event) => void)> = {}, ...children: Child[]): HTMLElement {
      const element = this.ownerDocument.createElement(tag)
      for (const [key, value] of Object.entries(attrs)) {
        if (value === false || value === null || value === undefined) continue
        if (typeof value === 'function') element.addEventListener(key.slice(2).toLowerCase(), value)
        else if (key === 'html') element.innerHTML = String(value)
        else element.setAttribute(key, value === true ? '' : String(value))
      }
      const append = (child: Child): void => {
        if (Array.isArray(child)) child.forEach(append)
        else if (typeof child === 'string') element.append(this.ownerDocument.createTextNode(child))
        else if (child) element.append(child)
      }
      children.forEach(append)
      return element
    }

    /** Wraps SVG source in a span that takes no box of its own. */
    private svg(source: string): HTMLElement {
      return this.h('span', { 'html': source, 'style': 'display:contents' })
    }

    render(): void {
      const snapshot = this.source?.snapshot()

      // The focused control and its caret. Both are put back after the content is replaced.
      const active = this.root.activeElement as HTMLElement | null
      const focusKey = active?.dataset?.focus
      const caret = active instanceof this.ownerDocument.defaultView!.HTMLInputElement ? [active.selectionStart ?? null, active.selectionEnd ?? null] as const : undefined

      // Where the section's list was scrolled to. It is put back when the same section renders again.
      const list = this.root.querySelector<HTMLElement>('.dt-list')
      const scroll = list && this.rendered === this.section ? [list.scrollTop, list.scrollLeft] as const : undefined

      const style = this.h('style', {}, DRUXT_DEVTOOLS_CSS)
      const body = snapshot ? this.layout(snapshot) : this.h('p', { class: 'dt-waiting', role: 'status' }, this.waitingText)
      this.root.replaceChildren(style, body)
      this.rendered = this.section

      const next = scroll && this.root.querySelector<HTMLElement>('.dt-list')
      if (next) {
        next.scrollTop = scroll[0]
        next.scrollLeft = scroll[1]
      }

      if (focusKey) {
        const target = this.root.querySelector<HTMLElement>(`[data-focus="${cssEscape(this.ownerDocument.defaultView, focusKey)}"]`)
        target?.focus()
        if (caret && target instanceof this.ownerDocument.defaultView!.HTMLInputElement) target.setSelectionRange(caret[0], caret[1])
      }
    }

    /** The count shown on each built-in section's tab. Settings has none. */
    private counts(snapshot: DruxtDevtoolsSnapshot): Record<DruxtDevtoolsSection, number | undefined> {
      return {
        missing: snapshot.missing.reduce((sum, group) => sum + group.entries.length, 0),
        quiet: snapshot.quiet.length,
        modules: snapshot.modules.length,
        requests: snapshot.requests.length,
        settings: undefined,
      }
    }

    /** Builds the navigation, with its tabs, and the panel of the section shown. */
    private layout(snapshot: DruxtDevtoolsSnapshot): HTMLElement {
      const custom = new Map((snapshot.sections || []).map((item) => [moduleSectionKey(item.id), item]))
      this.keys = [...DRUXT_DEVTOOLS_SECTIONS, ...custom.keys()]

      // When the section shown is a module's section that has gone, the first section is shown.
      const section = this.keys.includes(this.section) ? this.section : 'missing'
      const counts = this.counts(snapshot)
      const label = (key: string): [string, string] => isSection(key) ? LABELS[key] : [custom.get(key)!.label, custom.get(key)!.label]
      const tabs = this.keys.map((key) => this.h('button', {
        'type': 'button',
        'role': 'tab',
        'class': 'dt-tab',
        'id': `dt-tab-${key}`,
        'aria-selected': String(key === section),
        'aria-controls': `dt-${key}`,
        'tabindex': key === section ? 0 : -1,
        'data-focus': `tab-${key}`,
        'onClick': () => this.select(key),
      }, this.h('span', { class: 'dt-long' }, label(key)[0]), this.h('span', { class: 'dt-short' }, label(key)[1]), !isSection(key) || counts[key] === undefined ? null : this.h('span', { class: 'dt-count' }, String(counts[key]))))

      const nav = this.h('nav', { 'class': 'dt-nav', 'part': 'nav', 'aria-label': 'Druxt' },
        this.h('p', { class: 'dt-title' }, this.svg(icons.mark), 'Druxt', this.h('span', { class: 'dt-page' }, snapshot.page)),
        this.h('div', { 'role': 'tablist', 'aria-label': 'Druxt development', 'onKeydown': (event) => this.keyTabs(event as KeyboardEvent) }, tabs),
        this.h('p', { class: 'dt-page' }, snapshot.page),
      )
      const panel = this.h('section', { 'class': 'dt-panel', 'id': `dt-${section}`, 'role': 'tabpanel', 'aria-labelledby': `dt-tab-${section}`, 'part': 'panel' },
        isSection(section) ? this[section](snapshot) : this.moduleSection(custom.get(section)!))
      return this.h('div', { class: 'dt' }, nav, panel)
    }

    /** Shows a section, and dispatches the section event when it changed. With `focus`, its tab takes the focus. */
    private select(section: string, focus = false): void {
      if (section !== this.section) {
        this.section = section
        this.dispatchEvent(new (this.ownerDocument.defaultView!.CustomEvent)(DRUXT_DEVTOOLS_SECTION_EVENT, { detail: { section }, bubbles: true, composed: true }))
      }
      this.render()
      if (focus) this.root.querySelector<HTMLElement>(`#${cssEscape(this.ownerDocument.defaultView, `dt-tab-${section}`)}`)?.focus()
    }

    /**
     * Handles the keys of the ARIA tabs pattern.
     *
     * The arrow keys move to the next or the last tab, and wrap at either end. Home and End jump to the first and the
     * last tab. Both the horizontal and the vertical arrows work.
     */
    private keyTabs(event: KeyboardEvent): void {
      const at = Math.max(0, this.keys.indexOf(this.section))
      const last = this.keys.length - 1
      const to = ({ ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1, ArrowUp: at - 1, Home: 0, End: last } as Record<string, number>)[event.key]
      if (to === undefined) return
      event.preventDefault()
      this.select(this.keys[(to + last + 1) % (last + 1)]!, true)
    }

    /** A section's heading and its one line of explanation. */
    private head(title: string, lede: string): HTMLElement {
      return this.h('header', { class: 'dt-head' }, this.h('h2', {}, title), this.h('p', { class: 'dt-lede' }, lede))
    }

    /** What a section shows when it has nothing to list. */
    private empty(title: string, line: string): HTMLElement {
      return this.h('div', { class: 'dt-empty' }, this.svg(druxtMonoMark(24)), this.h('p', { class: 'dt-empty-title' }, title), this.h('p', {}, line))
    }

    /** A section's filter input, and a live region that tells a screen reader how many entries are shown. */
    private filter(section: DruxtDevtoolsSection, total: number, [one, many]: [string, string], shown: number): HTMLElement[] {
      const query = this.filters[section] || ''
      return [
        this.h('label', { class: 'dt-filter' }, this.svg(icons.search), this.h('input', {
          'type': 'search',
          'value': query,
          'placeholder': `Filter ${plural(total, one, many)}`,
          'aria-label': `Filter ${plural(total, one, many)}`,
          'data-focus': `filter-${section}`,
          'onInput': (event) => {
            this.filters[section] = (event.target as HTMLInputElement).value
            this.render()
          },
        })),
        this.h('p', { 'class': 'dt-sr', 'aria-live': 'polite' }, query.trim() ? `${plural(shown, one, many)} shown` : ''),
      ]
    }

    /** Whether any of the texts contains the section's filter query, in any case. An empty query matches. */
    private match(section: DruxtDevtoolsSection, ...texts: string[]): boolean {
      const query = (this.filters[section] || '').trim().toLowerCase()
      return !query || texts.some((text) => text.toLowerCase().includes(query))
    }

    /** A disclosure that stays open or closed across renders. */
    private details(key: string, open: boolean, className: string, summary: Child[], body: Child[]): HTMLElement {
      const element = this.h('details', { class: className, open: this.opened.get(key) ?? open }, this.h('summary', { 'data-focus': `summary-${key}` }, summary), body)
      element.addEventListener('toggle', () => this.opened.set(key, (element as HTMLDetailsElement).open))
      return element
    }

    /**
     * Shows a value as a tree.
     *
     * An object or an array opens to its children, and the first level starts open. A plain value shows in one line.
     */
    private tree(value: unknown, depth = 0): HTMLElement {
      if (!isTree(value)) return this.h('span', { class: 'dt-tree-value' }, show(value))
      const entries = Object.entries(value)
      if (!entries.length) return this.h('span', { class: 'dt-tree-value' }, Array.isArray(value) ? '[]' : '{}')
      return this.h('ul', { class: 'dt-tree' }, entries.map(([key, child]) => this.h('li', {},
        isTree(child) && Object.keys(child).length
          ? this.h('details', { open: depth < 1 }, this.h('summary', {}, this.h('span', { class: 'dt-tree-key' }, key)), this.tree(child, depth + 1))
          : [this.h('span', { class: 'dt-tree-key' }, key), ' ', this.tree(child, depth + 1)],
      )))
    }

    /** Renders a module's block of data: a list of keys and values, a table or a tree. */
    private block(block: DruxtDevtoolsBlock): HTMLElement {
      const title = block.title ? this.h('h3', { class: 'dt-caption' }, block.title) : null
      if (block.type === 'pairs') return this.h('div', { class: 'dt-block' }, title, this.pairs(block.items))
      if (block.type === 'table') {
        return this.h('div', { class: 'dt-block' }, title, this.h('table', { class: 'dt-table' },
          this.h('thead', {}, this.h('tr', {}, block.columns.map((column) => this.h('th', { scope: 'col' }, column)))),
          this.h('tbody', {}, block.rows.map((row) => this.h('tr', {}, row.map((cell) => this.h('td', {}, show(cell))))))))
      }
      return this.h('div', { class: 'dt-block' }, title, this.tree(block.value))
    }

    /**
     * Runs a module's action through the host, and shows how it went.
     *
     * A string the handler returns is shown as the result. Any other result shows `Done.`.
     */
    private async run(id: string): Promise<void> {
      if (!this.source?.runAction) return
      const connection = this.connection
      this.actionUi.set(id, { state: 'busy', message: '' })
      this.render()

      let ui: ActionUi
      try {
        const result = await this.source.runAction(id)
        ui = { state: 'done', message: typeof result === 'string' ? result : 'Done.' }
      } catch (error) {
        ui = { state: 'failed', message: (error as Error)?.message || 'The action failed.' }
      }

      // Another source was connected while the action ran. The result belongs to the old source, so it is dropped.
      if (connection !== this.connection) return
      this.actionUi.set(id, ui)
      this.render()
    }

    /** Renders a section a module added: its actions, then its blocks. Without `runAction`, no action shows. */
    private moduleSection(section: DruxtDevtoolsModuleSection): Child[] {
      const head = this.h('header', { class: 'dt-head' }, this.h('h2', {}, section.label))
      const actions = this.source?.runAction ? section.actions : []
      if (!section.blocks.length && !actions.length) return [head, this.empty('Nothing to show yet', `${section.label} appears here as the page renders.`)]
      return [head, this.h('div', { class: 'dt-list' },
        actions.length ? this.h('div', { class: 'dt-actions' }, actions.map((action) => {
          const ui = this.actionUi.get(action.id) || { state: 'idle', message: '' }
          return this.h('div', { 'class': 'dt-action', 'data-state': ui.state },
            this.h('button', { 'type': 'button', 'class': 'dt-button dt-button-secondary', 'disabled': ui.state === 'busy', 'data-focus': `action-${action.id}`, 'onClick': () => { void this.run(action.id) } }, ui.state === 'busy' ? [this.svg(icons.spinner), action.label] : action.label),
            ui.state === 'done' || ui.state === 'failed' ? this.h('span', { class: 'dt-result', role: ui.state === 'failed' ? 'alert' : 'status' }, ui.message) : null)
        })) : null,
        section.blocks.map((block) => this.block(block)),
      )]
    }

    /** The Missing wrappers section. The first entry starts open, unless the list is long enough to have a filter. */
    private missing(snapshot: DruxtDevtoolsSnapshot): Child[] {
      const entries = snapshot.missing.flatMap((group) => group.entries)
      const head = this.head('Missing wrappers', 'These rendered Druxt\'s default output. A wrapper of your own replaces it.')
      if (!entries.length) return [head, this.empty('No missing wrappers', 'Every Druxt module on this page rendered a wrapper of your own.')]
      const many = entries.length > MANY
      const groups = snapshot.missing
        .map((group) => ({ ...group, entries: group.entries.filter((entry) => !many || this.match('missing', entry.component, entry.meta, ...entry.candidates)) }))
        .filter((group) => group.entries.length)
      const shown = groups.reduce((sum, group) => sum + group.entries.length, 0)
      const first = entries[0]!.key
      const instances = entries.reduce((sum, entry) => sum + entry.count, 0)
      return [
        head,
        many && this.filter('missing', entries.length, ['entry', 'entries'], shown),
        this.h('div', { class: 'dt-list' },
          groups.map((group) => [
            this.h('h3', { class: 'dt-group' }, `${group.component} · ${group.entries.length}`),
            group.entries.map((entry) => this.details(`missing:${entry.key}`, !many && entry.key === first, 'dt-entry', [
              this.svg(icons.chevron),
              this.h('span', {}, this.h('span', { class: 'dt-name' }, entry.meta || entry.component), this.h('span', { class: 'dt-sub' }, entry.candidates[0] || '')),
              this.h('span', { class: 'dt-count' }, `×${entry.count}`),
            ], [
              this.h('div', { class: 'dt-entry-body' },
                this.h('div', {},
                  this.h('p', { class: 'dt-caption' }, 'Looked for, most specific first'),
                  this.h('ol', { class: 'dt-candidates' }, entry.candidates.map((name) => this.h('li', {}, name))),
                  this.h('p', { class: 'dt-explain' }, 'Druxt renders the first of these that exists. None does yet, so this uses the default. ',
                    this.links.wrappers ? this.h('a', { href: this.links.wrappers, target: '_blank', rel: 'noopener' }, 'How wrapper names are built') : null),
                ),
                entry.templates.length ? this.create(entry.key, entry.templates) : null,
              ),
            ])),
          ]),
          shown ? null : this.h('p', { class: 'dt-nomatch' }, `No entries match “${(this.filters.missing || '').trim()}”`),
        ),
        entries.length > 1 && this.h('p', { class: 'dt-foot' }, `${plural(instances, 'instance', 'instances')} in ${plural(entries.length, 'entry', 'entries')}`),
      ]
    }

    /** The create action's state for an entry. It starts again when the chosen candidate is no longer offered. */
    private ui(key: string, templates: DruxtDevtoolsTemplate[]): CreateUi {
      let ui = this.creates.get(key)
      if (!ui || !templates.some((template) => template.name === ui!.name)) {
        ui = { name: templates[0]!.name, state: 'idle', message: '', byHand: false, copied: 'idle' }
        this.creates.set(key, ui)
      }
      return ui
    }

    /**
     * Renders the create action.
     *
     * It has a candidate to pick, and one slot that shows the state: idle, busy, done or refused. The Create button
     * shows only when `createEndpoint` is set. After a refusal that the developer can work around, it offers the path
     * and the starter to copy.
     */
    private create(key: string, templates: DruxtDevtoolsTemplate[]): HTMLElement {
      const ui = this.ui(key, templates)
      const template = templates.find((t) => t.name === ui.name)!
      const id = `dt-create-${key.replace(/[^\w-]/g, '-')}`
      const busy = ui.state === 'busy'
      const preview = (selected = false) => this.h('div', { class: 'dt-preview' },
        this.h('div', { class: 'dt-path' }, template.path),
        this.h('pre', { 'tabindex': 0, 'data-select': selected ? '' : null, 'aria-label': `Starter for ${template.path}${selected ? ', selected to copy' : ''}` }, template.starter))

      let result: Child = null
      if (ui.state === 'done') {
        result = this.h('p', { class: 'dt-result', role: 'status' }, this.svg(icons.check), this.h('span', {}, 'Created ', this.h('code', {}, template.path), '. Hot reload will swap it in.'))
      } else if (ui.state === 'refused') {
        result = [
          this.h('div', { class: 'dt-result', role: 'alert' }, this.svg(icons.alert), this.h('span', {}, `Not created. ${ui.message}`,
            ui.byHand ? [' ', this.h('span', { class: 'dt-then' }, 'Create the file yourself at ', this.h('code', {}, template.path), '.')] : null)),
          ui.byHand && this.h('button', { 'type': 'button', 'class': 'dt-button dt-button-secondary', 'data-focus': `copy-${key}`, 'onClick': () => this.copy(key, template) },
            { idle: 'Copy path and starter', copied: 'Copied', manual: 'Copy unavailable: select and copy below' }[ui.copied]),
          ui.copied === 'manual' && preview(true),
        ]
      }

      return this.h('form', { 'class': 'dt-create', 'data-state': ui.state, 'aria-busy': busy ? 'true' : null, 'onSubmit': (event) => {
        event.preventDefault()
        void this.post(key, template)
      } },
      this.h('label', { class: 'dt-caption', for: id }, 'Create a wrapper'),
      this.h('div', { class: 'dt-row-controls' },
        this.h('span', { class: 'dt-select' },
          this.h('select', { 'id': id, 'disabled': busy, 'data-focus': `select-${key}`, 'onChange': (event) => {
            this.creates.set(key, { ...ui, name: (event.target as HTMLSelectElement).value, state: 'idle', copied: 'idle' })
            this.render()
          } }, templates.map((t) => this.h('option', { value: t.name, selected: t.name === ui.name }, t.name))),
          this.svg(icons.down)),
        this.createEndpoint ? this.h('button', { 'type': 'submit', 'class': 'dt-button', 'disabled': busy, 'data-focus': `create-${key}` }, busy ? [this.svg(icons.spinner), 'Creating'] : 'Create') : null,
      ),
      result,
      ui.state === 'idle' || ui.state === 'busy' ? preview() : null,
      )
    }

    /**
     * Posts a file's request to the create endpoint, and records the answer.
     *
     * - A success opens the created file in the editor, when the answer names the file and the host can.
     * - A 403 is a refusal the developer can work around, so the file is offered to make by hand. Unless its reason
     *   names the origin, the message says that files are written only on localhost.
     * - Any other refusal shows the server's reason.
     */
    private async post(key: string, template: DruxtDevtoolsTemplate): Promise<void> {
      if (!this.createEndpoint) return
      const ui = this.creates.get(key)!
      this.creates.set(key, { ...ui, state: 'busy', message: '' })
      this.render()

      const view = this.ownerDocument.defaultView!
      let next: Partial<CreateUi>
      try {
        const response = await view.fetch(this.createEndpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(template.request) })
        const body = await response.json().catch(() => ({})) as { file?: string, statusMessage?: string, message?: string }
        if (response.ok) {
          next = { state: 'done' }
          if (body.file) this.openInEditor?.(body.file)
        } else {
          const reason = body.statusMessage || body.message || response.statusText
          next = { state: 'refused', message: response.status === 403 && !/origin/i.test(reason) ? REFUSED_HOST : reason, byHand: response.status === 403 }
        }
      } catch {
        // The server never answered. The file can still be made by hand.
        next = { state: 'refused', message: 'The dev server did not answer.', byHand: true }
      }
      this.creates.set(key, { ...this.creates.get(key)!, copied: 'idle', ...next })
      this.render()
    }

    /**
     * Copies the path and the starter to the clipboard.
     *
     * When the clipboard is missing or refuses, it shows the starter with its text selected, to copy by hand.
     */
    private async copy(key: string, template: DruxtDevtoolsTemplate): Promise<void> {
      const view = this.ownerDocument.defaultView!
      let copied: CreateUi['copied'] = 'copied'
      try {
        if (!view.navigator.clipboard) throw new Error('No clipboard')
        await view.navigator.clipboard.writeText(`${template.path}\n\n${template.starter}`)
      } catch {
        copied = 'manual'
      }
      this.creates.set(key, { ...this.creates.get(key)!, copied })
      this.render()

      const pre = this.root.querySelector<HTMLElement>('pre[data-select]')
      if (copied === 'manual' && pre) {
        pre.focus()
        const range = this.ownerDocument.createRange()
        range.selectNodeContents(pre)
        view.getSelection()?.removeAllRanges()
        view.getSelection()?.addRange(range)
      }
    }

    /** The Quiet errors section. */
    private quiet(snapshot: DruxtDevtoolsSnapshot): Child[] {
      const head = this.head('Quiet errors', 'References to content this visitor cannot see. Druxt renders nothing in their place, which is usually right.')
      if (!snapshot.quiet.length) return [head, this.empty('No quiet errors', 'Every reference on this page resolved for this visitor.')]
      return [head, this.h('div', { class: 'dt-list' },
        this.h('div', { class: 'dt-rows' }, snapshot.quiet.map((error) => this.h('div', { class: 'dt-row' },
          this.h('code', {}, error.component),
          this.h('span', { class: 'dt-status' }, error.status || ''),
          this.h('span', { class: 'dt-detail' }, error.detail),
        ))),
        this.links.quiet ? this.h('p', { class: 'dt-quiet-link' }, this.h('a', { href: this.links.quiet, target: '_blank', rel: 'noopener' }, 'When references fail quietly')) : null,
      )]
    }

    /** A list of keys and values, or `None` when there are no keys. */
    private pairs(values: Record<string, unknown>): HTMLElement {
      const entries = Object.entries(values)
      if (!entries.length) return this.h('p', { class: 'dt-none' }, 'None')
      return this.h('dl', { class: 'dt-pairs' }, entries.map(([key, value]) => [this.h('dt', {}, key), this.h('dd', {}, show(value))]))
    }

    /** A module's status. A failed module shows its HTTP status code, when it has one. */
    private moduleStatus(module: DruxtDevtoolsModule): HTMLElement {
      const text = module.status === 'error' ? String(module.statusCode || 'error') : module.status
      return this.h('span', { class: `dt-state dt-tone-${module.status}` }, this.h('span', { class: 'dt-dot' }), text)
    }

    /** The Modules section. */
    private modules(snapshot: DruxtDevtoolsSnapshot): Child[] {
      const head = this.head('Modules', 'Every Druxt module on this page, in render order.')
      const all = snapshot.modules
      if (!all.length) return [head, this.empty('No Druxt modules on this page', 'This route rendered without Druxt. Modules appear here as they mount.')]
      const many = all.length > MANY
      const shown = all.filter((module) => !many || this.match('modules', module.component, module.wrapper || '', module.key || '', ...module.candidates))
      const ready = all.filter((module) => module.status === 'ready').length
      const defaults = all.filter((module) => module.status === 'default').length
      const quiet = all.filter((module) => module.status === 'error' && module.quiet).length
      const loud = all.filter((module) => module.status === 'error' && !module.quiet).length
      return [
        head,
        many && this.filter('modules', all.length, ['module', 'modules'], shown.length),
        this.h('div', { class: 'dt-list' },
          shown.map((module) => this.details(`modules:${module.id}`, false, 'dt-entry dt-module', [
            this.svg(icons.chevron),
            this.h('span', {}, this.h('code', {}, module.component), ' ', this.h('span', { class: 'dt-meta' }, describeCandidate(module.component, module.candidates))),
            this.moduleStatus(module),
            this.h('span', { class: 'dt-wrapper' }, [module.wrapper || 'default', module.key].filter(Boolean).join(' · ')),
          ], [
            this.h('div', { class: 'dt-entry-body' },
              this.h('div', {}, this.h('p', { class: 'dt-caption' }, 'Candidates'), module.candidates.length ? this.h('ol', { class: 'dt-candidates' }, module.candidates.map((name) => this.h('li', {}, name))) : this.h('p', { class: 'dt-none' }, 'None asked for')),
              this.h('div', {}, this.h('p', { class: 'dt-caption' }, 'Props'), this.pairs(module.props)),
              this.h('div', {}, this.h('p', { class: 'dt-caption' }, 'State'), this.pairs({ ...module.schema ? { schema: module.schema } : {}, ...module.state })),
              this.h('div', {}, this.h('p', { class: 'dt-caption' }, 'Settings'), this.pairs(module.settings)),
              module.error ? this.h('p', { class: 'dt-notes dt-status' }, module.error) : null,
              module.notes.length ? this.h('ul', { class: 'dt-notes' }, module.notes.map((note) => this.h('li', { 'class': 'dt-note', 'data-kind': note.kind, 'data-key': noteKey(note) }, note.title, note.detail ? this.h('span', { class: 'dt-detail' }, note.detail) : null))) : null,
            ),
          ])),
          shown.length ? null : this.h('p', { class: 'dt-nomatch' }, `No modules match “${(this.filters.modules || '').trim()}”`),
        ),
        this.h('p', { class: 'dt-foot' }, [plural(all.length, 'module', 'modules'), `${ready} with your wrapper`, plural(defaults, 'default in use', 'defaults in use'), plural(quiet, 'quiet error', 'quiet errors'), loud && plural(loud, 'error', 'errors')].filter(Boolean).join(' · ')),
      ]
    }

    /** The Requests section: the requests of each side on a time axis, then the modules' timeline events. */
    private requests(snapshot: DruxtDevtoolsSnapshot): Child[] {
      const head = this.head('Requests', 'Requests Druxt made for this page. Store hits made no network call.')
      const all = snapshot.requests
      const events = snapshot.timeline || []
      const eventList = events.length ? [this.h('h3', { class: 'dt-group' }, 'Module events'), this.h('div', { class: 'dt-rows' }, events.map((event) => this.h('div', { class: 'dt-row dt-event' },
        this.h('span', {}, this.h('span', { class: 'dt-kind' }, event.source || 'Event'), ' ', event.label),
        this.h('span', { class: 'dt-timing' }, `${Math.round(event.time)} ms`),
        event.detail ? this.h('span', { class: 'dt-detail' }, event.detail) : null,
      )))] : []
      if (!all.length) return [head, events.length ? this.h('div', { class: 'dt-list' }, eventList) : this.empty('No requests yet', 'Requests appear here as the page fetches.')]
      const sides = (['server', 'browser'] as const).map((side) => ({ side, list: all.filter((request) => request.side === side) })).filter(({ list }) => list.length)
      const stored = all.filter((request) => request.source === 'store').length
      const network = all.filter((request) => request.source === 'network').reduce((sum, request) => sum + request.duration, 0)
      return [
        head,
        this.h('div', { class: 'dt-list' }, sides.map(({ side, list }) => {
          // Each side has its own clock. The server's starts with its render, and the browser's with its page.
          const from = Math.min(...list.map((request) => request.start))
          const span = Math.max(1, ...list.map((request) => request.start + request.duration - from))
          return [
            // The heading shows even when there is only one side. On a first load that the server rendered, the
            // requests are listed under the server render, with the page they were made for.
            this.h('h3', { class: 'dt-group' }, side === 'server' ? (list[0]!.page ? `Server render of ${list[0]!.page}` : 'Server render') : 'Browser'),
            this.h('div', { 'class': 'dt-axis', 'aria-hidden': 'true' }, this.h('span', {}, '0 ms'), this.h('span', {}, String(Math.round(span / 2))), this.h('span', {}, `${Math.round(span)} ms`)),
            list.map((request) => {
              const store = request.source === 'store'
              const failed = (request.status || 0) >= 400
              const left = ((request.start - from) / span) * 100
              const width = (request.duration / span) * 100
              return this.h('div', { class: 'dt-request' },
                this.h('div', { class: 'dt-path-line' }, this.h('span', { class: 'dt-kind' }, KINDS[request.kind]), this.h('code', { title: request.path }, request.path),
                  this.h('span', { class: `dt-timing${failed ? ' dt-status' : ''}` }, store ? 'store' : [request.status, `${Math.round(request.duration)} ms`].filter(Boolean).join(' '))),
                this.h('div', { class: 'dt-track' }, this.h('span', { class: `dt-bar${store ? ' dt-bar-store' : failed ? ' dt-bar-error' : ''}`, style: `left:${left.toFixed(2)}%;width:${width.toFixed(2)}%` })),
                this.h('span', { class: `dt-source${request.partial !== undefined ? ' dt-partial' : ''}` }, store ? 'Already in the store' : request.partial !== undefined ? `Network, partial${request.partial ? `: ${request.partial}` : ''}` : 'Network'),
              )
            }),
          ]
        }), eventList),
        this.h('p', { class: 'dt-foot' }, [plural(all.length, 'request', 'requests'), `${stored} from the store`, `${Math.round(network)} ms on the network`].join(' · ')),
      ]
    }

    /** The Settings section: each setting, and how many came from each tier. */
    private settings(snapshot: DruxtDevtoolsSnapshot): Child[] {
      const count = (tier: DruxtDevtoolsTier) => snapshot.settings.filter((setting) => setting.tier === tier).length
      return [
        this.head('Settings', 'The settings Druxt resolved, and where each came from. The site\'s config wins over Drupal, and Drupal over a module\'s default.'),
        this.h('p', { class: 'dt-legend' }, (['site', 'drupal', 'default'] as const).map((tier) => this.h('span', { class: `dt-chip dt-chip-${tier}` }, `${TIERS[tier]} ${count(tier)}`))),
        this.h('div', { class: 'dt-list' }, snapshot.settings.map((setting) => this.h('div', { class: 'dt-setting' },
          this.h('span', { class: 'dt-key' }, setting.key),
          this.h('span', { class: 'dt-value' }, show(setting.value)),
          this.h('span', { class: `dt-chip dt-chip-${setting.tier}` }, TIERS[setting.tier]),
        ))),
      ]
    }
  }

  win.customElements.define(DRUXT_DEVTOOLS_TAG, DruxtDevtools)
  return DruxtDevtools
}
