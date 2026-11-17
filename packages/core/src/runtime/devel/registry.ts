import { reactive } from 'vue'
import type { ComponentInternalInstance } from 'vue'
import type { DruxtModuleContext } from '../context'
import type { DruxtTemplateConfig } from '../types'
import { druxtDevtools } from './utils/channel'
import { moduleContexts, moduleInstances } from './utils/devtools'
import type { DruxtDevtoolsNote } from './types'

/** A module on the page that rendered no wrapper. */
export interface MissingWrapper {
  uid: number
  component: string
  options: string[]
  props: string[]
  slots: string[]
  template: DruxtTemplateConfig
}

/** The modules that rendered no wrapper for the same component and candidate names, counted. */
export interface MissingWrapperGroup extends Omit<MissingWrapper, 'uid'> {
  count: number
}

// The group each instance is in, by uid. Only `registerMissing()` and `unregisterMissing()` below change it.
const instances = new Map<number, string>()
const registry = reactive(new Map<string, MissingWrapperGroup>())

/**
 * The modules missing a wrapper. There is one entry per component and candidate list, with a count.
 *
 * Only in development, in the browser.
 */
export const missingWrappers: ReadonlyMap<string, MissingWrapperGroup> = registry

/**
 * Lists a module as rendering no wrapper.
 *
 * Modules with the same component and candidate names share one entry, which counts them.
 *
 * @param entry - The module's details.
 */
export const registerMissing = (entry: MissingWrapper): void => {
  unregisterMissing(entry.uid)
  const { uid, ...details } = entry
  const key = `${entry.component}:${entry.options.join(',')}`
  instances.set(uid, key)
  const group = registry.get(key)
  if (group) group.count += 1
  else registry.set(key, { ...details, count: 1 })
}

/**
 * Drops a module from the list, once it has a wrapper or is gone.
 *
 * @param uid - The module instance's uid.
 */
export const unregisterMissing = (uid: number): void => {
  const key = instances.get(uid)
  if (key === undefined) return
  instances.delete(uid)
  const group = registry.get(key)
  if (!group) return
  if (group.count > 1) group.count -= 1
  else registry.delete(key)
}

/** A module that failed quietly. It rendered nothing in place of its error, and reports the error here. */
export interface DevelNote {
  uid: number
  component: string
  summary: string
}

const notes = reactive(new Map<number, DevelNote>())

/** The modules that failed quietly, by instance uid. Only in development, in the browser. */
export const develNotes: ReadonlyMap<number, DevelNote> = notes

/**
 * Lists a module's quiet failure, in place of the inline error it did not render.
 *
 * @param note - The module instance's uid, its component and the error's summary.
 */
export const registerNote = (note: DevelNote): void => {
  notes.set(note.uid, note)
  druxtDevtools()?.emit({ type: 'quiet', error: { id: `note:${note.uid}`, component: note.component, summary: note.summary } })
}

/**
 * Drops a module's quiet failure, once it has recovered or is gone.
 *
 * @param uid - The module instance's uid.
 */
export const unregisterNote = (uid: number): void => {
  const note = notes.get(uid)
  if (!note) return
  notes.delete(uid)
  druxtDevtools()?.emit({ type: 'quiet', error: { id: `note:${uid}`, component: note.component, summary: null } })
}

/** What a note is attached to: a module's context, a component instance inside a module, or a module instance's uid. */
export type DruxtNoteTarget = DruxtModuleContext | ComponentInternalInstance | number

/**
 * The id of the module a note target belongs to.
 *
 * For a context, it is the context's module. For an instance, it is the nearest module at or above it. So a
 * wrapper's own instance attaches to the module that rendered it.
 *
 * @param target - The note's target.
 */
const targetId = (target: DruxtNoteTarget): string | undefined => {
  if (typeof target === 'number') return String(target)
  const fromContext = moduleContexts().get(target)
  if (fromContext) return fromContext
  let instance = 'uid' in target && typeof target.uid === 'number' ? target as ComponentInternalInstance | null : null
  while (instance && !moduleInstances().has(String(instance.uid))) instance = instance.parent
  return instance ? String(instance.uid) : undefined
}

/**
 * Adds a note to a module in the development tools, such as a fallback it took.
 *
 * A module keeps one note per key. The key is the note's kind unless one is given. A later note with the same key
 * replaces the earlier one, and a refresh of the module keeps it.
 *
 * It is safe to call anywhere. Outside development in the browser it does nothing.
 *
 * @param target - The module's context from `useDruxtModuleContext()`, a component instance inside the module, such
 * as its wrapper's, or the module instance's uid.
 * @param note - The note: its kind, an optional key, a one-line title and any detail.
 *
 * @example
 * const ctx = useDruxtModuleContext()
 * if (ctx) addModuleNote(ctx, { kind: 'layout-builder-fallback', title: 'Rendered the display without its layout.' })
 */
export const addModuleNote = (target: DruxtNoteTarget, note: DruxtDevtoolsNote): void => {
  if (!import.meta.dev || !import.meta.client) return
  const id = targetId(target)
  if (id) druxtDevtools()?.emit({ type: 'module:note', id, note })
}

/**
 * Clears a module's note in the development tools, once it no longer applies.
 *
 * It is safe to call anywhere. Outside development in the browser it does nothing.
 *
 * @param target - As for `addModuleNote()`.
 * @param key - The note's key. It is the note's kind unless the note was given a key.
 *
 * @example
 * if (ctx) removeModuleNote(ctx, 'layout-builder-fallback')
 */
export const removeModuleNote = (target: DruxtNoteTarget, key: string): void => {
  if (!import.meta.dev || !import.meta.client) return
  const id = targetId(target)
  if (id) druxtDevtools()?.emit({ type: 'module:note:removed', id, key })
}
