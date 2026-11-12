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
const warn = (message: string) => {
  if (import.meta.dev) logger.warn(message)
}

// The public tier, as Nuxt state: the server fills it, the payload carries it to the browser.
const drupalTier = (connection: string): Ref<Partial<DruxtSettings>> =>
  useState<Partial<DruxtSettings>>(DRUXT_SETTINGS_DRUPAL_KEY(connection), () => ({}))

const views = new WeakMap<object, Map<string, DruxtSettings>>()

/**
 * A read-only view of resolved settings: each read goes through `resolved`,
 * so a holder sees a tier set after it took the view.
 *
 * @param resolved - The resolved settings.
 */
const readOnlyView = (resolved: ComputedRef<DruxtSettings>): DruxtSettings => new Proxy({} as DruxtSettings, {
  get: (_, key) => Reflect.get(resolved.value, key),
  has: (_, key) => Reflect.has(resolved.value, key),
  ownKeys: () => Reflect.ownKeys(resolved.value),
  getOwnPropertyDescriptor: (_, key) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(resolved.value, key)
    // Configurable, as a proxy must report a key its empty target lacks.
    return descriptor && { ...descriptor, configurable: true, writable: false }
  },
  set: () => false,
  deleteProperty: () => false,
  defineProperty: () => false,
})

/**
 * The settings Druxt's modules read, resolved for a connection.
 *
 * Resolves core's defaults, then the defaults the Druxt modules register
 * with `addDruxtDefaults()`, then the settings Drupal published for the browser
 * (the public tier a decoupled-settings fetcher wrote with
 * `setDrupalSettings()`), then the `druxt` config from `nuxt.config` or the
 * environment, so code and environment win over Drupal. A config key left
 * `undefined` or empty does not erase a Drupal value. The client's options,
 * such as `baseUrl`, `proxy` and `auth`, are not settings: read those from
 * `useNuxtApp().$druxt.options`.
 *
 * Synchronous, and the same on both sides: the browser reads the state the
 * server rendered with, from the payload. The result is a read-only view,
 * one per app and connection, that resolves again when a tier changes, so a
 * component that took it early still reads a tier set later in the render.
 *
 * @param connection - The connection, `default` unless named. 2.0 has only
 * `default`, and any other name resolves to it, with a warning in development.
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
    // Read once on purpose: runtime config is fixed after startup, so only the Drupal tier changes.
    const config = useRuntimeConfig()
    // Detached, so the computed outlives the component that first asked.
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
 * The tiers above the defaults that a connection's settings resolve from: the public tier from Drupal, as state, and
 * the site's config. The development tools read it to say where each setting came from.
 *
 * @param connection - The connection, `default` unless named.
 * @internal
 */
export const useDruxtSettingsTiers = (connection = 'default'): { drupal: Ref<Partial<DruxtSettings>>, site: Partial<DruxtSettings> | undefined } => ({
  drupal: drupalTier(connectionName(connection, warn)),
  site: configSource(settingsOnly(toRaw(useRuntimeConfig().public.druxt))),
})

/** Whether the build is static, in `druxt.static` mode, and whether it serves Drupal's files under the app's base URL. */
export interface DruxtStaticBuild {
  enabled: boolean
  files: boolean
  /** Whether `@druxt/router` still asks Drupal about a page the build did not generate, `druxt.static.hybrid`. */
  hybrid: boolean
}

/**
 * The static mode, `druxt.static`, as the build resolved it: on for a static build, as `nuxt generate` makes it, unless
 * the site turns it off. Read at build, so a module reads it, never Drupal's settings.
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
  /** Replace the public tier with the one given, in place of merging it over the current one. */
  replace?: boolean
}

/**
 * Sets a connection's settings from Drupal, during a server render or in
 * the browser. A decoupled-settings fetcher calls it with the settings it
 * read for the connection's Consumer.
 *
 * The public tier is merged over the one the Nuxt state holds, so a key the
 * build or server start stored with `storeDrupalSettings()` is kept unless
 * the new tier sets it. Objects merge key by key, and an array is replaced.
 * `{ replace: true }` replaces the public tier instead. It goes to the state
 * `useDruxtSettings()` reads, and so to the payload.
 *
 * During a server render, the server tier goes on the request, in place of
 * the stored one, where `useDruxtServerSettings()` reads it, and never into
 * state or the payload. In the browser, a server tier is dropped. Pass a
 * server tier only from a server-only plugin (`.server.ts`) or a Nitro
 * plugin's `storeDrupalSettings()`: a universal plugin's source is bundled
 * for the browser, the server tier's values with it, even though the value
 * is dropped at runtime.
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
