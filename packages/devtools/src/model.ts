// The development tools' model. It describes a page's Druxt modules, requests and settings as a tool sees them, and
// it has the channel a host feeds.
//
// It imports nothing from Vue, Nuxt or h3, so any host can feed it. Druxt's Nuxt module does. A React or Next.js host
// can emit the same events.

/** A section of the tools, as the `section` attribute names it. */
export type DruxtDevtoolsSection = 'missing' | 'quiet' | 'modules' | 'requests' | 'settings'

/** The sections, in the order the tools list them. */
export const DRUXT_DEVTOOLS_SECTIONS: readonly DruxtDevtoolsSection[] = ['missing', 'quiet', 'modules', 'requests', 'settings']

/**
 * A note a module adds about itself. It is shown with the module.
 *
 * A module adds its own kinds of note, such as a Layout Builder fallback.
 */
export interface DruxtDevtoolsNote {
  /** What the note is about, such as `layout-builder-fallback`. */
  kind: string
  /**
   * The note's identity on its module. The default is its kind.
   *
   * A module keeps one note for each key. A later note with the same key replaces it, and `module:note:removed`
   * clears it.
   */
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

/**
 * How a module rendered.
 *
 * - `ready`: with a wrapper of the site's own.
 * - `default`: with Druxt's default output.
 * - `error`: it failed.
 */
export type DruxtDevtoolsStatus = 'ready' | 'default' | 'error'

/** A Druxt module on the page. */
export interface DruxtDevtoolsModule {
  /** The instance's id. It is unique on the page. */
  id: string
  /** The module component, such as `DruxtEntity`. */
  component: string
  /** The wrapper candidates, most specific first. */
  candidates: string[]
  /** The wrapper it resolved. It is null when the module renders Druxt's default, or asked for no wrapper. */
  wrapper: string | null
  /** The key its data is held under. */
  key?: string
  /** How it rendered. */
  status: DruxtDevtoolsStatus
  /** The failure's HTTP status, when it failed. */
  statusCode?: number
  /** The failure, in one line, without a URL. */
  error?: string
  /** Whether the module fails quietly. A quiet module renders nothing in place of its error. */
  quiet?: boolean
  /** A summary of what the module hands its wrapper. */
  props: Record<string, unknown>
  /** A summary of its declared state. */
  state: Record<string, unknown>
  /** Its settings, from the wrapper. */
  settings: Record<string, unknown>
  /** The id of the schema it rendered with. */
  schema?: string
  /** Notes the module adds about itself. */
  notes: DruxtDevtoolsNote[]
  /** The files the create action can write. Only a module that renders Druxt's default has them. */
  templates?: DruxtDevtoolsTemplate[]
}

/**
 * The modules that render Druxt's default output for one component and one candidate list.
 *
 * Modules with the same component and the same candidates share one entry.
 */
export interface DruxtDevtoolsMissingEntry {
  /** The entry's identity: the component and the candidates, joined. */
  key: string
  /** The module component, such as `DruxtEntity`. */
  component: string
  /** The wrapper candidates, most specific first. */
  candidates: string[]
  /**
   * The most specific candidate in words, without the component's name.
   *
   * For `DruxtEntityNodeArticleFull` it is `node · article · full`.
   */
  meta: string
  /** How many instances the page has. */
  count: number
  /** The files the create action can write. */
  templates: DruxtDevtoolsTemplate[]
}

/** The missing wrappers of one module component. */
export interface DruxtDevtoolsMissingGroup {
  /** The module component. */
  component: string
  /** Its entries, one for each candidate list. */
  entries: DruxtDevtoolsMissingEntry[]
}

/** A module that failed quietly. */
export interface DruxtDevtoolsQuietError {
  /** The id of the instance that failed. */
  id: string
  /** The component that failed. */
  component: string
  /** The HTTP status, when the failure's summary starts with one. */
  status?: string
  /** The failure, without its status or a URL. */
  detail: string
}

/** What a request was for. */
export type DruxtDevtoolsRequestKind = 'jsonapi' | 'schema' | 'date-formats' | 'other'

/** A request a module made, or one the store answered without the network. */
export interface DruxtDevtoolsRequest {
  /** The request's id. */
  id: string
  /** What the request was for. */
  kind: DruxtDevtoolsRequestKind
  /** The path, without the origin. */
  path: string
  /** The HTTP status, for a network request. */
  status?: number
  /** When it started, in milliseconds from the start of the page on its side. */
  start: number
  /** How long it took, in milliseconds. It is zero when the store answered. */
  duration: number
  /** Whether it went to the network, or the store already held the answer. */
  source: 'network' | 'store'
  /** Where it ran: in the server render, or in the browser. */
  side: 'server' | 'browser'
  /** The page a server render's request was made for: the page's path and query, without a hash. */
  page?: string
  /** Drupal's reason, when its answer was partial. Drupal omits resources, as it does for lack of permission. */
  partial?: string
}

/** Where a setting's value came from: the site's config, Drupal, or a module's default. */
export type DruxtDevtoolsTier = 'site' | 'drupal' | 'default'

/** One resolved setting, by its dotted key. */
export interface DruxtDevtoolsSetting {
  /** The dotted key. */
  key: string
  /** The resolved value. */
  value: unknown
  /** Where the value came from. */
  tier: DruxtDevtoolsTier
}

/**
 * A piece of a module's section: a list of keys and values, a table, or a tree.
 *
 * A block is data, and the element renders it. A module never supplies markup.
 */
export type DruxtDevtoolsBlock =
  | { type: 'pairs', title?: string, items: Record<string, unknown> }
  | { type: 'table', title?: string, columns: string[], rows: unknown[][] }
  | { type: 'tree', title?: string, value: unknown }

/** A named action a module offers, such as clearing a cache. Its handler runs in the app. */
export interface DruxtDevtoolsAction {
  /** The action's id. */
  id: string
  /** The text on its button. */
  label: string
  /** The id of the section it shows in. */
  section?: string
}

/** A section a module adds to the tools, with its data and actions. */
export interface DruxtDevtoolsModuleSection {
  /** The section's id. */
  id: string
  /** The section's name, shown on its tab. */
  label: string
  /** The section's data. */
  blocks: DruxtDevtoolsBlock[]
  /** The actions whose `section` is this section's id. */
  actions: DruxtDevtoolsAction[]
}

/** A labelled event a module adds to the timeline, beside the requests. */
export interface DruxtDevtoolsTimelineEvent {
  /** The event's id. */
  id: string
  /** What happened, such as `views refetch`. */
  label: string
  /** Why it happened, or more about it, such as `filter changed`. */
  detail?: string
  /** Who added it, such as the module's name. */
  source?: string
  /** When it happened, in milliseconds on the page's clock. */
  time: number
}

/** Everything the tools show, at one moment. It is JSON-serializable. */
export interface DruxtDevtoolsSnapshot {
  /** The current page's path. */
  page: string
  /** The modules, in the order they were reported. */
  modules: DruxtDevtoolsModule[]
  /** The missing wrappers, grouped by module component. */
  missing: DruxtDevtoolsMissingGroup[]
  /** The quiet failures. */
  quiet: DruxtDevtoolsQuietError[]
  /** The current page's requests. Only the latest 500 are kept. */
  requests: DruxtDevtoolsRequest[]
  /** The resolved settings. */
  settings: DruxtDevtoolsSetting[]
  /** The sections modules added, in the order they were added. */
  sections: DruxtDevtoolsModuleSection[]
  /** The events modules added to the timeline, for the current page. */
  timeline: DruxtDevtoolsTimelineEvent[]
}

/** A quiet failure that is not a module's own, such as a standalone field the display does not show. */
export interface DruxtDevtoolsQuietEvent {
  /** The id of the instance that failed. */
  id: string
  /** The component that failed. */
  component: string
  /** The failure in one line. Null once it has recovered. */
  summary: string | null
}

/** What a host emits. Every event is JSON-serializable, so it can cross a frame or a process. */
export type DruxtDevtoolsEvent =
  | { type: 'page', path: string }
  | { type: 'module:resolved', module: DruxtDevtoolsModule }
  | { type: 'module:missing', module: DruxtDevtoolsModule }
  | { type: 'module:removed', id: string }
  | { type: 'module:note', id: string, note: DruxtDevtoolsNote }
  /** Clears a module's note once it no longer applies. The `key` is the note's key, or its kind when it had no key. */
  | { type: 'module:note:removed', id: string, key: string }
  | { type: 'quiet', error: DruxtDevtoolsQuietEvent }
  | { type: 'request', request: DruxtDevtoolsRequest }
  | { type: 'settings', settings: DruxtDevtoolsSetting[] }
  /** A module adds or updates a section. */
  | { type: 'section', section: Omit<DruxtDevtoolsModuleSection, 'actions'> }
  | { type: 'section:removed', id: string }
  /** A module offers an action. The channel's `registerAction()` emits it, and keeps the handler on the host. */
  | { type: 'action', action: DruxtDevtoolsAction }
  | { type: 'action:removed', id: string }
  | { type: 'timeline', event: DruxtDevtoolsTimelineEvent }
  /**
   * A module took its data from a payload it did not fetch: the server's, or another instance's.
   *
   * The snapshot keeps no record of it.
   */
  | { type: 'module:restored', id: string, component: string, key?: string }

/** A subscriber. It is called with each event, after the snapshot has the event. */
export type DruxtDevtoolsListener = (event: DruxtDevtoolsEvent) => void

/** The channel between a host and its tools. */
export interface DruxtDevtoolsChannel {
  /** Reports an event to the snapshot and to every subscriber. */
  emit: (event: DruxtDevtoolsEvent) => void
  /** Listens for events. It returns a function that stops listening. */
  subscribe: (listener: DruxtDevtoolsListener) => () => void
  /** Gets everything reported so far, as a copy. */
  snapshot: () => DruxtDevtoolsSnapshot
  /** Offers an action whose handler runs in the host. It returns a function that withdraws the action. */
  registerAction: (action: DruxtDevtoolsAction, handler: () => unknown) => () => void
  /** Runs an action's handler, as a tool's button does. It resolves with what the handler returns. */
  runAction: (id: string) => Promise<unknown>
}

/** The most requests kept, and the most timeline events. A long session in development keeps the latest. */
const MAX_REQUESTS = 500

/**
 * The most modules whose notes are held before the module reports.
 *
 * Past it, the notes of the module that has waited longest are dropped. So a note for a module that never reports is
 * dropped first.
 */
const MAX_PENDING = 100

/**
 * Gets a note's identity on its module.
 *
 * @param note - The note.
 * @returns The note's key, or its kind when it has no key.
 */
export const noteKey = (note: DruxtDevtoolsNote): string => note.key ?? note.kind

/**
 * Describes a module's most specific candidate in words, without the component's name.
 *
 * @param component - The module component, such as `DruxtEntity`.
 * @param candidates - Its candidates, most specific first.
 * @returns The words, such as `node · article · full`.
 */
export const describeCandidate = (component: string, candidates: readonly string[]): string =>
  (candidates[0] || '').replace(component, '').split(/(?=[A-Z])/).filter(Boolean).map((part) => part.toLowerCase()).join(' · ')

/**
 * Splits a failure's summary into its status code and the rest.
 *
 * @param summary - The failure in one line, such as `403: Forbidden`.
 * @returns The `status`, when the summary starts with three digits, and the `detail`. Without a status, the detail
 * is the whole summary.
 */
export const splitStatus = (summary: string): { status?: string, detail: string } => {
  const status = /^\d{3}\b/.exec(summary)?.[0]
  return status ? { status, detail: summary.slice(status.length).replace(/^:/, '').trim() } : { detail: summary }
}

/**
 * Gets the missing wrappers among the modules, grouped by component.
 *
 * Only a module with the `default` status counts. Modules with the same component and the same candidates share one
 * entry, and the entry counts them.
 *
 * @param modules - The page's modules.
 * @returns The groups, one for each component.
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

/** Copies a value through JSON, so a subscriber cannot change the channel's state through it. */
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/**
 * Creates a channel, and the snapshot it keeps.
 *
 * @returns The channel.
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

  // The notes that arrived before their module did, with the module that has waited longest first.
  const notes = new Map<string, DruxtDevtoolsNote[]>()

  // Holds a module's notes until it reports. The module moves to the end of the queue, and an empty list is not held.
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
  // Each action's current registration. Only that registration's own disposer withdraws the action.
  const registrations = new Map<string, object>()
  let timeline: DruxtDevtoolsTimelineEvent[] = []
  const listeners = new Set<DruxtDevtoolsListener>()

  // Adds a note to a list. It replaces a note with the same key.
  const addNote = (list: DruxtDevtoolsNote[], note: DruxtDevtoolsNote): DruxtDevtoolsNote[] => [...list.filter((n) => noteKey(n) !== noteKey(note)), note]

  const apply = (event: DruxtDevtoolsEvent): void => {
    switch (event.type) {
      case 'page':
        // A new page starts with no requests and no timeline events. Its modules are not cleared here, because each
        // leaves as it unmounts. The notes held for a module of the last page that never reported are dropped.
        if (event.path !== page) {
          requests = []
          timeline = []
          notes.clear()
        }
        page = event.path
        break
      case 'module:resolved':
      case 'module:missing': {
        // A host reports a module again on each refresh, and the module's notes come from elsewhere. So a new report
        // keeps the notes the module had, then adds the event's notes, then the notes held for it.
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
        registrations.delete(event.id)
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
      // An object marks this registration. The handler cannot, because a later registration under the same id may
      // pass the same function.
      const registration = {}
      handlers.set(action.id, handler)
      registrations.set(action.id, registration)
      this.emit({ type: 'action', action })
      return () => {
        if (registrations.get(action.id) === registration) this.emit({ type: 'action:removed', id: action.id })
      }
    },
    async runAction(id) {
      const handler = handlers.get(id)
      if (!handler) throw new Error(`No Druxt devtools action "${id}".`)
      return await handler()
    },
  }
}
