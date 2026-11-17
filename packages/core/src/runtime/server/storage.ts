import type { H3Event } from 'h3'
import { consola } from 'consola'
import { useStorage } from 'nitropack/runtime'
import { connectionName, drupalSettingsStorageKey, writeRequestTiers } from '../utils/drupal-settings'
import type { DrupalSettingsTiers } from '../utils/drupal-settings'

const logger = consola.withTag('druxt')
// Warns in development only.
const warn = (message: string) => {
  if (import.meta.dev) logger.warn(message)
}

/** The last write to each storage key, settled or not. The next write to that key waits for it. */
const writes = new Map<string, Promise<void>>()

/**
 * Stores a connection's settings from Drupal on the server, for every request.
 *
 * A decoupled-settings fetcher calls it from a Nitro plugin. The plugin runs at server start, and while
 * `nuxt generate` builds static pages.
 *
 * Both tiers go to Nitro's `druxt` storage:
 *
 * - Each request's render puts the public tier in the Nuxt state that `useDruxtSettings()` reads, and so in the
 *   payload.
 * - `useDruxtServerSettings()` reads the server tier.
 *
 * With an `event`, the tiers are for that request only. Each takes the place of the stored one, and nothing is
 * stored.
 *
 * Calls for one connection write in the order they were made, each after the one before. So two calls that overlap,
 * such as one per tier, keep both tiers. That holds within one server process only. Two instances that share a
 * storage driver each read, merge and write on their own, and the later write replaces the earlier.
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
  const write = async (): Promise<void> => {
    const current = (await storage.getItem<DrupalSettingsTiers>(key)) || {}
    const next: DrupalSettingsTiers = { ...current }
    if (tiers.public) next.public = tiers.public
    if (tiers.server) next.server = tiers.server
    await storage.setItem(key, next)
  }
  // This write runs after the write before it, whether that one stored or failed.
  const turn = (writes.get(key) || Promise.resolve()).then(write, write)
  const settled = turn.catch(() => {})
  writes.set(key, settled)
  try {
    await turn
  }
  finally {
    if (writes.get(key) === settled) writes.delete(key)
  }
}

/**
 * Reads a connection's stored tiers, once per request.
 *
 * A failed read is logged and counts as no tiers, so a storage outage leaves the config in force.
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
