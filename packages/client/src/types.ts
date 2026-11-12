/** A JSON:API link object. Drupal always sends `href`. */
export interface JsonApiLink {
  href: string
  meta?: Record<string, unknown>
}

export type JsonApiLinks = Record<string, JsonApiLink | undefined>

export interface JsonApiResourceIdentifier {
  type: string
  id: string
  meta?: Record<string, unknown>
}

export interface JsonApiRelationship {
  data?: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] | null
  links?: JsonApiLinks
  meta?: Record<string, unknown>
}

/**
 * A JSON:API resource. Attributes are whatever the entity's fields hold, so
 * they are `any` by design: narrowing them is the site's job, per bundle.
 */
export interface JsonApiResource {
  type: string
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: Record<string, any>
  relationships?: Record<string, JsonApiRelationship>
  links?: JsonApiLinks
  meta?: Record<string, unknown>
}

export interface JsonApiError {
  status?: string
  title?: string
  detail?: string
  source?: { pointer?: string }
}

/** A JSON:API document: one resource, a collection, or errors. */
export interface JsonApiDocument<D = JsonApiResource | JsonApiResource[]> {
  data: D
  included?: JsonApiResource[]
  links?: JsonApiLinks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>
  errors?: JsonApiError[]
}

export type JsonApiCollection = JsonApiDocument<JsonApiResource[]>

/** A field's JSON:API Extras configuration. */
export interface ResourceField {
  publicName: string
  fieldName?: string
  disabled?: boolean
  [key: string]: unknown
}

/** An index entry: the link, plus what JSON:API Extras adds. */
export interface JsonApiIndexEntry extends JsonApiLink {
  resourceType?: string
  entityType?: string
  bundle?: string
  resourceFields?: Record<string, ResourceField>
}

export type JsonApiIndex = Record<string, JsonApiIndexEntry>

/** Something with drupal-jsonapi-params' `getQueryString()`. */
export interface QueryStringSource {
  getQueryString(): string
}

/**
 * A JSON:API query: a string, drupal-jsonapi-params, or a plain object.
 *
 * @example @lang js
 * 'page[limit]=5&page[offset]=5'
 *
 * @example @lang js
 * new DrupalJsonApiParams().addPageLimit(5)
 */
export type DruxtClientQuery = string | QueryStringSource | Record<string, unknown>

export interface ProcessCacheOptions {
  /** Also keep entities, collections, views and route lookups, every GET through `get()`, not only the index. Off by default. */
  content?: boolean
  /**
   * Bytes of stored JSON each cache area keeps per set of client headers, 50 MB by default. Past it the least recently
   * used go, and a response larger than it is not kept. An area keeps 32 sets of headers at most, the least recently
   * used going first, so it holds 32 times this at most.
   */
  maxSize?: number
  /** Seconds an entry may live at most. It never extends Cache-Control. */
  ttl?: number
  /** A pattern for the session cookie name, `S?SESS[0-9a-f]+` by default. Druxt's token cookies count as credentials whatever it is. */
  sessionCookie?: string
}

/** How a resource read goes to Drupal. */
export interface DruxtReadOptions {
  /** Fetch from Drupal even when the process cache holds the URL, and store the fresh response. */
  bypassCache?: boolean
}

/** Where a framework keeps the auth tokens. */
export interface AuthStorage {
  get(key: string): string | number | undefined | null
  set(key: string, value: string | number | undefined): void
  remove(key: string): void
}

export interface DruxtAuthOptions {
  /** The Consumer's client ID. */
  clientId: string
  /** The password grant's Consumer, when it is not `clientId`. */
  passwordClientId?: string
  /** A confidential Consumer's secret. Never set it in a browser. */
  clientSecret?: string
  scope?: string
  tokenUrl?: string
  /** The confidential Consumer's token URL, when not `tokenUrl`. */
  passwordTokenUrl?: string
  authorizeUrl?: string
  userInfoUrl?: string
  storage?: AuthStorage
  refresh?: {
    grace?: number
    limit?: number
    window?: number
    /**
     * Shares a refresh between clients holding one session, as a server's renders for one browser do: each render
     * has a client of its own, and Simple OAuth accepts a refresh token once. Called with a key naming the session,
     * which holds its tokens, so never log it; the refresh to start; and `grace`. Resolves with the token response of
     * the refresh it started or joined. Each client stores the answer while it still holds that session.
     */
    share?: <T>(session: string, start: () => Promise<T>, grace: number) => Promise<T>
  }
  /**
   * Whether the site's server holds the tokens, in httpOnly cookies, and a proxy adds the Authorization header, as
   * Druxt's does in a browser. The client then holds only the session marker, `druxt.auth.session`, sends no
   * Authorization header, refreshes through `tokenUrl` with no refresh token of its own, and signs out through
   * `logoutUrl`.
   */
  session?: boolean
  /** With `session` on, the site's route that clears the session's cookies. */
  logoutUrl?: string
}

/** The browser's public OAuth client for a connection: no secret. */
export interface DruxtPublicAuthOptions {
  clientId: string
  passwordClientId?: string
  scope?: string
  authorizeUrl?: string
  /** Whether the password grant is offered. */
  password: boolean
  login: string | false
  callback: string
  /**
   * Whether the site's server holds the session in httpOnly cookies, so the browser never holds a token: on with the
   * proxy, unless `exposeToken` is set. Set by Druxt's core module.
   */
  session?: boolean
  /** Keeps the tokens in cookies the browser's scripts can read, for a direct call outside the proxy. Weaker. */
  exposeToken?: boolean
}

/**
 * A connection's Consumer: the Simple OAuth client entity the frontend acts as.
 *
 * It signs the server's reads in (the build client, restricted schemas, the
 * server routes) and, unless overridden, identifies the frontend to decoupled
 * settings. It is also the browser's client when browser sign-in is on and
 * names no other client. `secret` is typed here but never belongs in
 * public config or in the browser.
 */
export interface DruxtConsumer {
  /** The Consumer's client ID. */
  id: string
  secret?: string
  scope?: string
  username?: string
  password?: string
}

/** A function with the Fetch API's signature, such as `globalThis.fetch`. */
export type DruxtFetch = (input: string, init?: RequestInit) => Promise<Response>

/** A request through `DruxtClient.request()`. */
export interface DruxtRequestOptions {
  method?: string
  /** Headers for this request, over the client's. An `undefined` value removes one. */
  headers?: Record<string, string | undefined>
  /**
   * A plain object or an array is sent as JSON:API JSON. Anything else, such as a string, `URLSearchParams`, a `Blob`,
   * a buffer, `FormData` or a stream, is sent as it is. A `ReadableStream` or an async iterable goes with
   * `duplex: 'half'`, which fetch requires for a stream body. A stream is consumed as it is sent, so it is never sent
   * twice: a 401 to it still refreshes the session, but it is neither sent again nor repeated anonymously. The 401
   * stands, for the caller to retry with a new stream.
   */
  body?: unknown
  /** Which statuses resolve rather than throw: 2xx by default. */
  validateStatus?: (status: number) => boolean
  /** False sends the request without the signed-in user's token, refresh or retry. */
  auth?: false
  /** Fetch from Drupal even when the process cache holds the URL, and store the fresh response. `get()` only. */
  bypassCache?: boolean
}

/** What `DruxtClient.request()` resolves to. */
export interface DruxtResponse<T = unknown> {
  /** The parsed JSON body, or the text when it is not JSON. */
  data: T
  status: number
  statusText: string
  headers: Headers
  url: string
}

/** Where the client logs: a consola instance, `console`, or anything with `info` and `warn`. */
export interface DruxtLogger {
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
}

/**
 * A request the client sends, as an `onRequest` listener sees it: its method and URL when it starts, then its status
 * and timing when it ends. It never carries headers or a body. The URL has no user name or password, and the values of
 * the query keys `token`, `access_token`, `code`, `password` and `client_secret` are emptied. Other query values pass as
 * sent.
 */
export type DruxtRequestEvent =
  | { type: 'start', id: number, method: string, url: string }
  | {
    type: 'end'
    id: number
    method: string
    url: string
    /** The HTTP status, when a response came. */
    status?: number
    /** Milliseconds from start to the response, or to the failure. */
    duration: number
    /** Set when no response came, such as a network failure. */
    failed?: boolean
    /** Drupal's reason, when it omitted resources from the response, as for lack of permission. */
    omitted?: string
  }

/** Listens to the client's requests: see {@link DruxtRequestEvent}. */
export type DruxtRequestListener = (event: DruxtRequestEvent) => void | Promise<void>

/**
 * The DruxtClient options.
 *
 * @example @lang js
 * {
 *   // Headers sent with every request.
 *   headers: { 'X-Custom-Header': 'value' },
 *   // Log every request.
 *   debug: true,
 *   // The JSON:API endpoint.
 *   endpoint: 'api',
 * }
 */
export interface DruxtClientOptions {
  /** Where debug and warning messages go: `console`, tagged, by default. Druxt's Nuxt module passes consola. */
  logger?: DruxtLogger
  /** The fetch to send requests with, `globalThis.fetch` by default. */
  fetch?: DruxtFetch
  /** Headers sent with every request. `Authorization`, `Proxy-Authorization` and `Cookie` go only to Drupal's origin. */
  headers?: Record<string, string>
  /**
   * Warn, once per resource type for the site until a client of it runs `clearCache()`, when Drupal omits resources
   * from a response, naming the type and quoting Drupal's reason. Off by default. Druxt's Nuxt module turns it on in
   * development.
   */
  warnOmitted?: boolean
  /** Called as each request starts and ends, for logging and metrics. `client.onRequest()` adds more listeners. */
  onRequest?: DruxtRequestListener
  /**
   * OAuth. Only a `clientId` turns it on: 1.x code passes other shapes, such
   * as the schema generator's `{ type: false }`.
   */
  auth?: DruxtAuthOptions | { type: false }
  baseUrl?: string
  /** The process cache, off unless set: it keeps the JSON:API index between server requests made without credentials. */
  cache?: ProcessCacheOptions | false
  debug?: boolean
  endpoint?: string
  jsonapiResourceConfig?: string
  /**
   * The URL prefix each langcode is served under, as Drupal's URL language negotiation configures it: `{ en: '', es:
   * 'spanish' }`. A method's `prefix` argument then takes a langcode as well as a prefix, and a langcode the map lacks
   * is used as the prefix itself, as before. Druxt's core module fills it from the build's read of the languages.
   */
  prefixes?: Record<string, string>
  proxy?: { api?: boolean, files?: boolean | string }
  [key: string]: unknown
}

/**
 * One Drupal site as one frontend sees it: the client's options and its
 * Consumer. The flat keys of a site's config are the `default` connection.
 */
export interface DruxtConnectionConfig extends DruxtClientOptions {
  /** The connection's Consumer, used for server reads, and as the browser's client when browser sign-in is on and names no other client. */
  consumer?: DruxtConsumer
  /**
   * The browser's sign-in, when it is on. A different client than the Consumer, such as a PKCE client with no secret,
   * or the Consumer's own client with a `clientId` left out. `secret` is a confidential client's, server side only.
   */
  browser?: Omit<DruxtPublicAuthOptions, 'clientId'> & { clientId?: string, secret?: string }
}

/** What `DruxtClient.error()` throws. */
export interface DruxtError extends Error {
  response?: Partial<DruxtResponse<JsonApiDocument | undefined>> | { status?: number, statusText?: string, data?: { errors?: JsonApiError[] } }
  druxt?: { url?: string }
}
