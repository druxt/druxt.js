import type { H3Event } from 'h3'
import { consola } from 'consola'
import { useStorage } from 'nitropack/runtime'
import { connectionName, drupalSettingsStorageKey, writeRequestTiers } from '../utils/drupal-settings'
import type { DrupalSettingsTiers } from '../utils/drupal-settings'

const logger = consola.withTag('druxt')
const warn = (message: string) => {
  if (import.meta.dev) logger.warn(message)
}

/**
 * Stores a connection's settings from Drupal on the server, for every request.
 *
 * A decoupled-settings fetcher calls it from a Nitro plugin, which runs at
 * server start and while `nuxt generate` builds static pages. Both tiers go to Nitro's
 * `druxt` storage. Each request's render puts the public tier in the Nuxt
 * state `useDruxtSettings()` reads, and so in the payload, and
 * `useDruxtServerSettings()` reads the server tier. With an `event`, the
 * tiers are for that request only, each taking the place of the stored
 * one, and nothing is stored.
 *
 * @param connection - The connection, `default` unless named.
 * @param tiers - The public tier, the server tier, or both. A tier left out is kept.
 * @param event - A request, to set the tiers for it alone.
 *
 * @example
 * export default defineNitroPlugin(async () => {
 *   await storeDrupalSettings('default', { public: { siteUrl }, server: { apiKey } })
 * })
 */
export const storeDrupalSettings = async (connection: string, tiers: DrupalSettingsTiers, event?: H3Event): Promise<void> => {
  const name = connectionName(connection, warn)
  if (event) return writeRequestTiers(event.context, name, tiers)
  const storage = useStorage('druxt')
  const key = drupalSettingsStorageKey(name)
  const current = (await storage.getItem<DrupalSettingsTiers>(key)) || {}
  const next: DrupalSettingsTiers = { ...current }
  if (tiers.public) next.public = tiers.public
  if (tiers.server) next.server = tiers.server
  await storage.setItem(key, next)
}

/**
 * Reads a connection's stored tiers, once per request. A failed read is
 * logged and counts as none, so a storage outage leaves the config in force.
 *
 * @param event - The request.
 * @internal
 */
export const storedDrupalSettings = (event: H3Event): (connection: string) => Promise<DrupalSettingsTiers | null> => {
  const reads = new Map<string, Promise<DrupalSettingsTiers | null>>()
  return (connection) => {
    let read = reads.get(connection)
    if (!read) {
      read = useStorage('druxt').getItem<DrupalSettingsTiers>(drupalSettingsStorageKey(connection)).catch((error: unknown) => {
        logger.warn(`The settings from Drupal could not be read from storage, for ${event.path}: ${(error as Error)?.message || error}`)
        return null
      })
      reads.set(connection, read)
    }
    return read
  }
}
