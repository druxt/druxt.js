import { computed, shallowReactive } from 'vue'
import { defineStore } from 'pinia'
import { tryUseNuxtApp } from '#app'
import {
  applySaved,
  anchorOf,
  createDraft,
  discardDraft,
  draftErrors,
  draftKey,
  draftPayload,
  DRUXT_JSONAPI_DESTINATION,
  editDraft,
  findDraft,
  jsonApiDestination,
  rebaseDraft,
  setDraftErrors,
  startSave,
  updateDraft,
} from '@druxt/core/edit'
import type {
  DruxtAnchoredElement,
  DruxtDraft,
  DruxtDraftMatch,
  DruxtDraftPayload,
  DruxtEditDestination,
  DruxtEditError,
  DruxtEditResource,
  DruxtEditTarget,
} from '@druxt/core/edit'
import type { DruxtAnchorDescriptor } from '@druxt/core/anchors'
import type { DruxtSettings } from '@druxt/client'
import { useDruxtSettings } from './settings'
import { useDruxtStore } from './store'

/** The `druxt.editing` settings: whether editing is on, and the destination a draft saves to when it names none. */
export interface DruxtEditingSettings {
  /** Whether the site offers editing. `false` makes `useDruxtEditing()` answer `denied`. On by default. */
  enabled?: boolean
  /** The destination a draft saves to when it names none. `jsonapi` by default. */
  destination?: string
  /**
   * Whether a saved entity's draft outlives the form that edits it. On by default.
   *
   * When on, a form that comes back after a navigation shows its unsaved edits. `false` closes the draft when the
   * form unmounts.
   *
   * `DruxtEntityForm`, from `@druxt/entity`, reads this setting. The store itself keeps a draft until an editor
   * closes it.
   */
  persistDrafts?: boolean
}

/** What the `druxt:edit:*` hooks receive: the draft's key, the entity, and the fields it changed. */
export interface DruxtEditEvent {
  key: string
  entity: { type: string, id?: string, langcode?: string }
  /** The changed fields. For `druxt:edit:start`, the field the edit started on, when one is named. */
  fields: string[]
}

/** What `druxt:edit:save` receives beside the event: the destination, what it sent and how the save went. */
export interface DruxtEditSaveEvent extends DruxtEditEvent {
  destination: string
  payload: DruxtDraftPayload
  /** Whether the save went through. Either Drupal holds the change, or the destination staged it elsewhere. */
  ok: boolean
  /**
   * `staged` when the destination took the change elsewhere and answered no resource. Drupal doesn't hold the change
   * yet.
   */
  status?: 'staged'
  /** `refused` when the destination's `canSave()` said no and nothing was sent. */
  reason?: 'refused'
  /** The saved resource, when the destination answered one. */
  data?: DruxtEditResource
  /** The errors of a failed save. */
  errors: DruxtEditError[]
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    /** A draft started. This is its first edit, or an editor's `start()`, which names the field when one is given. */
    'druxt:edit:start': (event: DruxtEditEvent) => void | Promise<void>
    /**
     * A draft's save ended, through whichever destination ran. The event has `ok`, and the saved resource or the
     * errors.
     */
    'druxt:edit:save': (event: DruxtEditSaveEvent) => void | Promise<void>
    /** A draft's edits were discarded. */
    'druxt:edit:cancel': (event: DruxtEditEvent) => void | Promise<void>
  }
}

/** What `save()` takes: the client to write with, the fields it may send, and who saves. */
export interface DruxtEditSaveOptions {
  /** The client to write with, so the write carries its credentials. The app's `$druxt` when not given. */
  client?: unknown
  /** The JSON:API prefix to write to. The draft's own when not given. */
  prefix?: string
  /** The fields the save may send, such as a form display's, in place of the draft's own. */
  fields?: string[]
  /** Who saves, as the consumer names itself. */
  origin?: string
}

/**
 * How a save went.
 *
 * A failed save carries Drupal's errors and response, and whether no response came back.
 */
export interface DruxtEditSaveOutcome {
  /** Whether the save went through. Either Drupal holds the change, or the destination staged it elsewhere. */
  ok: boolean
  /**
   * `staged` when the destination took the change elsewhere and answered no resource. Drupal doesn't hold the change
   * yet.
   */
  status?: 'staged'
  /** `refused` when the destination's `canSave()` said no and nothing was sent. */
  reason?: 'refused'
  /** The draft's key after the save. A new entity's key changes to the key of its id. */
  key: string
  /** The saved resource, when the destination answered one. */
  data?: DruxtEditResource
  /** The destination's whole response, or the failed response's document. */
  response?: unknown
  errors: DruxtEditError[]
  /** The failed response's status. */
  statusCode?: number
  /** Whether no response came back. */
  network?: boolean
  /** Why nothing was sent: no such draft, a save already running, or no such destination. */
  skipped?: 'missing' | 'saving' | 'destination'
}

/** What `open()` takes beside the target and the pristine resource. */
export interface DruxtEditOpenOptions {
  /** The JSON:API prefix the entity was read under. */
  prefix?: string
  /** The fields a save may send. */
  fields?: string[]
  /** The destination its save goes to. */
  destination?: string
  /** Drops any edits the draft holds. An editor sets it when it loads the entity afresh on purpose. */
  reset?: boolean
}

/** The code that development logs when a save names a destination no module added. */
const DRUXT_E_EDIT_DESTINATION = 'DRUXT_E01003'

/** A plain deep copy. */
const copy = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)) as T)

/**
 * The edit store: one draft per entity and language, shared by every editor on the page.
 *
 * It sits over the framework-free model in `@druxt/core/edit`. DruxtEntityForm is one consumer of it. An inline
 * editor, an overlay tool or an admin screen reads and writes the same drafts. So a field edited in place and the
 * same entity's form show one state.
 *
 * Drafts live in the browser's app for as long as it runs, so they survive navigation. They never reach the payload.
 * The store keeps them out of its serialized state, so no draft, and nothing a client holds, is ever in the page.
 *
 * A save goes to a destination:
 *
 * - The JSON:API destination is the default. It writes through the client it is given.
 * - A module adds another with `addDestination()`.
 *
 * When the destination answers a save with a resource, that resource is published into the core store, so every
 * module reading the entity renders it.
 *
 * The `druxt:edit:start`, `druxt:edit:save` and `druxt:edit:cancel` app hooks fire from here, whichever editor or
 * destination acted.
 *
 * @example <caption>Edit a field of an entity, then save it</caption> @lang ts
 * const edits = useDruxtEditStore()
 * const key = edits.open({ type: 'node--page', id, langcode: 'en' }, entity, { prefix: 'en' })
 * edits.edit(key, 'title', 'About us')
 * const { ok, errors } = await edits.save(key)
 */
export const useDruxtEditStore = defineStore('druxtEdit', () => {
  const nuxtApp = tryUseNuxtApp()
  const store = useDruxtStore()
  // The drafts are deliberately not part of the store's returned state, so Pinia never serializes one into the
  // payload.
  const drafts = shallowReactive<Record<string, DruxtDraft>>({})
  const destinations = new Map<string, DruxtEditDestination>([[jsonApiDestination.name, jsonApiDestination]])
  // The editors holding each draft, by key. With it, a batch save never sends a new entity that no editor shows any
  // more.
  const holders = new Map<string, Set<string>>()
  // The resolved `druxt.editing` settings. They are read in setup, where the Nuxt app is reachable.
  const resolved = nuxtApp ? nuxtApp.runWithContext(() => useDruxtSettings()) as DruxtSettings : undefined
  const settings = (): DruxtEditingSettings => (resolved?.editing as DruxtEditingSettings | undefined) || {}

  // The event a hook receives for a draft. Its fields are the changed fields unless others are given.
  const event = (draft: DruxtDraft, fields: string[] = draft.dirty): DruxtEditEvent => ({
    key: draft.key,
    entity: { type: draft.type, ...(draft.id ? { id: draft.id } : {}), ...(draft.langcode ? { langcode: draft.langcode } : {}) },
    fields: [...fields],
  })
  // Calls an app hook. Without a Nuxt app, it does nothing.
  const call = async <K extends 'druxt:edit:start' | 'druxt:edit:save' | 'druxt:edit:cancel'>(name: K, payload: K extends 'druxt:edit:save' ? DruxtEditSaveEvent : DruxtEditEvent): Promise<void> => {
    try {
      await (nuxtApp?.callHook as ((name: string, payload: unknown) => Promise<unknown>) | undefined)?.(name, payload)
    } catch (err) {
      // A hook's own failure never undoes the edit or the save it reports. Development logs it.
      if (import.meta.dev) console.error(err)
    }
  }

  /** Sets a draft. Fires `druxt:edit:start` when the draft changed for the first time. */
  const put = (next: DruxtDraft, before?: DruxtDraft): DruxtDraft => {
    drafts[next.key] = next
    if (before && !before.dirty.length && next.dirty.length) void call('druxt:edit:start', event(next))
    return next
  }

  /**
   * Opens the draft of an entity. It is created with the pristine resource given.
   *
   * A draft that already exists keeps its edits, over the newer pristine resource. So an editor that comes back
   * after a navigation finds them. `reset` drops them and creates the draft again.
   *
   * @param target - The entity.
   * @param pristine - The entity as loaded, or a blank resource for a new one.
   * @param options - The prefix, the fields a save may send, the destination, and whether to drop any edits.
   * @returns The draft's key.
   */
  const open = (target: DruxtEditTarget, pristine: DruxtEditResource, options: DruxtEditOpenOptions = {}): string => {
    const key = draftKey({ ...target, id: target.id || pristine.id })
    const existing = drafts[key]
    if (!existing || options.reset) {
      drafts[key] = createDraft(target, pristine, options)
      return key
    }
    let next = rebaseDraft(existing, pristine)
    if (options.prefix !== undefined && next.prefix !== options.prefix) next = { ...next, prefix: options.prefix }
    if (options.fields) next = { ...next, fields: [...options.fields] }
    if (options.destination) next = { ...next, destination: options.destination }
    if (next !== existing) drafts[key] = next
    return key
  }

  /**
   * Sets one field of a draft.
   *
   * @param key - The draft's key.
   * @param field - The field's id.
   * @param value - An attribute's value, or a relationship as `{ data }`.
   * @param options - Whether the field is a relationship, and who made the change.
   */
  const edit = (key: string, field: string, value: unknown, options: { relationship?: boolean, origin?: string } = {}): void => {
    const draft = drafts[key]
    if (draft) put(editDraft(draft, field, value, options), draft)
  }

  /**
   * Sets every field of a resource on a draft. A form does this with its entity after a change.
   *
   * @param key - The draft's key.
   * @param resource - The resource.
   * @param origin - Who made the change.
   */
  const update = (key: string, resource: Pick<DruxtEditResource, 'attributes' | 'relationships'>, origin?: string): void => {
    const draft = drafts[key]
    if (!draft) return
    const next = updateDraft(draft, resource, origin)
    if (next !== draft) put(next, draft)
  }

  /**
   * Sets a draft's errors, such as those of an editor's own required check.
   *
   * With no errors, a draft whose save failed goes back to `idle`.
   *
   * @param key - The draft's key.
   * @param errors - The errors.
   */
  const setErrors = (key: string, errors: DruxtEditError[] | undefined): void => {
    const draft = drafts[key]
    if (draft) drafts[key] = setDraftErrors(draft, errors, errors?.length ? draft.status : (draft.status === 'failed' ? 'idle' : draft.status))
  }

  /**
   * Fires `druxt:edit:start` for a draft. An inline editor does this when it opens on a field.
   *
   * @param key - The draft's key.
   * @param field - The field the edit starts on.
   */
  const start = (key: string, field?: string): void => {
    const draft = drafts[key]
    if (draft) void call('druxt:edit:start', event(draft, field ? [field] : []))
  }

  /**
   * Drops a draft's edits and errors. Fires `druxt:edit:cancel` with the fields it changed.
   *
   * @param key - The draft's key.
   * @param origin - Who discarded it.
   */
  const discard = (key: string, origin?: string): void => {
    const draft = drafts[key]
    if (!draft) return
    drafts[key] = discardDraft(draft, origin)
    void call('druxt:edit:cancel', event(draft))
  }

  /**
   * Forgets a draft, with its edits. An editor does this when it is done with an entity on purpose.
   *
   * @param key - The draft's key.
   */
  const close = (key: string): void => {
    delete drafts[key]
    holders.delete(key)
  }

  /** Forgets every draft. */
  const closeAll = (): void => {
    for (const key of Object.keys(drafts)) delete drafts[key]
    holders.clear()
  }

  /**
   * Records that an editor shows a draft. A form does this while it is mounted.
   *
   * @param key - The draft's key.
   * @param holder - The editor's name.
   */
  const hold = (key: string, holder: string): void => {
    if (!holders.has(key)) holders.set(key, new Set())
    holders.get(key)!.add(holder)
  }

  /**
   * Records that an editor no longer shows a draft.
   *
   * @param key - The draft's key.
   * @param holder - The editor's name.
   */
  const release = (key: string, holder: string): void => {
    holders.get(key)?.delete(holder)
    if (!holders.get(key)?.size) holders.delete(key)
  }

  /**
   * Adds a destination drafts can save to. It replaces one of the same name.
   *
   * @param destination - The destination, from `defineDruxtEditDestination()`.
   */
  const addDestination = (destination: DruxtEditDestination): void => {
    destinations.set(destination.name, destination)
  }

  /**
   * Saves a draft through its destination.
   *
   * The destination is the draft's own, else the `druxt.editing.destination` setting, else JSON:API.
   *
   * - When the destination answers a resource, it becomes the draft's pristine resource. It is also published into
   *   the core store, so every module reading the entity renders it.
   * - A failure keeps the edits, and puts Drupal's errors on the draft, keyed by their pointer.
   * - `druxt:edit:save` fires either way.
   *
   * Nothing is sent when there is no such draft, a save of it is already running, or no module added its
   * destination. The outcome's `skipped` says which.
   *
   * @param key - The draft's key.
   * @param options - The client to write with, the prefix, the fields it may send, and who saves.
   * @returns How it went.
   */
  const save = async (key: string, options: DruxtEditSaveOptions = {}): Promise<DruxtEditSaveOutcome> => {
    const draft = drafts[key]
    if (!draft) return { ok: false, key, errors: [], skipped: 'missing' }
    if (draft.status === 'saving') return { ok: false, key, errors: [], skipped: 'saving' }
    const name = draft.destination || settings().destination || DRUXT_JSONAPI_DESTINATION
    const destination = destinations.get(name)
    if (!destination) {
      if (import.meta.dev) console.error(`[druxt] ${DRUXT_E_EDIT_DESTINATION}: The draft of ${draft.type} saves to the ${name} destination, which no module added, so it did not save. Add it with useDruxtEditStore().addDestination(), or set druxt.editing.destination to one that exists.`)
      return { ok: false, key, errors: [], skipped: 'destination' }
    }
    const payload = draftPayload(draft, options.fields)
    const prefix = options.prefix ?? draft.prefix
    const context = { payload, client: options.client ?? nuxtApp?.$druxt, prefix }
    const saving = startSave(draft, name, payload, options.origin)
    // The draft is `saving` before `canSave()` answers, which may take a while. A second save meanwhile is then
    // skipped as already running.
    drafts[key] = saving
    // A `canSave()` that rejects decided nothing. It is reported as a save that failed, and nothing is sent.
    try {
      if (destination.canSave && !(await destination.canSave(draft, context))) {
        // Nothing was sent, so the draft leaves `saving`. It goes back to what it was before. When an edit was made
        // meanwhile, that edit is kept, unsent.
        const current = drafts[key]
        if (current === saving) drafts[key] = { ...draft, revision: saving.revision + 1 }
        else if (current?.status === 'saving') {
          drafts[key] = { ...current, status: draft.status === 'staged' ? 'idle' : draft.status, pending: null, revision: current.revision + 1 }
        }
        await call('druxt:edit:save', { ...event(draft, Object.keys({ ...payload.attributes, ...payload.relationships })), destination: name, payload, ok: false, reason: 'refused', errors: [] })
        return { ok: false, key, errors: [], reason: 'refused' }
      }
      const result = (await destination.save(saving, context)) || {}
      const data = result.data?.type && result.data.id ? result.data : undefined
      // Drupal's answer is published, so every reader of the entity renders it. The core store holds the one copy of
      // each resource.
      if (data) store.addResource({ prefix, resource: { data: copy(data) as never } })
      // A draft that an editor closed while the write ran stays closed. The result never brings it back.
      const current = drafts[key]
      const next = applySaved(current || saving, payload, data)
      if (current) {
        if (next.key !== key) delete drafts[key]
        drafts[next.key] = next
      }
      await call('druxt:edit:save', { ...event(next, Object.keys({ ...payload.attributes, ...payload.relationships })), destination: name, payload, ok: true, ...(data ? { data: copy(data) } : { status: 'staged' as const }), errors: [] })
      return { ok: true, key: next.key, ...(data ? { data } : { status: 'staged' as const }), response: result.response, errors: [] }
    } catch (err) {
      const failed = err as { response?: { status?: number, data?: { errors?: unknown } } }
      const document = failed.response?.data
      const errors = (Array.isArray(document?.errors) ? document.errors : []) as DruxtEditError[]
      const current = drafts[key]
      if (current) drafts[key] = setDraftErrors({ ...current, pending: null }, errors, 'failed')
      await call('druxt:edit:save', { ...event(current || saving, Object.keys({ ...payload.attributes, ...payload.relationships })), destination: name, payload, ok: false, errors: copy(errors) })
      return { ok: false, key, response: document, errors, statusCode: failed.response?.status, network: !failed.response }
    }
  }

  /**
   * Saves every changed draft, or the drafts named, one after another.
   *
   * A new entity's draft that no editor holds is never sent, as no one can see what it would create.
   *
   * @param keys - The drafts' keys. Every changed draft when not given.
   * @param options - What `save()` takes, for each.
   * @returns How each went, in order.
   */
  const saveAll = async (keys?: string[], options: DruxtEditSaveOptions = {}): Promise<DruxtEditSaveOutcome[]> => {
    const outcomes: DruxtEditSaveOutcome[] = []
    // A staged draft waits on its destination, so a batch never stages it twice.
    const sendable = (draft: DruxtDraft) => draft.dirty.length > 0 && draft.status !== 'staged' && (!!draft.pristine.id || !!holders.get(draft.key)?.size)
    for (const key of keys ?? Object.values(drafts).filter(sendable).map((draft) => draft.key)) {
      outcomes.push(await save(key, options))
    }
    return outcomes
  }

  return {
    /** Every draft, by key. It is read-only: change a draft through the store's actions. */
    drafts: computed(() => drafts as Readonly<Record<string, DruxtDraft>>),
    /** The drafts with changes. */
    dirty: computed(() => Object.values(drafts).filter((draft) => draft.dirty.length > 0)),
    /**
     * A draft by its key.
     *
     * @param key - The draft's key.
     */
    get: (key: string): DruxtDraft | undefined => drafts[key],
    /**
     * The draft an anchor names, with its field and item. An inline editor reads it for the element it opened on.
     *
     * @param anchor - The anchors, as `findAnchor()` takes them.
     */
    fromAnchor: (anchor: DruxtAnchorDescriptor): DruxtDraftMatch | undefined => findDraft(drafts, anchor),
    /**
     * The draft of the entity an element renders. It is read from the anchors on the element and around it.
     *
     * @param element - The element, such as an event's target.
     */
    fromElement: (element: DruxtAnchoredElement | null | undefined): DruxtDraftMatch | undefined => findDraft(drafts, anchorOf(element)),
    /**
     * Every error of a draft, in pointer order.
     *
     * @param key - The draft's key.
     */
    errors: (key: string): DruxtEditError[] => (drafts[key] ? draftErrors(drafts[key]) : []),
    open,
    edit,
    update,
    setErrors,
    start,
    discard,
    close,
    closeAll,
    hold,
    release,
    addDestination,
    save,
    saveAll,
  }
})
