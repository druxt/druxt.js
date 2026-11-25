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
 * A JSON:API resource.
 *
 * Its attributes are whatever the entity's fields hold, so they are typed `any`. Narrowing them is the site's job,
 * for each bundle.
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
  /**
   * Also keeps every GET made through `get()`: entities, collections, views and route lookups. Without it, only the
   * index is kept. Off by default.
   */
  content?: boolean
  /**
   * The bytes of stored JSON each cache area keeps, 50 MB by default.
   *
   * An area holds one kind of answer, such as the content or a module's menus, across every set of client headers.
   * Past the limit, the area's least recently used entries go, whichever set holds them. A response larger than the
   * limit is not kept.
   */
  maxSize?: number
  /** The most seconds an entry may live. It never extends `Cache-Control`. */
  ttl?: number
  /**
   * A pattern for the session cookie's name, `S?SESS[0-9a-f]+` by default. Druxt's token cookies count as credentials
   * whatever it is.
   */
  sessionCookie?: string
}

/** How a resource read goes to Drupal. */
export interface DruxtReadOptions {
  /** Fetches from Drupal even when the process cache holds the URL, and stores the fresh response. */
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
  /** The OAuth scope to ask for. */
  scope?: string
  /** The token endpoint, `/oauth/token` by default. */
  tokenUrl?: string
  /** The confidential Consumer's token URL, when it is not `tokenUrl`. */
  passwordTokenUrl?: string
  /** The authorization endpoint, `/oauth/authorize` by default. */
  authorizeUrl?: string
  /** The OpenID Connect userinfo endpoint, `/oauth/userinfo` by default. */
  userInfoUrl?: string
  /** Where the tokens are kept. In memory by default. */
  storage?: AuthStorage
  refresh?: {
    /** The milliseconds a successful refresh is reused for, 5000 by default. */
    grace?: number
    /** The most refreshes that start in one window, 3 by default. */
    limit?: number
    /** The window's length in milliseconds, 30000 by default. */
    window?: number
    /**
     * Shares one refresh between clients that hold one session.
     *
     * A server's renders for one browser are such clients. Each render has a client of its own, and Simple OAuth
     * accepts a refresh token once.
     *
     * It is called with a key that names the session, the function that starts the refresh, and `grace`. The key
     * holds the session's tokens, so never log it. It resolves with the token response of the refresh it started
     * or joined. Each client stores the answer while it still holds that session.
     */
    share?: <T>(session: string, start: () => Promise<T>, grace: number) => Promise<T>
  }
  /**
   * Turns on session mode. The site's server holds the tokens, in httpOnly cookies, and a proxy adds the
   * `Authorization` header, as Druxt's proxy does in a browser.
   *
   * The client then:
   *
   * - Holds only the session marker, `druxt.auth.session`.
   * - Sends no `Authorization` header.
   * - Refreshes through `tokenUrl`, with no refresh token of its own.
   * - Signs out through `logoutUrl`.
   */
  session?: boolean
  /** In session mode, the site's route that clears the session's cookies. */
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
   * Whether the site's server holds the session in httpOnly cookies, so the browser never holds a token. It is on
   * with the proxy, unless `exposeToken` is set. Druxt's core module sets it.
   */
  session?: boolean
  /** Keeps the tokens in cookies the browser's scripts can read, for a direct call outside the proxy. It is weaker. */
  exposeToken?: boolean
}

/**
 * A connection's Consumer: the Simple OAuth client entity the frontend acts as.
 *
 * - It signs in the server's reads: the build client, restricted schemas and the server routes.
 * - It identifies the frontend to decoupled settings, unless that is overridden.
 * - It is the browser's client too, when browser sign-in is on and names no other client.
 *
 * `secret` is typed here, but never belongs in public config or in the browser.
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
  /** The HTTP method, `GET` by default. */
  method?: string
  /** Headers for this request, which win over the client's. An `undefined` value removes a header. */
  headers?: Record<string, string | undefined>
  /**
   * The request body.
   *
   * - A plain object or an array is sent as JSON:API JSON.
   * - Anything else is sent as it is: a string, `URLSearchParams`, a `Blob`, a buffer, `FormData` or a stream.
   * - A `ReadableStream` or an async iterable is sent with `duplex: 'half'`, which fetch requires for a stream body.
   *
   * A stream is consumed as it is sent, so it is never sent twice. A 401 to it still refreshes the session, but the
   * request is not sent again, and is not repeated anonymously. The caller retries with a new stream.
   */
  body?: unknown
  /** Decides which statuses resolve and which throw. Only a 2xx resolves by default. */
  validateStatus?: (status: number) => boolean
  /** Set to false to send the request without the signed-in user's token, and with no refresh or retry. */
  auth?: false
  /** Fetches from Drupal even when the process cache holds the URL, and stores the fresh response. `get()` only. */
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
 * A request the client sends, as an `onRequest` listener sees it.
 *
 * A `start` event has the request's method and URL. An `end` event adds its status and timing.
 *
 * An event never carries headers or a body. Its URL has no user name or password. The values of the query keys
 * `token`, `access_token`, `code`, `password` and `client_secret` are emptied. Other query values pass as sent.
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
  /**
   * Where debug and warning messages go. By default it is `console`, with each message tagged `[DruxtClient]`.
   * Druxt's Nuxt module passes consola.
   */
  logger?: DruxtLogger
  /** The fetch to send requests with, `globalThis.fetch` by default. */
  fetch?: DruxtFetch
  /** Headers sent with every request. `Authorization`, `Proxy-Authorization` and `Cookie` go only to Drupal's origin. */
  headers?: Record<string, string>
  /**
   * Warns when Drupal omits resources from a response. The warning names the resource type and quotes Drupal's
   * reason.
   *
   * Each type is warned about once for the site, until a client of the site runs `clearCache()`. Off by default.
   * Druxt's Nuxt module turns it on in development.
   */
  warnOmitted?: boolean
  /** Called as each request starts and ends, for logging and metrics. `client.onRequest()` adds more listeners. */
  onRequest?: DruxtRequestListener
  /**
   * The OAuth options. Only a `clientId` turns auth on. 1.x code passes other shapes, such as the schema generator's
   * `{ type: false }`.
   */
  auth?: DruxtAuthOptions | { type: false }
  /** The Drupal base URL. It wins over the constructor's argument. */
  baseUrl?: string
  /**
   * The process cache. It is off unless set. When on, it keeps the JSON:API index between server requests made
   * without credentials.
   */
  cache?: ProcessCacheOptions | false
  /** Logs each request's URL. */
  debug?: boolean
  /** The JSON:API endpoint's path, `/jsonapi` by default. */
  endpoint?: string
  /**
   * The resource type of JSON:API Extras' resource config, `jsonapi_resource_config--jsonapi_resource_config` by
   * default.
   */
  jsonapiResourceConfig?: string
  /**
   * The URL prefix each langcode is served under, as Drupal's URL language negotiation configures it:
   * `{ en: '', es: 'spanish' }`.
   *
   * With it, a method's `prefix` argument takes a langcode as well as a prefix. A langcode the map lacks is used as
   * the prefix itself. Druxt's core module fills it from the build's read of the languages.
   */
  prefixes?: Record<string, string>
  /** The proxy settings. With `api` on, a path resolves against this page's origin, not the base URL. */
  proxy?: { api?: boolean, files?: boolean | string }
  [key: string]: unknown
}

/**
 * One Drupal site as one frontend sees it: the client's options and its Consumer.
 *
 * The flat keys of a site's config are the `default` connection.
 */
export interface DruxtConnectionConfig extends DruxtClientOptions {
  /**
   * The connection's Consumer. It is used for server reads. It is the browser's client too, when browser sign-in is
   * on and names no other client.
   */
  consumer?: DruxtConsumer
  /**
   * The browser's sign-in, when it is on.
   *
   * It can name a different client than the Consumer, such as a PKCE client with no secret. With `clientId` left
   * out, it is the Consumer's own client. `secret` is a confidential client's, and stays on the server.
   */
  browser?: Omit<DruxtPublicAuthOptions, 'clientId'> & { clientId?: string, secret?: string }
}

/** What `DruxtClient.error()` throws. */
export interface DruxtError extends Error {
  response?: Partial<DruxtResponse<JsonApiDocument | undefined>>
    | { status?: number, statusText?: string, data?: { errors?: JsonApiError[] } }
  druxt?: { url?: string }
}
