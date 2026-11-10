import type { DruxtClientOptions, DruxtConnectionConfig, DruxtConsumer } from './types'

/**
 * The settings Druxt's modules read: `siteUrl`, `develMessages`, and one key
 * per module, such as `router` or `schema`.
 */
export interface DruxtSettings {
  /** The site's public origin, used for canonical URLs. */
  siteUrl?: string
  /** Where Druxt's development messages show: the development tools (the default), or inline as 1.x showed them. */
  develMessages?: 'devtools' | 'inline'
  [module: string]: unknown
}

/** The flat shape a site writes: the client's options and the module settings together. */
export type DruxtConfig = DruxtClientOptions & DruxtSettings & {
  baseUrl: string
  /** The Consumer's credentials, for build-time and server reads. */
  build?: { auth?: Partial<{ clientId: string, clientSecret: string, scope: string, username: string, password: string }> }
  /** Reserved for 2.1.0: other Drupal sites by name. In 2.0 only the flat keys, the `default` connection, are used. */
  connections?: Record<string, DruxtConnectionConfig>
}

// The declared keys of an interface, without its index signature.
type KnownKeys<T> = keyof { [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K] }

/**
 * The keys of {@link DruxtClientOptions}: how to reach Drupal.
 *
 * The compiler checks the list against the interface in both directions, so a
 * key added to one and not the other fails `yarn typecheck`.
 */
export const DRUXT_CLIENT_KEYS = [
  'logger',
  'fetch',
  'headers',
  'onRequest',
  'warnOmitted',
  'auth',
  'baseUrl',
  'cache',
  'debug',
  'endpoint',
  'jsonapiResourceConfig',
  'prefixes',
  'proxy',
] as const satisfies ReadonlyArray<KnownKeys<DruxtClientOptions>>

// The other direction: every declared client option is listed. Fails to compile with the missing key.
const clientKeysComplete: [Exclude<KnownKeys<DruxtClientOptions>, typeof DRUXT_CLIENT_KEYS[number]>] extends [never] ? true : never = true
void clientKeysComplete

type Plain = Record<string, unknown>
const isObject = (value: unknown): value is Plain => !!value && typeof value === 'object' && !Array.isArray(value)

/**
 * Deep merges `source` into a copy of `target`, as deepmerge did with its arrays replaced.
 *
 * The newer value wins, null and undefined included, and arrays are taken whole.
 * defu cannot stand in here, because it skips null values and concatenates
 * arrays, so it would keep a relationship that the newer document emptied.
 * Neither argument is changed.
 *
 * `@druxt/core` imports it: its store merges each fetched document into the
 * one it holds, and its settings merge Drupal's public tier into the stored
 * one. A module can merge the same way.
 *
 * @param target - The base object.
 * @param source - The object whose values win.
 * @returns A new merged object.
 *
 * @example
 * mergeDeep({ a: { b: 1, c: [1, 2] } }, { a: { c: [3] } }) // { a: { b: 1, c: [3] } }
 */
export function mergeDeep<T extends object>(target: object, source: T): T {
  const from = target as Plain
  const out: Plain = {}
  for (const key of Object.keys(from)) {
    // An own __proto__, as JSON.parse() makes one, would set the copy's prototype.
    if (key === '__proto__') continue
    out[key] = isObject(from[key]) ? mergeDeep({}, from[key]) : from[key]
  }
  for (const [key, value] of Object.entries(source)) {
    // A key the target only inherits, such as __proto__, is never written, nor an own __proto__ on either side.
    if (key === '__proto__' || (key in from && !Object.prototype.hasOwnProperty.call(from, key))) continue
    out[key] = isObject(value) ? mergeDeep(isObject(out[key]) ? out[key] : {}, value) : value
  }
  return out as T
}

// Copies plain objects and arrays (config is acyclic and JSON-like, so there is no cycle guard), and keeps anything else, such as a function or a class instance, by reference.
const copy = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(copy)
  if (!isObject(value)) return value
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) return value
  const out: Plain = {}
  for (const [key, inner] of Object.entries(value)) if (key !== '__proto__') out[key] = copy(inner)
  return out
}

// Keys that hold a function or a logger, which a config copy keeps by reference.
const BY_REFERENCE = new Set(['logger', 'fetch'])

const pick = (from: Plain, skip?: string): Plain => {
  const out: Plain = {}
  for (const key of DRUXT_CLIENT_KEYS) {
    if (key === skip || !Object.prototype.hasOwnProperty.call(from, key) || from[key] === undefined) continue
    out[key] = BY_REFERENCE.has(key) ? from[key] : copy(from[key])
  }
  return out
}

/**
 * Builds the connections a site's config describes.
 *
 * In 2.0 only the `default` connection exists, built from the flat keys: the
 * client's options, `build.auth` as the `consumer` (`clientId` as `id`,
 * `clientSecret` as `secret`) and `auth` as `browser`. When `build.auth` gives
 * no `clientId`, the Consumer is
 * `auth.clientId`, the one-Consumer case. A flat `auth.clientSecret` goes on the
 * Consumer when the browser's client is the Consumer, and on `browser.secret`
 * when it is another client. Names in `config.connections` other than
 * `default` are reserved for 2.1.0, so they are listed in `ignored` for the
 * caller to warn about.
 *
 * @param config - The site's flat config.
 * @returns The connections by name, and the names that were ignored.
 *
 * @example
 * const { connections, ignored } = connectionsFrom(config)
 */
export function connectionsFrom(config: DruxtConfig): { connections: { default: DruxtConnectionConfig }, ignored: string[] } {
  const flat = config as Plain
  const connection = pick(flat, 'auth') as DruxtConnectionConfig
  const auth = isObject(flat.auth) ? flat.auth : undefined
  const build = isObject(flat.build) && isObject(flat.build.auth) ? flat.build.auth : undefined
  const id = (typeof build?.clientId === 'string' && build.clientId) || (typeof auth?.clientId === 'string' && auth.clientId) || undefined
  const sameClient = !!auth && auth.clientId === id
  let consumerSecret = build?.clientSecret as string | undefined
  if (auth) {
    const { clientSecret, ...publicAuth } = copy(auth) as Plain
    const browser = publicAuth as Plain
    if (clientSecret) {
      if (sameClient) consumerSecret ||= clientSecret as string
      else browser.secret = clientSecret
    }
    connection.browser = browser as unknown as NonNullable<DruxtConnectionConfig['browser']>
  }
  if (id) {
    const consumer: DruxtConsumer = { id }
    if (consumerSecret) consumer.secret = consumerSecret
    for (const key of ['scope', 'username', 'password'] as const) {
      if (build?.[key]) consumer[key] = build[key] as string
    }
    connection.consumer = consumer
  }
  const ignored = Object.keys(config.connections || {}).filter(name => name !== 'default')
  return { connections: { default: connection }, ignored }
}

/**
 * Picks the client's options out of a connection, or out of a flat site config.
 *
 * A connection's `browser` becomes the client's `auth` option. Browser sign-in
 * is opt-in, so a `consumer` alone sets no `auth`, but an `auth` that names no
 * `clientId` takes the Consumer's id. The result never holds a secret: the
 * `clientSecret` and `secret` of `auth` are left out, as is a string `password`.
 * Core adds the secret back on the server. Module settings, `consumer` and
 * `connections` are left out too. The result is a
 * deep copy, so changing it leaves the input alone, apart from `logger` and
 * `fetch`, which are kept by reference.
 *
 * @param connection - A connection, or the site's flat config.
 * @returns A new object holding only the client's options, with a `baseUrl` when the input has one, as the flat
 *   config always does.
 *
 * @example
 * const client = new DruxtClient(config.baseUrl, clientOptions(config))
 */
export function clientOptions(connection: DruxtConfig): DruxtClientOptions & { baseUrl: string }
export function clientOptions(connection: DruxtConnectionConfig): DruxtClientOptions
export function clientOptions(connection: DruxtConnectionConfig | DruxtConfig): DruxtClientOptions {
  const from = connection as Plain
  const out = pick(from)
  if (isObject(from.browser)) out.auth = copy(from.browser)
  if (isObject(out.auth)) {
    const auth = out.auth
    delete auth.clientSecret
    delete auth.secret
    if (typeof auth.password === 'string') delete auth.password
    if (auth.type !== false && !auth.clientId) {
      const id = (isObject(from.consumer) && from.consumer.id) || (isObject(from.build) && isObject(from.build.auth) && from.build.auth.clientId)
      if (id) auth.clientId = id
    }
  }
  return out as DruxtClientOptions
}

/**
 * Resolves the module settings from several sources.
 *
 * Sources merge left to right, so later sources win. Nested objects merge,
 * arrays are replaced, and an `undefined` source is skipped. A later source's
 * explicit `undefined` value overwrites an earlier value, so drop unset keys
 * from a source before resolving if they must not erase one.
 *
 * @param sources - The settings, lowest priority first.
 * @returns A new resolved settings object.
 *
 * @example
 * const settings = resolveDruxtSettings(defaults, fromDrupal, fromConfig)
 */
export function resolveDruxtSettings(...sources: Array<Partial<DruxtSettings> | undefined>): DruxtSettings {
  let out: DruxtSettings = {}
  for (const source of sources) if (source) out = mergeDeep(out, source)
  return out
}
