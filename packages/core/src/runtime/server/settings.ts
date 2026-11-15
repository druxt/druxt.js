import type { H3Event } from 'h3'
import { consola } from 'consola'
import { resolveDruxtSettings } from '@druxt/client'
import type { DruxtSettings } from '@druxt/client'
import { useStorage } from 'nitropack/runtime'
import { useRuntimeConfig } from '#imports'
import moduleDefaults from '#druxt/defaults'
import { DRUXT_SETTINGS_DEFAULTS, configSource, connectionName, drupalSettingsStorageKey, settingsOnly } from '../utils/drupal-settings'
import type { DrupalSettingsTiers } from '../utils/drupal-settings'

const logger = consola.withTag('druxt')
const warn = (message: string) => {
  if (import.meta.dev) logger.warn(message)
}

/**
 * The settings for a connection on the server, server-only settings included.
 *
 * Resolves core's defaults, then the modules' defaults from
 * `addDruxtDefaults()`, then the public tier from Drupal, then the server
 * tier, then the public `druxt` config. Each tier is the one stored at build
 * or server start with `storeDrupalSettings()`, unless this request set its
 * own, which takes its place. As with `useDruxtSettings()`, the client's
 * options are left out. Credentials are not settings either: a server route
 * that needs a secret reads the private `druxt` runtime config. The server
 * tier is still for the server only, so call it in a server route, or in a
 * server render under `import.meta.server`.
 *
 * @param event - The request.
 * @param connection - The connection, `default` unless named. 2.0 has only
 * `default`, and any other name resolves to it, with a warning in development.
 * @returns The resolved settings.
 *
 * @example
 * export default defineEventHandler(async (event) => {
 *   const settings = await useDruxtServerSettings(event)
 * })
 */
export const useDruxtServerSettings = async (event: H3Event, connection = 'default'): Promise<DruxtSettings> => {
  const name = connectionName(connection, warn)
  const stored = (await event.context.druxtStoredSettings?.(name)) || {}
  const request = event.context.druxtSettings?.[name] || {}
  const config = useRuntimeConfig(event) as unknown as { public: { druxt?: unknown } }
  return resolveDruxtSettings(
    DRUXT_SETTINGS_DEFAULTS,
    settingsOnly(moduleDefaults),
    settingsOnly(request.public ?? stored.public),
    settingsOnly(request.server ?? stored.server),
    configSource(settingsOnly(config.public.druxt)),
  )
}

/**
 * The settings for a connection on the server, with no request.
 *
 * For what a process holds across requests, such as a generator made once:
 * it resolves core's and the modules' defaults, then the stored public and server tiers from
 * Nitro's `druxt` storage, then the config, and leaves out the client's
 * options and credentials as `useDruxtServerSettings()` does. A tier a single
 * request set for itself is not read, as it belongs to that request alone.
 *
 * @param config - The runtime config, from `useRuntimeConfig()`.
 * @param connection - The connection, `default` unless named.
 * @returns The resolved settings.
 *
 * @example
 * const settings = await druxtSettingsFrom(useRuntimeConfig())
 */
export const druxtSettingsFrom = async (config: unknown, connection = 'default'): Promise<DruxtSettings> => {
  const name = connectionName(connection, warn)
  let stored: DrupalSettingsTiers = {}
  try {
    stored = (await useStorage('druxt').getItem<DrupalSettingsTiers>(drupalSettingsStorageKey(name))) || {}
  } catch (error) {
    logger.warn(`The settings from Drupal could not be read from storage: ${(error as Error)?.message || error}`)
  }
  return resolveDruxtSettings(
    DRUXT_SETTINGS_DEFAULTS,
    settingsOnly(moduleDefaults),
    settingsOnly(stored.public),
    settingsOnly(stored.server),
    configSource(settingsOnly((config as { public: { druxt?: unknown } }).public.druxt)),
  )
}
