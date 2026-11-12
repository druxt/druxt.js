// The development tools' model: what a page's Druxt modules, requests and settings look like to a tool, and the
// channel a host feeds. It imports nothing from Vue, Nuxt or h3, so any host can feed it: Druxt's Nuxt module does,
// and a React or Next.js host can emit the same events.

/** A section of the tools, as the `section` attribute names it. */
export type DruxtDevtoolsSection = 'missing' | 'quiet' | 'modules' | 'requests' | 'settings'

/** The sections, in the order the tools list them. */
export const DRUXT_DEVTOOLS_SECTIONS: readonly DruxtDevtoolsSection[] = ['missing', 'quiet', 'modules', 'requests', 'settings']

/**
 * A note a module adds about itself, shown with the module. A module adds its own kinds, such as a Layout Builder
 * fallback.
 */
export interface DruxtDevtoolsNote {
  /** What the note is about, such as `layout-builder-fallback`. */
  kind: string
  /** The note's identity on its module, its kind unless given. A module keeps one note per key, so a later note replaces it and `module:note:removed` clears it. */
  key?: string
  /** The note, in one line. */
  title: string
  /** More about it. */
  detail?: string
}

/** A file the create action can write for a module with no wrapper. */
export interface DruxtDevtoolsTemplate {
  /** The wrapper's name, one of the module's candidates. */
  name: string
  /** The file's path from the app's root. */
  path: string
  /** The file's starter source. */
  starter: string
  /** What the create action sends the host's endpoint for this file. */
  request: unknown
}

/** How a module rendered: with a wrapper of the site's own, with Druxt's default, or failing. */
export type DruxtDevtoolsStatus = 'ready' | 'default' | 'error'

/** A Druxt module on the page. */
export interface DruxtDevtoolsModule {
  /** The instance, unique on the page. */
  id: string
  /** The module component, such as `DruxtEntity`. */
  component: string
  /** The wrapper candidates, most specific first. */
  candidates: string[]
  /** The wrapper it resolved, or null for Druxt's default or none asked for. */
  wrapper: string | null
  /** The key its data is held under. */
  key?: string
  status: DruxtDevtoolsStatus
  /** The failure's HTTP status, when it failed. */
  statusCode?: number
  /** The failure, in one line, without a URL. */
  error?: string
  /** Whether the module fails quietly: it renders nothing in place of its error. */
  quiet?: boolean
  /** What the module hands its wrapper, summarized. */
  props: Record<string, unknown>
  /** Its declared state, summarized. */
  state: Record<string, unknown>
  /** Its settings, from the wrapper. */
  settings: Record<string, unknown>
  /** The schema it rendered with, by id. */
  schema?: string
  /** Notes the module adds about itself. */
  notes: DruxtDevtoolsNote[]
  /** The files the create action can write, for a module rendering Druxt's default. */
  templates?: DruxtDevtoolsTemplate[]
}

/** A module rendering Druxt's default output, and the modules like it: one entry per component and candidate list. */
export interface DruxtDevtoolsMissingEntry {
  /** The component and candidates, joined. */
  key: string
  component: string
  candidates: string[]
  /** The most specific candidate past the component's name, in words: DruxtEntityNodeArticleFull is `node · article · full`. */
  meta: string
  /** How many instances on the page. */
  count: number
  templates: DruxtDevtoolsTemplate[]
}

/** The missing wrappers of one module component. */
export interface DruxtDevtoolsMissingGroup {
  component: string
  entries: DruxtDevtoolsMissingEntry[]
}

/** A module that failed quietly. */
export interface DruxtDevtoolsQuietError {
  id: string
  component: string
  /** The HTTP status, when the failure starts with one. */
  status?: string
  /** The failure, without its status or a URL. */
  detail: string
}

/** What a request was for. */
export type DruxtDevtoolsRequestKind = 'jsonapi' | 'schema' | 'date-formats' | 'other'

/** A request a module made, or one the store answered without the network. */
export interface DruxtDevtoolsRequest {
  id: string
  kind: DruxtDevtoolsRequestKind
  /** The path, without the origin. */
  path: string
  /** The HTTP status, for a network request. */
  status?: number
  /** When it started, in milliseconds from the page's start on its side. */
  start: number
  /** How long it took, in milliseconds. Zero for the store. */
  duration: number
  /** Whether it went to the network or the store already held it. */
  source: 'network' | 'store'
  /** Where it ran: the server render, or the browser. */
  side: 'server' | 'browser'
  /** For a server render's request, the page it rendered: its path and query, without a hash. */
  page?: string
  /** Drupal's reason, when it answered only partly and omitted resources, as for lack of permission. */
  partial?: string
}

/** Where a setting's value came from: the site's config, Drupal, or a module's default. */
export type DruxtDevtoolsTier = 'site' | 'drupal' | 'default'

/** One resolved setting, by its dotted key. */
export interface DruxtDevtoolsSetting {
  key: string
  value: unknown
  tier: DruxtDevtoolsTier
}

/**
 * A piece of a module's section, as data the element renders: a list of keys and values, a table, or a tree. A module
 * never supplies markup.
 */
export type DruxtDevtoolsBlock =
  | { type: 'pairs', title?: string, items: Record<string, unknown> }
  | { type: 'table', title?: string, columns: string[], rows: unknown[][] }
  | { type: 'tree', title?: string, value: unknown }

/** A named action a module offers, such as clearing a cache. Its handler runs in the app. */
export interface DruxtDevtoolsAction {
  id: string
  label: string
  /** The section it shows in, by id. */
  section?: string
}

/** A section a module adds to the tools, with its data and actions. */
export interface DruxtDevtoolsModuleSection {
  id: string
  label: string
  blocks: DruxtDevtoolsBlock[]
  actions: DruxtDevtoolsAction[]
}

/** A labelled event a module adds to the timeline, beside the requests. */
export interface DruxtDevtoolsTimelineEvent {
  id: string
  /** What happened, such as `views refetch`. */
  label: string
  /** Why, or more about it, such as `filter changed`. */
  detail?: string
  /** Who added it, such as the module's name. */
  source?: string
  /** When it happened, in milliseconds on the page's clock. */
  time: number
}

/** Everything the tools show, at one moment. JSON-serializable. */
export interface DruxtDevtoolsSnapshot {
  /** The current page's path. */
  page: string
  /** The modules, in the order they were reported. */
  modules: DruxtDevtoolsModule[]
  /** The missing wrappers, grouped by module component. */
  missing: DruxtDevtoolsMissingGroup[]
  quiet: DruxtDevtoolsQuietError[]
  requests: DruxtDevtoolsRequest[]
  settings: DruxtDevtoolsSetting[]
  /** The sections modules added, in the order they were added. */
  sections: DruxtDevtoolsModuleSection[]
  /** The events modules added to the timeline, for the current page. */
  timeline: DruxtDevtoolsTimelineEvent[]
}

/** A quiet failure that is not a module's own, such as a standalone field the display does not show. */
export interface DruxtDevtoolsQuietEvent {
  id: string
  component: string
  /** The failure in one line, or null once it has recovered. */
  summary: string | null
}

/** What a host emits. Every event is JSON-serializable, so it can cross a frame or a process. */
export type DruxtDevtoolsEvent =
  | { type: 'page', path: string }
  | { type: 'module:resolved', module: DruxtDevtoolsModule }
  | { type: 'module:missing', module: DruxtDevtoolsModule }
  | { type: 'module:removed', id: string }
  | { type: 'module:note', id: string, note: DruxtDevtoolsNote }
  /** Clears a module's note by its key, its kind unless the note had a key, once it no longer applies. */
  | { type: 'module:note:removed', id: string, key: string }
  | { type: 'quiet', error: DruxtDevtoolsQuietEvent }
  | { type: 'request', request: DruxtDevtoolsRequest }
  | { type: 'settings', settings: DruxtDevtoolsSetting[] }
  /** A module adds or updates a section. */
  | { type: 'section', section: Omit<DruxtDevtoolsModuleSection, 'actions'> }
  | { type: 'section:removed', id: string }
  /** A module offers an action. The channel's `registerAction()` emits it, with the handler kept on the host. */
  | { type: 'action', action: DruxtDevtoolsAction }
  | { type: 'action:removed', id: string }
  | { type: 'timeline', event: DruxtDevtoolsTimelineEvent }
  /** A module took its data from a payload it did not fetch: the server's, or another instance's. The snapshot keeps no record of it. */
  | { type: 'module:restored', id: string, component: string, key?: string }

/** A subscriber: called with each event, after the snapshot has it. */
export type DruxtDevtoolsListener = (event: DruxtDevtoolsEvent) => void

/** The channel between a host and its tools. */
export interface DruxtDevtoolsChannel {
  /** Reports an event to the snapshot and every subscriber. */
  emit: (event: DruxtDevtoolsEvent) => void
  /** Listens for events. Returns the function that stops listening. */
  subscribe: (listener: DruxtDevtoolsListener) => () => void
  /** Everything reported so far. */
  snapshot: () => DruxtDevtoolsSnapshot
  /** Offers an action whose handler runs in the host. Returns the function that withdraws it. */
  registerAction: (action: DruxtDevtoolsAction, handler: () => unknown) => () => void
  /** Runs an action's handler, as a tool's button does. Resolves with what the handler returns. */
  runAction: (id: string) => Promise<unknown>
}

// The longest list of requests kept: a long session in development keeps the latest.
const MAX_REQUESTS = 500
// The most modules whose notes are held before they report: a note for a module that never reports is dropped first.
const MAX_PENDING = 100

/**
 * A note's identity on its module: its key, else its kind.
 *
 * @param note - The note.
 */
export const noteKey = (note: DruxtDevtoolsNote): string => note.key ?? note.kind

/**
 * A module name's most specific candidate, past the module's own name, in words.
 *
 * @param component - The module component, such as `DruxtEntity`.
 * @param candidates - Its candidates, most specific first.
 * @returns The words, such as `node · article · full`.
 */
export const describeCandidate = (component: string, candidates: readonly string[]): string =>
  (candidates[0] || '').replace(component, '').split(/(?=[A-Z])/).filter(Boolean).map((part) => part.toLowerCase()).join(' · ')

/**
 * A failure's status code, when its summary starts with one, and the rest.
 *
 * @param summary - The failure in one line, such as `403: Forbidden`.
 */
export const splitStatus = (summary: string): { status?: string, detail: string } => {
  const status = /^\d{3}\b/.exec(summary)?.[0]
  return status ? { status, detail: summary.slice(status.length).replace(/^:/, '').trim() } : { detail: summary }
}

/**
 * The missing wrappers among the modules, one entry per component and candidate list, grouped by component.
 *
 * @param modules - The page's modules.
 */
export const groupMissing = (modules: readonly DruxtDevtoolsModule[]): DruxtDevtoolsMissingGroup[] => {
  const entries = new Map<string, DruxtDevtoolsMissingEntry>()
  for (const module of modules) {
    if (module.status !== 'default') continue
    const key = `${module.component}:${module.candidates.join(',')}`
    const entry = entries.get(key)
    if (entry) entry.count += 1
    else entries.set(key, { key, component: module.component, candidates: module.candidates, meta: describeCandidate(module.component, module.candidates), count: 1, templates: module.templates || [] })
  }
  const groups = new Map<string, DruxtDevtoolsMissingEntry[]>()
  for (const entry of entries.values()) groups.set(entry.component, [...groups.get(entry.component) || [], entry])
  return [...groups].map(([component, list]) => ({ component, entries: list }))
}

/** A copy that a subscriber cannot change the channel through. */
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/**
 * Creates a channel and the snapshot it keeps.
 *
 * @example
 * const devtools = createDruxtDevtools()
 * devtools.subscribe((event) => console.log(event.type))
 * devtools.emit({ type: 'page', path: '/' })
 * devtools.snapshot().page // '/'
 */
export function createDruxtDevtools(): DruxtDevtoolsChannel {
  let page = ''
  const modules = new Map<string, DruxtDevtoolsModule>()
  // Notes that arrive before their module does, oldest module first.
  const notes = new Map<string, DruxtDevtoolsNote[]>()
  const hold = (id: string, list: DruxtDevtoolsNote[]): void => {
    notes.delete(id)
    if (list.length) notes.set(id, list)
    while (notes.size > MAX_PENDING) notes.delete(notes.keys().next().value!)
  }
  const quiet = new Map<string, DruxtDevtoolsQuietError>()
  let requests: DruxtDevtoolsRequest[] = []
  let settings: DruxtDevtoolsSetting[] = []
  const sections = new Map<string, Omit<DruxtDevtoolsModuleSection, 'actions'>>()
  const actions = new Map<string, DruxtDevtoolsAction>()
  const handlers = new Map<string, () => unknown>()
  let timeline: DruxtDevtoolsTimelineEvent[] = []
  const listeners = new Set<DruxtDevtoolsListener>()

  const addNote = (list: DruxtDevtoolsNote[], note: DruxtDevtoolsNote): DruxtDevtoolsNote[] => [...list.filter((n) => noteKey(n) !== noteKey(note)), note]

  const apply = (event: DruxtDevtoolsEvent): void => {
    switch (event.type) {
      case 'page':
        // A new page: its requests start afresh. Modules leave as they unmount.
        // Notes held for a module of the last page that never reported go too.
        if (event.path !== page) {
          requests = []
          timeline = []
          notes.clear()
        }
        page = event.path
        break
      case 'module:resolved':
      case 'module:missing': {
        // A report again keeps the notes the module had, then the event's, then those held for it: a host reports a
        // module afresh on each refresh, and its notes come from elsewhere.
        const module = copy(event.module)
        module.notes = [...module.notes || [], ...notes.get(module.id) || []].reduce(addNote, modules.get(module.id)?.notes || [])
        notes.delete(module.id)
        modules.set(module.id, module)
        break
      }
      case 'module:removed':
        modules.delete(event.id)
        notes.delete(event.id)
        break
      case 'module:note': {
        const module = modules.get(event.id)
        if (module) module.notes = addNote(module.notes, copy(event.note))
        else hold(event.id, addNote(notes.get(event.id) || [], copy(event.note)))
        break
      }
      case 'module:note:removed': {
        const module = modules.get(event.id)
        if (module) module.notes = module.notes.filter((note) => noteKey(note) !== event.key)
        else hold(event.id, (notes.get(event.id) || []).filter((note) => noteKey(note) !== event.key))
        break
      }
      case 'quiet':
        if (event.error.summary === null) quiet.delete(event.error.id)
        else quiet.set(event.error.id, { id: event.error.id, component: event.error.component, ...splitStatus(event.error.summary) })
        break
      case 'request':
        requests = [...requests, copy(event.request)].slice(-MAX_REQUESTS)
        break
      case 'section':
        sections.set(event.section.id, copy(event.section))
        break
      case 'section:removed':
        sections.delete(event.id)
        break
      case 'action':
        actions.set(event.action.id, copy(event.action))
        break
      case 'action:removed':
        actions.delete(event.id)
        handlers.delete(event.id)
        break
      case 'timeline':
        timeline = [...timeline, copy(event.event)].slice(-MAX_REQUESTS)
        break
      case 'settings':
        settings = copy(event.settings)
        break
    }
  }

  return {
    emit(event) {
      apply(event)
      for (const listener of [...listeners]) listener(event)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    snapshot() {
      const list = [...modules.values()]
      const withActions = [...sections.values()].map((section) => ({ ...section, actions: [...actions.values()].filter((action) => action.section === section.id) }))
      return copy({ page, modules: list, missing: groupMissing(list), quiet: [...quiet.values()], requests, settings, sections: withActions, timeline })
    },
    registerAction(action, handler) {
      handlers.set(action.id, handler)
      this.emit({ type: 'action', action })
      return () => {
        if (handlers.get(action.id) === handler) this.emit({ type: 'action:removed', id: action.id })
      }
    },
    async runAction(id) {
      const handler = handlers.get(id)
      if (!handler) throw new Error(`No Druxt devtools action "${id}".`)
      return await handler()
    },
  }
}
