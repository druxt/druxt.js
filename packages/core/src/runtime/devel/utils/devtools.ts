import type { ComponentInternalInstance } from 'vue'
import type { DruxtDevtoolsSetting, DruxtDevtoolsTemplate } from '@druxt/devtools'
import { isTemplateName, renderTemplate, templatePath } from '../../utils/template'
import type { DruxtTemplateRequest } from '../../utils/template'
import type { DruxtTemplateConfig } from '../../types'
import type { DruxtAnchorsState } from '@druxt/core/anchors'

// The module instances on the page, by id, so Vue DevTools can point at the component. Created on first use.
let instances: Map<string, ComponentInternalInstance> | undefined

/** The module instances the development tools know, by id. Development, in the browser, only. */
export const moduleInstances = (): Map<string, ComponentInternalInstance> => (instances ||= new Map())

// Each module context's id, so a note given the context attaches to its module. Created on first use.
let contexts: WeakMap<object, string> | undefined

/** The module contexts the development tools know, with their module's id. Development, in the browser, only. */
export const moduleContexts = (): WeakMap<object, string> => (contexts ||= new WeakMap())

const isPlain = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

/**
 * A value as the tools list it: plain values as they are, a long string cut, and an object or array by its size. A
 * JSON:API resource is named by its type and id.
 *
 * @param value - The value.
 */
export const summariseValue = (value: unknown): unknown => {
  if (typeof value === 'string') return value.length > 80 ? `${value.slice(0, 77)}...` : value
  if (value === null || ['number', 'boolean'].includes(typeof value)) return value
  if (value === undefined) return undefined
  if (typeof value === 'function') return 'function'
  if (Array.isArray(value)) return `[...] ${value.length} ${value.length === 1 ? 'item' : 'items'}`
  if (isPlain(value)) {
    if (typeof value.type === 'string' && typeof value.id === 'string') return `${value.type} ${value.id}`
    const length = Object.keys(value).length
    return `{...} ${length} ${length === 1 ? 'key' : 'keys'}`
  }
  return String(value)
}

/**
 * An object's keys with each value summarized, for the tools' key and value lists.
 *
 * @param values - The object, such as a module's props.
 */
export const summarise = (values: unknown): Record<string, unknown> =>
  isPlain(values) ? Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined).map(([key, value]) => [key, summariseValue(value)])) : {}

/** What the create action needs about a module. */
export interface ModuleTemplateInput {
  component: string
  candidates: string[]
  props: string[]
  slots: string[]
  template: DruxtTemplateConfig
}

/**
 * The files the create action can write for a module: one per candidate the dev server accepts, with its path and
 * starter as the dev server writes them.
 *
 * @param input - The module, its candidates and what a wrapper starts with.
 */
export const moduleTemplates = ({ component, candidates, props, slots, template }: ModuleTemplateInput): DruxtDevtoolsTemplate[] =>
  candidates.filter((name) => isTemplateName(component, name)).map((name) => {
    const request: DruxtTemplateRequest = { component, name, props, slots, template }
    return { name, path: `components/${templatePath(request)}`, starter: renderTemplate(request), request }
  })

/**
 * The schema a module rendered with, by id, when its state holds one.
 *
 * @param state - The module's declared state.
 */
export const schemaId = (state: Record<string, unknown> | undefined): string | undefined => {
  // A module holding its schema by reference, as DruxtEntity does, names it under `display`.
  const schema = state?.schema ?? state?.display
  return isPlain(schema) && typeof schema.id === 'string' ? schema.id : undefined
}

/** A settings object's values by dotted key, down to anything that is not a plain object. */
const flatten = (value: unknown, prefix = ''): [string, unknown][] =>
  isPlain(value) && Object.keys(value).length
    ? Object.entries(value).flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key))
    : prefix ? [[prefix, value]] : []

/** The tiers above the defaults that settings resolve from. */
export interface SettingsSources {
  /** The public tier from Drupal. */
  drupal: unknown
  /** The site's config. */
  site: unknown
}

/**
 * The resolved settings by dotted key, each with the tier it came from: the site's config wins over Drupal, and Drupal
 * over a module's default.
 *
 * @param resolved - The resolved settings.
 * @param sources - What they resolved from.
 */
export const settingsWithTiers = (resolved: unknown, sources: SettingsSources): DruxtDevtoolsSetting[] => {
  const keys = (value: unknown) => new Set(flatten(value).map(([key]) => key))
  const site = keys(sources.site)
  const drupal = keys(sources.drupal)
  return flatten(resolved).map(([key, value]) => ({ key, value, tier: site.has(key) ? 'site' : drupal.has(key) ? 'drupal' : 'default' }))
}

/**
 * The anchors state as settings, for the Settings section: whether the output carries them, the modules that required
 * them, and the site's `false` when it overruled them. The build settles it, so it is listed apart from the settings
 * Drupal could change.
 *
 * @param state - The anchors state, as `useDruxtAnchors()` gives it.
 * @param site - Whether the site set `druxt.anchors` itself.
 */
export const anchorsSettings = (state: DruxtAnchorsState, site: boolean): DruxtDevtoolsSetting[] => [
  { key: 'anchors', value: state.enabled, tier: site ? 'site' : 'default' },
  { key: 'anchors.requiredBy', value: [...state.requiredBy], tier: 'default' },
  ...(state.disabledBy ? [{ key: 'anchors.disabledBy', value: state.disabledBy, tier: 'site' as const }] : []),
]
