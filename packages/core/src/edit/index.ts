// @druxt/core/edit: the draft model that every editor of a Drupal entity shares. The editor can be the form, an inline
// editor, an overlay tool or an admin screen.
//
// It is framework free. Nothing here imports Vue, Nuxt or h3, so a later adapter for another framework keeps the same
// drafts. `useDruxtEditStore()` in core's runtime is one thin store over it.
//
// A draft is one entity in one language. It holds the pristine copy, which is the resource as it was loaded or last
// saved. It holds the edits as a field-level patch over that copy. Pure functions build the JSON:API write from the
// two, and apply a saved resource back.
//
// A draft holds field values only. It never holds a token, a credential, Drupal's links or its meta.

import { DELTA, ENTITY, FIELD, LANGCODE, TYPE } from '../anchors'
import type { DruxtAnchorDescriptor } from '../anchors'

/**
 * Which entity a draft edits: its JSON:API type, its id, and its language.
 *
 * A new entity has a local name in place of an id.
 */
export interface DruxtEditTarget {
  /** The JSON:API resource type, such as `node--page`. */
  type: string
  /** The entity's id, exactly as JSON:API returned it. Unset for a new entity. */
  id?: string
  /** The entity's language, its `langcode`, as the anchors name it. */
  langcode?: string
  /** A name for a new entity, unique on the page, such as a form's own id. Ignored once the entity has an id. */
  local?: string
}

/** A resource as a draft holds it: its type and id, and its field values. */
export interface DruxtEditResource {
  type: string
  id?: string
  attributes?: Record<string, unknown>
  relationships?: Record<string, unknown>
}

/** A JSON:API error, as Drupal answers a write, or as an editor reports a field's own check. */
export interface DruxtEditError {
  status?: string
  code?: string
  title?: string
  detail?: string
  source?: { pointer?: string, parameter?: string }
}

/**
 * Where a draft's save stands.
 *
 * - `idle`: nothing is being saved.
 * - `saving`: a destination is writing it.
 * - `saved`: the destination saved it.
 * - `failed`: the save failed.
 * - `staged`: the destination took the change elsewhere. Drupal does not hold it, so the edits stay.
 */
export type DruxtDraftStatus = 'idle' | 'saving' | 'saved' | 'staged' | 'failed'

/**
 * Gets the status of a draft that has changed. A staged draft that changes is idle again, so a batch save sends it
 * again.
 */
const restage = (status: DruxtDraftStatus): DruxtDraftStatus => (status === 'staged' ? 'idle' : status)

/** A draft's edits: the attributes and relationships changed from the pristine resource, by field. */
export interface DruxtDraftEdits {
  attributes: Record<string, unknown>
  relationships: Record<string, unknown>
}

/** What a draft sends: its type, its id when it has one, and the attributes and relationships to write. */
export interface DruxtDraftPayload {
  type: string
  id?: string
  attributes: Record<string, unknown>
  relationships: Record<string, { data: unknown }>
}

/** A write in flight: the destination that writes it, and what it sends. */
export interface DruxtDraftWrite {
  destination: string
  payload: DruxtDraftPayload
}

/** One entity's draft. It is plain data, so any framework's store can hold it. */
export interface DruxtDraft {
  /** The draft's key, from its target, as `draftKey()` builds it. */
  key: string
  type: string
  id?: string
  langcode?: string
  /** The JSON:API prefix the entity was read under and is written to, such as `en`. */
  prefix?: string
  /** The entity as it was loaded or last saved, field values only. */
  pristine: DruxtEditResource
  /** The fields changed from the pristine resource. */
  edits: DruxtDraftEdits
  /** The ids of the changed fields, attributes and relationships alike, in the order they changed. */
  dirty: string[]
  /** The errors of the last save or check, keyed by `source.pointer`. An error that names no field is under `''`. */
  errors: Record<string, DruxtEditError[]>
  status: DruxtDraftStatus
  /** The write in flight, or null. */
  pending: DruxtDraftWrite | null
  /** The fields a save may send, such as a form display's. Unset, a save may send every field. */
  fields?: string[]
  /** The name of the destination its save goes to. Unset, the save goes to the default destination. */
  destination?: string
  /** Counts every change, so a consumer can tell one change from the next. */
  revision: number
  /** Who made the last change, as the consumer named itself. A consumer uses it to skip its own changes. */
  origin?: string
}

/** The drafts on a page, by key. */
export type DruxtDrafts = Record<string, DruxtDraft>

/** A field of a draft: its pristine and edited values, whether it changed, and its errors. */
export interface DruxtDraftField {
  id: string
  relationship: boolean
  pristine: unknown
  value: unknown
  dirty: boolean
  errors: DruxtEditError[]
}

/** What `findDraft()` answers for an anchor: the draft, and the field and item the anchor names. */
export interface DruxtDraftMatch {
  draft: DruxtDraft
  /** The field the anchor names, when it names one the draft has. */
  field?: DruxtDraftField
  /** The item at the anchor's delta, from the edited value, when it names one. */
  item?: unknown
}

/** The name of the default destination, which writes a draft to Drupal's JSON:API. */
export const DRUXT_JSONAPI_DESTINATION = 'jsonapi'

/** Makes a plain deep copy, so a draft never shares an object with the resource it was built from. */
const copy = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)) as T)

/**
 * Gets a field's value as a draft keeps it: copied, and `null` when it is emptied.
 *
 * Drupal reads `null` as an emptied field. A JSON copy of a whole record would drop a key set to `undefined`, and the
 * field would never be sent.
 */
const fieldValue = (value: unknown): unknown => (value === undefined ? null : copy(value))

/** Gets each attribute of a record as a draft keeps it. */
const fieldValues = (values: Record<string, unknown> | undefined): Record<string, unknown> =>
  Object.fromEntries(Object.entries(values || {}).map(([id, value]) => [id, fieldValue(value)]))

/** Writes a value as JSON, with `null` for no value. Two values are compared by it to tell whether one changed. */
const asJson = (value: unknown): string => JSON.stringify(value ?? null)

/** Gets a relationship's data. It is undefined for a relationship whose data was never loaded. */
const dataOf = (value: unknown): unknown => (value && typeof value === 'object' ? (value as { data?: unknown }).data : undefined)

/**
 * Builds the key of a draft, from its type, its id and its language.
 *
 * A new entity has no id, so its local name is used. Two editors of one entity in one language share a key, and so they
 * share a draft.
 *
 * @param target - The entity.
 * @returns The key.
 *
 * @example @lang js
 * draftKey({ type: 'node--page', id, langcode: 'en' }) // `node--page:${id}:en`
 */
export function draftKey({ type, id, langcode, local }: DruxtEditTarget): string {
  return [type, id || `new-${local ?? ''}`, langcode ?? ''].join(':')
}

/**
 * Reduces a resource to its field values.
 *
 * The result has no links, no meta and no included resources. Each relationship is reduced to its `data`. A
 * relationship whose data was never loaded is left out, so a draft never clears it.
 *
 * @param resource - The resource, such as a JSON:API resource object.
 * @returns The field values, copied.
 */
export function editResource(resource: DruxtEditResource): DruxtEditResource {
  const relationships = Object.entries(resource.relationships || {})
    .filter(([, value]) => dataOf(value) !== undefined)
    .map(([id, value]) => [id, { data: copy(dataOf(value)) }])
  return {
    type: resource.type,
    ...(resource.id ? { id: resource.id } : {}),
    attributes: copy(resource.attributes || {}),
    relationships: Object.fromEntries(relationships),
  }
}

/**
 * Creates a draft of an entity, with no edits.
 *
 * @param target - The entity.
 * @param pristine - The entity as it was loaded, or a blank resource for a new one.
 * @param options - The prefix it is written to, the fields a save may send and its destination.
 * @returns The draft.
 *
 * @example @lang js
 * createDraft({ type: 'node--page', id, langcode: 'en' }, resource, { prefix: 'en' })
 */
export function createDraft(target: DruxtEditTarget, pristine: DruxtEditResource, options: { prefix?: string, fields?: string[], destination?: string } = {}): DruxtDraft {
  const id = target.id || pristine.id
  return {
    key: draftKey({ ...target, id }),
    type: target.type,
    ...(id ? { id } : {}),
    ...(target.langcode ? { langcode: target.langcode } : {}),
    ...(options.prefix !== undefined ? { prefix: options.prefix } : {}),
    pristine: editResource({ ...pristine, type: target.type }),
    edits: { attributes: {}, relationships: {} },
    dirty: [],
    errors: {},
    status: 'idle',
    pending: null,
    ...(options.fields ? { fields: [...options.fields] } : {}),
    ...(options.destination ? { destination: options.destination } : {}),
    revision: 0,
  }
}

/**
 * Works the edits out again, against a pristine resource.
 *
 * An edit that now equals the pristine value is dropped. The changed fields keep the order they changed in.
 */
const settle = (pristine: DruxtEditResource, edits: DruxtDraftEdits, order: string[] = []): { edits: DruxtDraftEdits, dirty: string[] } => {
  const attributes = Object.fromEntries(Object.entries(edits.attributes).filter(([id, value]) => asJson(value) !== asJson(pristine.attributes?.[id])))
  const relationships = Object.fromEntries(Object.entries(edits.relationships).filter(([id, value]) => asJson(dataOf(value)) !== asJson(dataOf(pristine.relationships?.[id]))))
  const changed = new Set([...Object.keys(attributes), ...Object.keys(relationships)])
  const dirty = [...order.filter((id) => changed.has(id)), ...[...changed].filter((id) => !order.includes(id))]
  return { edits: { attributes, relationships }, dirty }
}

/**
 * Sets one field of a draft.
 *
 * A value equal to the pristine one removes the edit, so the field is clean again.
 *
 * @param draft - The draft.
 * @param field - The field's id.
 * @param value - The value: an attribute's value, or a relationship as `{ data }`.
 * @param options - Whether the field is a relationship, and who made the change.
 * @returns The new draft.
 *
 * @example @lang js
 * editDraft(draft, 'title', 'About us')
 * editDraft(draft, 'field_tags', { data: [{ type: 'taxonomy_term--tags', id }] }, { relationship: true })
 */
export function editDraft(draft: DruxtDraft, field: string, value: unknown, options: { relationship?: boolean, origin?: string } = {}): DruxtDraft {
  const part = options.relationship ? 'relationships' : 'attributes'
  const edits = { ...draft.edits, [part]: { ...draft.edits[part], [field]: options.relationship ? { data: copy(dataOf(value)) } : fieldValue(value) } }
  return { ...draft, ...settle(draft.pristine, edits, draft.dirty), status: restage(draft.status), revision: draft.revision + 1, origin: options.origin }
}

/**
 * Sets every field of a resource on a draft, such as a form's whole entity after a change.
 *
 * A field the resource leaves out keeps its edit. A field equal to the pristine one is clean.
 *
 * @param draft - The draft.
 * @param resource - The resource, as its editor holds it.
 * @param origin - Who made the change.
 * @returns The new draft, or the same draft when nothing changed.
 */
export function updateDraft(draft: DruxtDraft, resource: Pick<DruxtEditResource, 'attributes' | 'relationships'>, origin?: string): DruxtDraft {
  const relationships = Object.fromEntries(Object.entries(resource.relationships || {})
    .filter(([, value]) => dataOf(value) !== undefined)
    .map(([id, value]) => [id, { data: copy(dataOf(value)) }]))
  const edits = {
    attributes: { ...draft.edits.attributes, ...fieldValues(resource.attributes) },
    relationships: { ...draft.edits.relationships, ...relationships },
  }
  const next = settle(draft.pristine, edits, draft.dirty)
  if (asJson(next.edits) === asJson(draft.edits) && asJson(next.dirty) === asJson(draft.dirty)) return draft
  return { ...draft, ...next, status: restage(draft.status), revision: draft.revision + 1, origin }
}

/**
 * Gets the draft as edited: the pristine resource with the edits over it.
 *
 * @param draft - The draft.
 * @returns The resource.
 */
export function draftResource(draft: DruxtDraft): DruxtEditResource {
  return {
    type: draft.type,
    ...(draft.id ? { id: draft.id } : {}),
    attributes: { ...copy(draft.pristine.attributes || {}), ...copy(draft.edits.attributes) },
    relationships: { ...copy(draft.pristine.relationships || {}), ...copy(draft.edits.relationships) },
  }
}

/**
 * Builds what a save sends.
 *
 * - An entity with an id sends the fields that changed. An emptied field is sent as `null`, so Drupal validates it.
 * - A new entity sends every field it holds.
 * - With `fields`, only those fields are sent. A field the editor never showed, such as a read-only id, then stays as
 *   Drupal holds it.
 * - A relationship whose data was never loaded is never sent.
 *
 * @param draft - The draft.
 * @param fields - The fields a save may send, in place of the draft's own `fields`.
 * @returns The payload, for the destination.
 *
 * @example @lang js
 * draftPayload(editDraft(draft, 'title', 'About us'))
 * // { type: 'node--page', id, attributes: { title: 'About us' }, relationships: {} }
 */
export function draftPayload(draft: DruxtDraft, fields: string[] | undefined = draft.fields): DruxtDraftPayload {
  const allowed = fields ? new Set(fields) : undefined
  const existing = !!draft.pristine.id
  const source = existing ? { type: draft.type, attributes: draft.edits.attributes, relationships: draft.edits.relationships } : draftResource(draft)
  const pick = (values: Record<string, unknown> | undefined) => Object.entries(values || {}).filter(([id]) => !allowed || allowed.has(id))
  const attributes = pick(source.attributes).map(([id, value]) => [id, value === undefined ? null : copy(value)])
  const relationships = pick(source.relationships)
    .filter(([, value]) => dataOf(value) !== undefined)
    .map(([id, value]) => [id, { data: copy(dataOf(value)) }])
  return {
    type: draft.type,
    ...(draft.id ? { id: draft.id } : {}),
    attributes: Object.fromEntries(attributes),
    relationships: Object.fromEntries(relationships),
  }
}

/**
 * Marks a draft as being written by a destination.
 *
 * The draft is `saving`. Its write in flight has the destination's name and what the save sends. The write holds the
 * payload alone, which is field values only. It never holds the client the write goes through.
 *
 * @param draft - The draft.
 * @param destination - The destination's name.
 * @param payload - What the save sends, as `draftPayload()` built it.
 * @param origin - Who saves.
 * @returns The new draft.
 */
export function startSave(draft: DruxtDraft, destination: string, payload: DruxtDraftPayload, origin?: string): DruxtDraft {
  return { ...draft, status: 'saving', pending: { destination, payload: copy(payload) }, revision: draft.revision + 1, origin }
}

/**
 * Keys JSON:API errors by their `source.pointer`, in the order they came.
 *
 * An error that names no field is under `''`.
 *
 * @param errors - The errors.
 * @returns The errors, by pointer.
 */
export function keyErrors(errors: DruxtEditError[] | undefined): Record<string, DruxtEditError[]> {
  const keyed: Record<string, DruxtEditError[]> = {}
  for (const error of errors || []) (keyed[error.source?.pointer || ''] ||= []).push(copy(error))
  return keyed
}

/**
 * Whether an error names a field.
 *
 * It does when its pointer is the field's attribute or relationship, or a part of it.
 *
 * @param pointer - The error's `source.pointer`.
 * @param field - The field's id.
 * @returns Whether the pointer names the field.
 */
const namesField = (pointer: string, field: string): boolean =>
  [`/data/attributes/${field}`, `/data/relationships/${field}`].some((path) => pointer === path || pointer.startsWith(`${path}/`))

/**
 * Sets the errors of a draft, such as a failed save's or an editor's own check.
 *
 * @param draft - The draft.
 * @param errors - The errors.
 * @param status - The status to set with them. When it is not given, the status is `failed` if there are errors, and is
 * unchanged if there are none.
 * @returns The new draft.
 */
export function setDraftErrors(draft: DruxtDraft, errors: DruxtEditError[] | undefined, status?: DruxtDraftStatus): DruxtDraft {
  return { ...draft, errors: keyErrors(errors), status: status ?? (errors?.length ? 'failed' : draft.status), revision: draft.revision + 1 }
}

/**
 * Gets every error of a draft, in pointer order.
 *
 * @param draft - The draft.
 * @returns The errors.
 */
export function draftErrors(draft: DruxtDraft): DruxtEditError[] {
  return Object.values(draft.errors).flat()
}

/**
 * Gets a field of a draft: its pristine and edited values, whether it changed, and the errors that name it.
 *
 * @param draft - The draft.
 * @param field - The field's id.
 * @returns The field, or undefined when the draft has no such field.
 */
export function draftField(draft: DruxtDraft, field: string): DruxtDraftField | undefined {
  const relationship = field in draft.edits.relationships || field in (draft.pristine.relationships || {})
  const part = relationship ? 'relationships' : 'attributes'
  const known = field in draft.edits[part] || field in (draft.pristine[part] || {})
  if (!known) return undefined
  const pristine = draft.pristine[part]?.[field]
  return {
    id: field,
    relationship,
    pristine: copy(pristine),
    value: copy(field in draft.edits[part] ? draft.edits[part][field] : pristine),
    dirty: draft.dirty.includes(field),
    errors: Object.entries(draft.errors).filter(([pointer]) => namesField(pointer, field)).flatMap(([, errors]) => errors),
  }
}

/**
 * Whether a draft, or one of its fields, has changed.
 *
 * @param draft - The draft.
 * @param field - A field's id, for that field alone.
 * @returns Whether it has changed. False when there is no draft.
 */
export function isDirty(draft: DruxtDraft | undefined, field?: string): boolean {
  if (!draft) return false
  return field ? draft.dirty.includes(field) : draft.dirty.length > 0
}

/**
 * Discards a draft's edits and errors, so it is back to the pristine resource.
 *
 * @param draft - The draft.
 * @param origin - Who discarded it.
 * @returns The new draft.
 */
export function discardDraft(draft: DruxtDraft, origin?: string): DruxtDraft {
  return { ...draft, edits: { attributes: {}, relationships: {} }, dirty: [], errors: {}, status: 'idle', pending: null, revision: draft.revision + 1, origin }
}

/**
 * Gives a draft a new pristine resource, such as a newer copy read from Drupal.
 *
 * Its edits stay over the new resource. An edit the new resource already holds is clean.
 *
 * @param draft - The draft.
 * @param pristine - The resource.
 * @returns The new draft, or the same draft when the resource is the pristine one.
 */
export function rebaseDraft(draft: DruxtDraft, pristine: DruxtEditResource): DruxtDraft {
  const next = editResource({ ...pristine, type: draft.type })
  if (asJson(next) === asJson(draft.pristine)) return draft
  return { ...draft, pristine: next, ...settle(next, draft.edits, draft.dirty), revision: draft.revision + 1 }
}

/**
 * Applies a destination's save to a draft.
 *
 * With the resource Drupal answered:
 *
 * - That resource becomes the pristine resource.
 * - A new entity takes its id and its key.
 * - The edits that were sent are cleared. An edit made while the write ran stays.
 *
 * Without one, the destination staged the change elsewhere. Drupal does not hold the edits, so they stay, and the draft
 * is `staged`.
 *
 * @param draft - The draft, as it was while saving.
 * @param sent - What the save sent.
 * @param saved - The resource the destination answered, if any.
 * @returns The new draft.
 */
export function applySaved(draft: DruxtDraft, sent: DruxtDraftPayload, saved?: DruxtEditResource): DruxtDraft {
  const done = { status: 'saved' as const, pending: null, errors: {}, revision: draft.revision + 1 }
  if (!saved) return { ...draft, ...done, status: 'staged' }
  const pristine = editResource({ ...saved, type: draft.type })
  const id = pristine.id || draft.id
  // An edit equal to what was sent is now Drupal's, so it is cleared. An edit made since then stays.
  const unsent = (part: 'attributes' | 'relationships') => Object.fromEntries(Object.entries(draft.edits[part]).filter(([field, value]) => {
    const values = sent[part] as Record<string, unknown>
    if (!(field in values)) return true
    return part === 'relationships' ? asJson(dataOf(value)) !== asJson(dataOf(values[field])) : asJson(value ?? null) !== asJson(values[field])
  }))
  return {
    ...draft,
    ...done,
    key: draftKey({ type: draft.type, id, langcode: draft.langcode }),
    ...(id ? { id } : {}),
    pristine,
    ...settle(pristine, { attributes: unsent('attributes'), relationships: unsent('relationships') }, draft.dirty),
  }
}

/**
 * Finds the draft an anchor names, with the field and the item it names.
 *
 * An anchor names an entity by its id, and optionally by its type and language. `@druxt/core/anchors` writes them on
 * the page that way. So an inline editor finds the draft of the element it was opened on.
 *
 * @param drafts - The drafts, by key.
 * @param anchor - The anchors, as `findAnchor()` takes them.
 * @returns The match, or undefined when no draft edits that entity.
 *
 * @example @lang js
 * findDraft(drafts, { entity: id, field: 'field_tags', delta: 1 })
 * // { draft, field: { id: 'field_tags', relationship: true, ... }, item: { type: 'taxonomy_term--tags', id } }
 */
export function findDraft(drafts: DruxtDrafts, anchor: DruxtAnchorDescriptor): DruxtDraftMatch | undefined {
  if (!anchor.entity) return undefined
  const draft = Object.values(drafts).find((candidate) => candidate.id === anchor.entity
    && (!anchor.type || candidate.type === anchor.type)
    && (!anchor.langcode || !candidate.langcode || candidate.langcode === anchor.langcode))
  if (!draft) return undefined
  const field = anchor.field ? draftField(draft, anchor.field) : undefined
  if (!field || typeof anchor.delta !== 'number') return { draft, ...(field ? { field } : {}) }
  const items = field.relationship ? dataOf(field.value) : field.value
  // A single value is its own item 0.
  return { draft, field, item: copy(Array.isArray(items) ? items[anchor.delta] : (anchor.delta === 0 ? items : undefined)) }
}

/** An element whose anchors `anchorOf()` reads. It is an element in the page, or anything with the same two methods. */
export interface DruxtAnchoredElement {
  closest: (selectors: string) => DruxtAnchoredElement | null
  getAttribute: (name: string) => string | null
}

/**
 * Reads the anchors of an element and the elements around it.
 *
 * It reads the nearest entity's id, type and language, and the nearest field and item. So a click anywhere inside a
 * rendered field names its draft.
 *
 * @param element - The element, such as an event's target.
 * @returns The anchors, for `findDraft()` or `findAnchor()`.
 *
 * @example @lang js
 * findDraft(drafts, anchorOf(event.target))
 */
export function anchorOf(element: DruxtAnchoredElement | null | undefined): DruxtAnchorDescriptor {
  if (!element || typeof element.closest !== 'function') return {}
  const entity = element.closest(`[${ENTITY}]`)
  const field = element.closest(`[${FIELD}]`)
  const item = element.closest(`[${DELTA}]`)
  const delta = item?.getAttribute(DELTA)
  return {
    ...(entity ? { entity: entity.getAttribute(ENTITY) || undefined, type: entity.getAttribute(TYPE) || undefined, langcode: entity.getAttribute(LANGCODE) || undefined } : {}),
    ...(field ? { field: field.getAttribute(FIELD) || undefined } : {}),
    ...(delta && /^\d+$/.test(delta) ? { delta: Number(delta) } : {}),
  }
}

/** What a destination's save is given beside the draft: the payload, and the client and prefix to write with. */
export interface DruxtEditSaveContext {
  /** What the save sends, as `draftPayload()` built it. */
  payload: DruxtDraftPayload
  /** The client to write with, such as the form's, so the write carries its credentials. */
  client?: unknown
  /** The JSON:API prefix to write to. */
  prefix?: string
}

/**
 * What a destination's save answers. It has the saved resource when the destination holds the entity, as Drupal does.
 */
export interface DruxtEditSaveResult {
  /** The resource as saved. Without it the draft keeps its edits, because the destination staged them elsewhere. */
  data?: DruxtEditResource
  /** The whole response, for the editor that saved. */
  response?: unknown
}

/**
 * Where a draft's save goes.
 *
 * It is Drupal's JSON:API by default. A module can add a destination of its own, such as one that opens a change for
 * review.
 *
 * A save that fails throws. An error that carries `response.data.errors` names its fields.
 */
export interface DruxtEditDestination {
  /** The destination's name. A draft and `druxt.editing.destination` name it by this. */
  name: string
  /** Writes the draft. */
  save: (draft: DruxtDraft, context: DruxtEditSaveContext) => Promise<DruxtEditSaveResult> | Promise<void>
  /**
   * Whether it can write the draft now, such as when it has a client to write with.
   *
   * When this throws or rejects, the save fails and nothing is sent.
   */
  canSave?: (draft: DruxtDraft, context: DruxtEditSaveContext) => boolean | Promise<boolean>
}

/**
 * Defines a destination for drafts, for `useDruxtEditStore().addDestination()`.
 *
 * @param destination - Its name, its save and, optionally, whether it can save a draft.
 * @returns The destination, frozen.
 * @throws When the destination has no name, or no save function.
 *
 * @example @lang js
 * export const review = defineDruxtEditDestination({
 *   name: 'review',
 *   canSave: (draft) => draft.dirty.length > 0,
 *   async save(draft, { payload }) {
 *     await openChangeRequest(draft.key, payload)
 *   },
 * })
 */
export function defineDruxtEditDestination(destination: DruxtEditDestination): DruxtEditDestination {
  if (!destination?.name || typeof destination.name !== 'string') throw new TypeError('A Druxt edit destination needs a name.')
  if (typeof destination.save !== 'function') throw new TypeError(`The Druxt edit destination ${destination.name} needs a save function.`)
  return Object.freeze({ ...destination })
}

/** The client the JSON:API destination writes with. It is the Druxt client, or anything with its `createResource()`. */
interface JsonApiWriter {
  createResource: (resource: DruxtDraftPayload, prefix?: string) => Promise<{ data?: { data?: DruxtEditResource } }>
}

/** Whether a client can write: it has a `createResource()` function. */
const isWriter = (client: unknown): client is JsonApiWriter => !!client && typeof (client as Partial<JsonApiWriter>).createResource === 'function'

/**
 * The default destination. It writes to Drupal's JSON:API: a POST for a new entity, or a PATCH of the changed fields.
 *
 * The write goes through the client it is given. So it carries that client's credentials, and goes through the site's
 * proxy when the site has one.
 */
export const jsonApiDestination: DruxtEditDestination = defineDruxtEditDestination({
  name: DRUXT_JSONAPI_DESTINATION,
  canSave: (_draft, { client }) => isWriter(client),
  async save(_draft, { payload, client, prefix }) {
    if (!isWriter(client)) throw new TypeError('The JSON:API destination needs a client to write with.')
    const response = await client.createResource(payload, prefix)
    return { data: response.data?.data, response: response.data }
  },
})

/**
 * Whether the current session may edit: `allowed` or `denied` when there is a signal, and `unknown` when there is none.
 */
export type DruxtEditPermission = 'allowed' | 'denied' | 'unknown'

/** The link relations that say the user may update an entity, when a backend module adds them. */
export const DRUXT_EDIT_LINKS = ['update', 'edit-form'] as const

/**
 * Whether the current session may edit an entity.
 *
 * - `denied`: editing is off, or no user is signed in to write as.
 * - `allowed`: the entity's links carry an update relation. Drupal adds one only for a user who may update the entity,
 *   and only when a module such as JSON:API Hypermedia provides it.
 * - `unknown`: anything else. An editor then tries the save, and reports Drupal's answer.
 *
 * @param input - Whether editing is on, whether a user is signed in, and the entity's links if known.
 * @returns The permission.
 *
 * @example @lang js
 * editPermission({ enabled: true, signedIn: true }) // 'unknown'
 */
export function editPermission({ enabled = true, signedIn, links }: { enabled?: boolean, signedIn: boolean, links?: Record<string, unknown> | null }): DruxtEditPermission {
  if (!enabled || !signedIn) return 'denied'
  if (links && DRUXT_EDIT_LINKS.some((rel) => !!links[rel])) return 'allowed'
  return 'unknown'
}
