// @druxt/core/anchors: how a rendered entity and field name themselves in the page, so a diff view, an inline editor, a
// canvas or a site's own tests can find the same element again. Framework free: nothing here imports Vue, Nuxt or h3,
// so a later adapter for another framework reuses it as it is.

/** The attribute naming a rendered entity: its id, exactly as JSON:API returned it. Frozen. */
export const ENTITY = 'data-druxt-entity'
/** The attribute naming a rendered entity's JSON:API resource type, such as `node--recipe`. Frozen. */
export const TYPE = 'data-druxt-type'
/** The attribute naming a rendered field: its public JSON:API name. Frozen. */
export const FIELD = 'data-druxt-field'
/** The attribute naming an item's index in a field that allows several values. Frozen. */
export const DELTA = 'data-druxt-delta'
/** The attribute naming a rendered entity's language, its `langcode`. */
export const LANGCODE = 'data-druxt-langcode'

/**
 * The attributes that name a rendered entity: its id and its type, with its language when given. Nothing without an
 * id, as an anchor nothing can address is worse than none.
 *
 * @param type - The JSON:API resource type, such as `node--recipe`.
 * @param id - The entity's id, exactly as JSON:API returned it.
 * @param langcode - The entity's language, such as `en`.
 * @returns The attributes, to spread onto the element.
 *
 * @example @lang js
 * entityAnchors('node--recipe', id, 'en')
 * // { 'data-druxt-entity': id, 'data-druxt-type': 'node--recipe', 'data-druxt-langcode': 'en' }
 */
export function entityAnchors(type: string | null | undefined, id: string | null | undefined, langcode?: string | null): Record<string, string> {
  if (!id) return {}
  return { [ENTITY]: id, ...(type ? { [TYPE]: type } : {}), ...(langcode ? { [LANGCODE]: langcode } : {}) }
}

/**
 * The attributes that name a rendered field, or one item of it. The delta is written whenever it is a number, zero
 * included, as a string, as an attribute's value is in the page. Druxt writes it only on an item of a field that
 * allows several values.
 *
 * @param name - The field's public JSON:API name, such as `field_tags`.
 * @param delta - The item's index in the field.
 * @returns The attributes, to spread onto the element.
 *
 * @example @lang js
 * fieldAnchors('field_tags', 0) // { 'data-druxt-field': 'field_tags', 'data-druxt-delta': '0' }
 */
export function fieldAnchors(name: string | null | undefined, delta?: number): Record<string, string> {
  if (!name) return {}
  return { [FIELD]: name, ...(typeof delta === 'number' ? { [DELTA]: String(delta) } : {}) }
}

/**
 * An attribute value escaped for a selector's quoted string. `CSS.escape` is missing outside a browser.
 *
 * @param value - The value.
 * @returns The value, with each `"` and `\` escaped.
 */
export function escapeValue(value: unknown): string {
  return String(value).replace(/["\\]/g, '\\$&')
}

/** What `findAnchor()` looks for: any of an entity's id, its type, its language, a field and an item. */
export interface DruxtAnchorDescriptor {
  entity?: string
  type?: string
  langcode?: string
  field?: string
  delta?: number
}

/** Something `findAnchor()` searches: an element or a document. */
export interface DruxtAnchorRoot {
  querySelector: (selectors: string) => unknown
}

/**
 * The first element under `root` that carries every anchor described, or `null`. An empty description finds nothing,
 * rather than the whole page, and a root that cannot be searched, such as during a server render, gives `null`.
 *
 * @param root - Where to search, such as `document`.
 * @param descriptor - The anchors to match.
 * @returns The element, as the root's `querySelector()` returns it, or `null`.
 *
 * @example @lang js
 * findAnchor(document, { entity: id, field: 'field_tags', delta: 1 })
 */
export function findAnchor<R extends DruxtAnchorRoot>(root: R | null | undefined, descriptor: DruxtAnchorDescriptor = {}): NonNullable<ReturnType<R['querySelector']>> | null {
  if (!root || typeof (root as Partial<DruxtAnchorRoot>).querySelector !== 'function') return null
  const { entity, type, langcode, field, delta } = descriptor
  const parts = [
    entity ? `[${ENTITY}="${escapeValue(entity)}"]` : '',
    type ? `[${TYPE}="${escapeValue(type)}"]` : '',
    langcode ? `[${LANGCODE}="${escapeValue(langcode)}"]` : '',
    field ? `[${FIELD}="${escapeValue(field)}"]` : '',
    typeof delta === 'number' ? `[${DELTA}="${escapeValue(delta)}"]` : '',
  ].join('')
  if (!parts) return null
  return (root.querySelector(parts) ?? null) as NonNullable<ReturnType<R['querySelector']>> | null
}

/** `druxt.anchors`: on, off, or `'dev'`, on in development only (the default). */
export type DruxtAnchorsSetting = boolean | 'dev'

/**
 * Whether Druxt writes its anchors, and why.
 *
 * @example @lang js
 * { enabled: true, requiredBy: ['@druxt-contrib/fae'] }
 */
export interface DruxtAnchorsState {
  /** Whether the default output carries the anchors. */
  enabled: boolean
  /** The modules that required them, by name. */
  requiredBy: string[]
  /** Set when the site turned them off although a module required them. */
  disabledBy?: 'site'
}

/** What `resolveDruxtAnchors()` takes. */
export interface DruxtAnchorsInput {
  /** The site's `druxt.anchors`, unset for the default, `'dev'`. */
  setting?: unknown
  /** Whether the app runs in development. */
  dev: boolean
  /** The modules that required anchors, by name. */
  requiredBy?: readonly string[]
}

/**
 * Whether Druxt writes its anchors: the site's explicit `true` or `false` wins, and otherwise they are on in
 * development, and in production when a module requires them. An unknown value counts as unset.
 *
 * @param input - The site's setting, whether the app runs in development, and the modules that required anchors.
 * @returns The state.
 *
 * @example @lang js
 * resolveDruxtAnchors({ setting: false, dev: false, requiredBy: ['@druxt/site'] })
 * // { enabled: false, requiredBy: ['@druxt/site'], disabledBy: 'site' }
 */
export function resolveDruxtAnchors({ setting, dev, requiredBy = [] }: DruxtAnchorsInput): DruxtAnchorsState {
  const required = [...new Set(requiredBy)]
  if (setting === false) return { enabled: false, requiredBy: required, ...(required.length ? { disabledBy: 'site' as const } : {}) }
  return { enabled: setting === true || dev || required.length > 0, requiredBy: required }
}
