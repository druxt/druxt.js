import { computed, effectScope, toRaw } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { consola } from 'consola'
import { mergeDeep, resolveDruxtSettings } from '@druxt/client'
import type { DruxtSettings } from '@druxt/client'
import { useNuxtApp, useRequestEvent, useRuntimeConfig, useState } from '#imports'
import moduleDefaults from '#druxt/defaults'
import { DRUXT_SETTINGS_DEFAULTS, DRUXT_SETTINGS_DRUPAL_KEY, configSource, connectionName, settingsOnly, writeRequestTiers } from './utils/drupal-settings'
import type { DrupalSettingsTiers } from './utils/drupal-settings'

export { DRUXT_SETTINGS_DRUPAL_KEY }
export type { DrupalSettingsTiers }

const logger = consola.withTag('druxt')
// Warns in development only.
const warn = (message: string) => {
  if (import.meta.dev) logger.warn(message)
}

// The public tier, as Nuxt state. The server fills it, and the payload carries it to the browser.
const drupalTier = (connection: string): Ref<Partial<DruxtSettings>> =>
  useState<Partial<DruxtSettings>>(DRUXT_SETTINGS_DRUPAL_KEY(connection), () => ({}))

// The read-only views already made, per app and then per connection.
const views = new WeakMap<object, Map<string, DruxtSettings>>()

// The read-only views of nested values already made, so one value always reads as the same view.
const nested = new WeakMap<object, object>()

/**
 * A read-only view of a value below the top level, at any depth.
 *
 * A nested value is shared: a module's default is one object for every request the server answers. So a write through
 * the settings is refused at every depth, not only at the top.
 *
 * @param value - The value. Only a plain object or an array is wrapped.
 */
const readOnly = <T>(value: T): T => {
  if (value === null || typeof value !== 'object') return value
  const prototype = Object.getPrototypeOf(value) as unknown
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return value
  let view = nested.get(value)
  if (!view) {
    // A frozen value is read through a copy. A proxy must answer a frozen target's own value, never a view of it.
    const target = Object.isFrozen(value) ? (Array.isArray(value) ? [...value] : { ...value }) as typeof value : value
    view = new Proxy(target, {
      get: (target, key, receiver) => readOnly(Reflect.get(target, key, receiver)),
      getOwnPropertyDescriptor: (target, key) => {
        const descriptor = Reflect.getOwnPropertyDescriptor(target, key)
        // A property that cannot be configured must be reported as it is.
        return descriptor && descriptor.configurable && 'value' in descriptor ? { ...descriptor, value: readOnly(descriptor.value as unknown) } : descriptor
      },
      set: () => false,
      deleteProperty: () => false,
      defineProperty: () => false,
      preventExtensions: () => false,
    })
    nested.set(value, view)
  }
  return view as T
}

/**
 * A read-only view of resolved settings.
 *
 * Each read goes through `resolved`, so a holder sees a tier that was set after it took the view.
 *
 * @param resolved - The resolved settings.
 */
const readOnlyView = (resolved: ComputedRef<DruxtSettings>): DruxtSettings => new Proxy({} as DruxtSettings, {
  get: (_, key) => readOnly(Reflect.get(resolved.value, key)),
  has: (_, key) => Reflect.has(resolved.value, key),
  ownKeys: () => Reflect.ownKeys(resolved.value),
  getOwnPropertyDescriptor: (_, key) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(resolved.value, key)
    // A proxy must report a key that its empty target lacks as configurable.
    return descriptor && { ...descriptor, ...('value' in descriptor ? { value: readOnly(descriptor.value as unknown) } : {}), configurable: true, writable: false }
  },
  set: () => false,
  deleteProperty: () => false,
  defineProperty: () => false,
  // The target is empty. Sealed, it could report none of the settings' keys.
  preventExtensions: () => false,
})

/**
 * Gets the settings Druxt's modules read, resolved for a connection.
 *
 * The sources are resolved in this order, so code and environment win over Drupal:
 *
 * 1. Core's defaults.
 * 2. The defaults the Druxt modules register with `addDruxtDefaults()`.
 * 3. The settings Drupal published for the browser. This is the public tier that a decoupled-settings fetcher wrote
 *    with `setDrupalSettings()`.
 * 4. The `druxt` config, from `nuxt.config` or the environment.
 *
 * A config key left `undefined` or empty does not erase a Drupal value.
 *
 * The client's options, such as `baseUrl`, `proxy` and `auth`, are not settings. Read those from
 * `useNuxtApp().$druxt.options`.
 *
 * It is synchronous, and the same on both sides: the browser reads the state the server rendered with, from the
 * payload.
 *
 * The result is a read-only view, one per app and connection. It resolves again when a tier changes. So a component
 * that took it early still reads a tier set later in the render.
 *
 * @param connection - The connection, `default` unless named. 2.0 has only `default`. Any other name resolves to it,
 * with a warning in development.
 * @returns The resolved settings, read-only.
 *
 * @example
 * const settings = useDruxtSettings()
 * if (settings.develMessages === 'inline') { ... }
 */
export const useDruxtSettings = (connection = 'default'): DruxtSettings => {
  const name = connectionName(connection, warn)
  const nuxtApp = useNuxtApp()
  let byConnection = views.get(nuxtApp)
  if (!byConnection) views.set(nuxtApp, byConnection = new Map())
  let view = byConnection.get(name)
  if (!view) {
    const tier = drupalTier(name)
    // The config is read once on purpose. Runtime config is fixed after startup, so only the Drupal tier changes.
    const config = useRuntimeConfig()
    // The scope is detached, so the computed outlives the component that first asked.
    const resolved = effectScope(true).run(() => computed(() => resolveDruxtSettings(
      DRUXT_SETTINGS_DEFAULTS,
      settingsOnly(moduleDefaults),
      settingsOnly(toRaw(tier.value)),
      configSource(settingsOnly(toRaw(config.public.druxt))),
    )))!
    byConnection.set(name, view = readOnlyView(resolved))
  }
  return view
}

/**
 * The tiers above the defaults that a connection's settings resolve from.
 *
 * They are the public tier from Drupal, as state, and the site's config. The development tools read them to say
 * where each setting came from.
 *
 * @param connection - The connection, `default` unless named.
 * @internal
 */
export const useDruxtSettingsTiers = (connection = 'default'): { drupal: Ref<Partial<DruxtSettings>>, site: Partial<DruxtSettings> | undefined } => ({
  drupal: drupalTier(connectionName(connection, warn)),
  site: configSource(settingsOnly(toRaw(useRuntimeConfig().public.druxt))),
})

/** The static mode a build resolved, from `druxt.static`. */
export interface DruxtStaticBuild {
  /** Whether the build is static. */
  enabled: boolean
  /** Whether the build serves Drupal's files under the app's base URL. */
  files: boolean
  /** Whether `@druxt/router` still asks Drupal about a page the build did not generate. Set by `druxt.static.hybrid`. */
  hybrid: boolean
}

/**
 * Gets the static mode, `druxt.static`, as the build resolved it.
 *
 * It is on for a static build, as `nuxt generate` makes it, unless the site turns it off. It is read at build. So
 * a module reads it from here, and never from Drupal's settings.
 *
 * @example @lang ts
 * if (useDruxtStaticBuild().enabled) console.log('No Drupal at run time')
 */
export const useDruxtStaticBuild = (): DruxtStaticBuild => {
  const druxt = useRuntimeConfig().public.druxt as { staticBuild?: boolean, staticFiles?: boolean, staticHybrid?: boolean } | undefined
  return { enabled: !!druxt?.staticBuild, files: !!druxt?.staticBuild && !!druxt?.staticFiles, hybrid: !!druxt?.staticBuild && !!druxt?.staticHybrid }
}

/** What `setDrupalSettings()` takes besides the tiers. */
export interface SetDrupalSettingsOptions {
  /** Replaces the public tier with the one given, instead of merging it over the current one. */
  replace?: boolean
}

/**
 * Sets a connection's settings from Drupal, during a server render or in the browser.
 *
 * A decoupled-settings fetcher calls it with the settings it read for the connection's Consumer.
 *
 * The public tier:
 *
 * - It is merged over the tier the Nuxt state holds. A key that the build or server start stored with
 *   `storeDrupalSettings()` is kept unless the new tier sets it.
 * - Objects merge key by key, and an array is replaced.
 * - `{ replace: true }` replaces the public tier instead.
 * - It goes to the state `useDruxtSettings()` reads, and so to the payload.
 *
 * The server tier:
 *
 * - During a server render, it goes on the request, in place of the stored one. `useDruxtServerSettings()` reads it
 *   there. It never goes into state or the payload.
 * - In the browser, it is dropped.
 * - Pass a server tier only from a server-only plugin (`.server.ts`), or from a Nitro plugin's
 *   `storeDrupalSettings()`. A universal plugin's source is bundled for the browser, with the server tier's values
 *   in it, even though the value is dropped at runtime.
 *
 * @param connection - The connection, `default` unless named.
 * @param tiers - The public tier, the server tier, or both. A tier left out is kept.
 * @param options - `replace: true` replaces the public tier instead of merging it.
 *
 * @example <caption>A server-only plugin, over the tiers a Nitro plugin stored</caption> @lang ts
 * // plugins/drupal-settings.server.ts
 * export default defineNuxtPlugin(async () => {
 *   const { publicSettings, serverSettings } = await readDrupalSettings()
 *   setDrupalSettings('default', { public: publicSettings, server: serverSettings })
 * })
 *
 * @example <caption>In place of the stored public tier</caption> @lang ts
 * setDrupalSettings('default', { public: { router: { wildcard: true } } }, { replace: true })
 */
export const setDrupalSettings = (connection: string, tiers: DrupalSettingsTiers, options: SetDrupalSettingsOptions = {}): void => {
  const name = connectionName(connection, warn)
  const written: DrupalSettingsTiers = { ...tiers }
  if (tiers.public) {
    const state = drupalTier(name)
    written.public = options.replace ? { ...tiers.public } : mergeDeep(toRaw(state.value) || {}, tiers.public)
    state.value = written.public
  }
  if (import.meta.server) {
    const event = useRequestEvent()
    if (event) writeRequestTiers(event.context, name, written)
  }
}
