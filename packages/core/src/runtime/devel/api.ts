import { druxtDevtools as installed } from '#build/druxt/devtools.mjs'
import { whenDruxtDevtools } from './utils/channel'
import { devtoolsTime, sectionProviders, showSection } from './utils/sections'
import { addModuleNote, removeModuleNote } from './registry'
import type { DruxtDevtoolsAction, DruxtDevtoolsBlock } from './types'

export type { DruxtDevtoolsAction, DruxtDevtoolsBlock }

/** A section a module registered: refresh it after its data changes, or remove it. */
export interface DruxtDevtoolsSectionHandle {
  /** Reads the section's data again and shows it. */
  refresh: () => void
  /** Takes the section out of the tools. */
  remove: () => void
}

/** What a module adds to the development tools. Every call does nothing outside development in the browser. */
export interface DruxtDevtoolsApi {
  /**
   * Adds a section: a tab in Nuxt DevTools, a node in Vue DevTools' Druxt inspector, and lines in the console summary.
   * The provider returns its data as blocks, read again on each page and as modules report, or on `refresh()`.
   */
  section: (section: { id: string, label: string }, provider: () => DruxtDevtoolsBlock[]) => DruxtDevtoolsSectionHandle
  /** Adds a labelled event to the timeline, beside the requests, such as `views refetch` with `filter changed`. */
  event: (label: string, detail?: string) => void
  /** Offers an action, with a handler that runs in the app. Returns the function that withdraws it. */
  action: (action: DruxtDevtoolsAction, handler: () => unknown) => () => void
  /** Adds a note to a module: see `addModuleNote()`. */
  note: typeof addModuleNote
  /** Clears a module's note: see `removeModuleNote()`. */
  removeNote: typeof removeModuleNote
}

// A section's id: letters, digits, `_`, `:` and `-`.
const SECTION_ID = /^[\w:-]+$/

const noop = (): void => {}
const NOOP: DruxtDevtoolsApi = {
  section: () => ({ refresh: noop, remove: noop }),
  event: noop,
  action: () => noop,
  note: noop,
  removeNote: noop,
}

/**
 * Adds a module's own sections, timeline events and actions to the development tools: the Nuxt DevTools tab, Vue
 * DevTools and the console summary. A module never imports `@druxt/devtools` and never guards: outside development in
 * the browser, or without the tools installed, every call does nothing.
 *
 * @example <caption>A plugin a module registers with `addDruxtDevtoolsPlugin()`</caption> @lang ts
 * export default defineNuxtPlugin(() => {
 *   const route = useRoute()
 *   const devtools = useDruxtDevtools()
 *   const section = devtools.section({ id: 'route', label: 'Route' }, () => [{ type: 'pairs', items: { path: route.path } }])
 *   watch(() => route.path, () => section.refresh())
 *   devtools.action({ id: 'route:reload', label: 'Fetch this route again', section: 'route' }, () => refreshNuxtData())
 * })
 */
export function useDruxtDevtools(): DruxtDevtoolsApi {
  if (!import.meta.dev || !import.meta.client || !installed) return NOOP
  return {
    section({ id, label }, provider) {
      // An id is a selector and a tab key, so it stays to letters, digits, `_`, `:` and `-`.
      if (!SECTION_ID.test(id)) {
        console.warn(`[druxt] The devtools section id "${id}" is not allowed: use letters, digits, _, : and -. The section is not added.`)
        return NOOP.section({ id, label }, provider)
      }
      const entry = { label, provider }
      const providers = sectionProviders()
      providers.set(id, entry)
      whenDruxtDevtools((channel) => showSection(channel, id, entry))
      return {
        refresh: () => whenDruxtDevtools((channel) => { if (providers.get(id) === entry) showSection(channel, id, entry) }),
        remove: () => {
          if (providers.get(id) !== entry) return
          providers.delete(id)
          whenDruxtDevtools((channel) => channel.emit({ type: 'section:removed', id }))
        },
      }
    },
    event(label, detail) {
      const time = devtoolsTime()
      whenDruxtDevtools((channel) => channel.emit({ type: 'timeline', event: { id: `${label}:${time}`, label, ...(detail ? { detail } : {}), time } }))
    },
    action(action, handler) {
      let withdraw = noop
      let withdrawn = false
      whenDruxtDevtools((channel) => { if (!withdrawn) withdraw = channel.registerAction(action, handler) })
      return () => {
        withdrawn = true
        withdraw()
      }
    },
    note: addModuleNote,
    removeNote: removeModuleNote,
  }
}
