import { DRUXT_CLIENT_KEYS } from '@druxt/client'
import type { DruxtSettings } from '@druxt/client'

// No #imports here: the app, the server routes and the unit tests all use this file.

/**
 * A connection's settings from Drupal, in two tiers.
 *
 * Drupal marks each setting it publishes for a Consumer as public or server
 * only. A decoupled-settings fetcher splits them into these two tiers.
 */
export interface DrupalSettingsTiers {
  /** Settings for the browser. Kept in Nuxt state, so they reach the payload. */
  public?: Partial<DruxtSettings>
  /** Settings Drupal marks server only. Kept in Nitro storage and on the request, never in state or the payload. */
  server?: Record<string, unknown>
}

/**
 * The Nuxt state key that holds a connection's public tier of settings from Drupal.
 *
 * @param connection - The connection, `default` unless named.
 * @returns The key, such as `druxt:settings:drupal:default`.
 *
 * @example
 * const fromDrupal = useState(DRUXT_SETTINGS_DRUPAL_KEY('default'))
 */
export const DRUXT_SETTINGS_DRUPAL_KEY = (connection = 'default'): string => `druxt:settings:drupal:${connection}`

/**
 * The key, in Nitro's `druxt` storage, that holds a connection's settings from Drupal, both tiers.
 *
 * @param connection - The connection, `default` unless named.
 * @internal
 */
export const drupalSettingsStorageKey = (connection = 'default'): string => `settings:${connection}`

/** The settings before Drupal or the site sets any. @internal */
export const DRUXT_SETTINGS_DEFAULTS: Readonly<DruxtSettings> = Object.freeze({ develMessages: 'devtools' })

const warned = new Set<string>()

/**
 * The connection a settings function resolves. 2.0 has only `default`, so
 * any other name resolves to it, with one warning per name when `warn` is given.
 *
 * @param connection - The name the caller asked for.
 * @param warn - Where to warn, in development only.
 * @internal
 */
export const connectionName = (connection: string | undefined, warn?: (message: string) => void): 'default' => {
  if (connection && connection !== 'default' && warn && !warned.has(connection)) {
    warned.add(connection)
    warn(`The connection "${connection}" is reserved for a later release: the "default" connection's settings are used.`)
  }
  return 'default'
}

type Plain = Record<string, unknown>
const isPlain = (value: unknown): value is Plain => !!value && typeof value === 'object' && !Array.isArray(value)

/**
 * The site's config as a settings source: a key left `undefined`, or set to
 * an empty string, is dropped at every depth, so it cannot erase what Drupal
 * set. An empty string counts as unset because Nuxt applies an environment
 * variable only to a key that exists, so a key such as `siteUrl` defaults to
 * `''`. An object left empty only by such keys is dropped too.
 *
 * @param config - The public or private `druxt` runtime config.
 * @internal
 */
export const configSource = (config: unknown): Partial<DruxtSettings> | undefined => {
  if (!isPlain(config)) return undefined
  const out: Plain = {}
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === '') continue
    if (!isPlain(value)) {
      out[key] = value
      continue
    }
    // An object left empty only by unset keys is unset too.
    const inner = configSource(value)!
    if (Object.keys(inner).length || !Object.keys(value).length) out[key] = inner
  }
  return out
}

// Keys that are not settings: the client's options, how it reaches Drupal,
// the connection's credentials, and the anchors, which the build settles.
const NOT_SETTINGS = new Set<string>([...DRUXT_CLIENT_KEYS, 'build', 'connections', 'anchors'])

/**
 * Only the settings in a source: the client's options (`baseUrl`, `proxy`,
 * `auth` and the rest of `DRUXT_CLIENT_KEYS`), `build` and `connections` are
 * left out, whether the config or Drupal holds them, so Drupal cannot change
 * how the client reaches it. So is `anchors`, which the build settles, so
 * Drupal cannot change it either.
 *
 * @param source - The config or a tier from Drupal.
 * @internal
 */
export const settingsOnly = (source: unknown): Partial<DruxtSettings> | undefined => {
  if (!isPlain(source)) return undefined
  return Object.fromEntries(Object.entries(source).filter(([key]) => !NOT_SETTINGS.has(key)))
}

/** Where a request keeps its own tiers, by connection: `event.context`. @internal */
export interface DrupalSettingsContext {
  druxtSettings?: Record<string, DrupalSettingsTiers>
}

/**
 * Writes the tiers given onto a request's context, leaving a tier not given as it was.
 *
 * @param context - The request event's context.
 * @param connection - The connection.
 * @param tiers - The tiers to write.
 * @internal
 */
export const writeRequestTiers = (context: DrupalSettingsContext, connection: string, tiers: DrupalSettingsTiers): void => {
  const all = (context.druxtSettings ||= {})
  const current = { ...all[connection] }
  if (tiers.public) current.public = tiers.public
  if (tiers.server) current.server = tiers.server
  all[connection] = current
}
