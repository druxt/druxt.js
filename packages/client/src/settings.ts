import type { DruxtClientOptions, DruxtConnectionConfig, DruxtConsumer } from './types'

/**
 * The settings Druxt's modules read.
 *
 * They are `siteUrl`, `develMessages`, and one key per module, such as `router` or `schema`.
 */
export interface DruxtSettings {
  /** The site's public origin, used for canonical URLs. */
  siteUrl?: string
  /** Where Druxt's development messages show: in the development tools, the default, or inline, as 1.x showed them. */
  develMessages?: 'devtools' | 'inline'
  [module: string]: unknown
}

/** The flat shape a site writes: the client's options and the module settings together. */
export type DruxtConfig = DruxtClientOptions & DruxtSettings & {
  baseUrl: string
  /** The Consumer's credentials, for build-time and server reads. */
  build?: {
    auth?: Partial<{ clientId: string, clientSecret: string, scope: string, username: string, password: string }>
  }
  /** Reserved for 2.1.0: other Drupal sites, by name. 2.0 uses only the flat keys, which are the `default` connection. */
  connections?: Record<string, DruxtConnectionConfig>
}

// The declared keys of an interface, without its index signature.
type KnownKeys<T> = keyof { [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K] }

/**
 * The keys of {@link DruxtClientOptions}: the options that say how to reach Drupal.
 *
 * The compiler checks the list against the interface in both directions. A key added to one and not the other fails
 * `yarn typecheck`.
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

// The other direction: every declared client option is in the list. A missing key fails to compile, and the error
// names it.
const clientKeysComplete: [Exclude<KnownKeys<DruxtClientOptions>, typeof DRUXT_CLIENT_KEYS[number]>] extends [never]
  ? true
  : never = true
void clientKeysComplete

type Plain = Record<string, unknown>
const isObject = (value: unknown): value is Plain => !!value && typeof value === 'object' && !Array.isArray(value)

/**
 * Deep merges `source` into a copy of `target`.
 *
 * - The newer value wins, null and undefined included.
 * - Nested objects merge.
 * - An array is taken whole.
 * - Neither argument is changed.
 *
 * defu cannot stand in for it. defu skips null values and joins arrays, so it would keep a relationship that the
 * newer document emptied.
 *
 * `@druxt/core` uses it twice. Its store merges each fetched document into the one it holds, and its settings merge
 * Drupal's public tier into the stored one. A module can merge the same way.
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
    // An own `__proto__` key, as `JSON.parse()` can make, would set the copy's prototype. It is skipped.
    if (key === '__proto__') continue
    out[key] = isObject(from[key]) ? mergeDeep({}, from[key]) : from[key]
  }

  for (const [key, value] of Object.entries(source)) {
    // A key the target only inherits, such as `__proto__`, is never written. Nor is an own `__proto__` key on
    // either side.
    if (key === '__proto__' || (key in from && !Object.prototype.hasOwnProperty.call(from, key))) continue
    out[key] = isObject(value) ? mergeDeep(isObject(out[key]) ? out[key] : {}, value) : value
  }

  return out as T
}

// Copies plain objects and arrays. Config is acyclic and JSON-like, so there is no cycle guard. Anything else, such
// as a function or a class instance, is kept by reference.
const copy = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(copy)
  if (!isObject(value)) return value
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) return value
  const out: Plain = {}
  for (const [key, inner] of Object.entries(value)) if (key !== '__proto__') out[key] = copy(inner)
  return out
}

// The keys that hold a function or a logger. A config copy keeps them by reference.
const BY_REFERENCE = new Set(['logger', 'fetch'])

// Picks the client's options out of an object, and copies each value. `skip` names one key to leave out.
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
 * 2.0 has one connection, `default`. It is built from the flat keys:
 *
 * - The client's options are copied.
 * - `build.auth` becomes the `consumer`, with `clientId` as `id` and `clientSecret` as `secret`.
 * - `auth` becomes `browser`.
 *
 * When `build.auth` gives no `clientId`, the Consumer is `auth.clientId`. This is the one-Consumer case.
 *
 * A flat `auth.clientSecret` goes on the Consumer when the browser's client is the Consumer. It goes on
 * `browser.secret` when the browser's client is another client.
 *
 * Names in `config.connections` other than `default` are reserved for 2.1.0. They are returned in `ignored`, so the
 * caller can warn about them.
 *
 * @param config - The site's flat config.
 * @returns The connections by name, and the names that were ignored.
 *
 * @example
 * const { connections, ignored } = connectionsFrom(config)
 */
export function connectionsFrom(
  config: DruxtConfig,
): { connections: { default: DruxtConnectionConfig }, ignored: string[] } {
  const flat = config as Plain
  const connection = pick(flat, 'auth') as DruxtConnectionConfig
  const auth = isObject(flat.auth) ? flat.auth : undefined
  const build = isObject(flat.build) && isObject(flat.build.auth) ? flat.build.auth : undefined
  const id = (typeof build?.clientId === 'string' && build.clientId)
    || (typeof auth?.clientId === 'string' && auth.clientId)
    || undefined
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
 * - A connection's `browser` becomes the client's `auth` option.
 * - Browser sign-in is opt-in, so a `consumer` alone sets no `auth`. An `auth` that names no `clientId` takes the
 *   Consumer's id.
 * - The result never holds a secret. The `clientSecret` and `secret` of `auth` are left out, and so is a string
 *   `password`. Core adds the secret back on the server.
 * - Module settings, `consumer` and `connections` are left out.
 * - The result is a deep copy, so changing it leaves the input alone. `logger` and `fetch` are kept by reference.
 *
 * @param connection - A connection, or the site's flat config.
 * @returns A new object that holds only the client's options. It has a `baseUrl` when the input has one, as the flat
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
      const id = (isObject(from.consumer) && from.consumer.id)
        || (isObject(from.build) && isObject(from.build.auth) && from.build.auth.clientId)
      if (id) auth.clientId = id
    }
  }

  return out as DruxtClientOptions
}

/**
 * Resolves the module settings from several sources.
 *
 * Sources merge left to right, so a later source wins. Nested objects merge, and arrays are replaced. An `undefined`
 * source is skipped.
 *
 * An explicit `undefined` value in a later source overwrites an earlier value. Remove unset keys from a source first
 * if they must not erase one.
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
