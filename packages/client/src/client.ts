import { DruxtAuth, refreshRefused } from './auth'
import { JsonApiIndexCache } from './jsonApiIndex'
import type { FetchedIndex } from './jsonApiIndex'
import {
  byteSize,
  headersHaveCredentials,
  lifetimeLeft,
  nextRequest,
  parseCacheLifetime,
  processCache,
  rememberLifetime,
  rememberLifetimeFrom,
  resetProcessCache,
} from './processCache'
import type { ProcessCacheHandle } from './processCache'
import { DruxtPermissionsError, isSuperseded } from './errors'
import type { ErrorLike, RequestError } from './errors'
import { indexPath, resourceTypeOf, setHeader } from './utils/href'
import { normalEndpoint, trimEndSlashes } from './paths'
import { listenerUrl, prefixed } from './utils/listener'
import { omittedResources, warnedOmitted } from './omitted'
import type { DruxtOmitted } from './omitted'
import { stringify, withQuery } from './utils/query'
import { supersededError } from './utils/superseded'
import { CACHE_SAFE_OPTIONS, DEFAULT_MAX_SIZE, parse, readOptions } from './utils/contentCache'
import type { StoredResponse } from './utils/contentCache'
import type {
  DruxtAuthOptions,
  DruxtClientOptions,
  DruxtClientQuery,
  DruxtError,
  DruxtFetch,
  DruxtLogger,
  DruxtRequestEvent,
  DruxtRequestListener,
  DruxtRequestOptions,
  DruxtResponse,
  JsonApiCollection,
  JsonApiDocument,
  JsonApiIndex,
  JsonApiIndexEntry,
  JsonApiResource,
  ProcessCacheOptions,
  DruxtReadOptions,
} from './types'

/** The read methods. Only a read is repeated as the anonymous visitor after the session ends. */
const READS = new Set(['GET', 'HEAD'])

/**
 * Whether two URLs share an origin.
 *
 * A relative URL is resolved against a placeholder origin, so two relative URLs match.
 */
const sameOrigin = (a: string, b: string): boolean => {
  try {
    return new URL(a, 'http://localhost').origin === new URL(b, 'http://localhost').origin
  } catch {
    return false
  }
}

/** The client headers that carry credentials. They are sent only to the origin Drupal's requests go to. */
const CREDENTIAL_HEADERS = new Set(['authorization', 'proxy-authorization', 'cookie'])

/**
 * Whether a request body is a stream: a `ReadableStream` or an async iterable.
 *
 * A `ReadableStream` is identified by its methods, not by `instanceof`, so a stream from another realm counts. No
 * JSON document has those methods.
 *
 * Fetch sends a stream with `duplex` and consumes it as it sends it. So a stream is sent once only, and never as JSON.
 */
const streamed = (body: unknown): boolean => !!body && typeof body === 'object' && (
  (typeof (body as ReadableStream).getReader === 'function' && typeof (body as ReadableStream).locked === 'boolean')
  || typeof (body as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function')

/**
 * The Druxt JSON:API client.
 *
 * It reads, creates and updates resources through Drupal's JSON:API.
 *
 * @see {@link https://druxtjs.org/api/packages/druxt/client|DruxtClient API reference}
 *
 * @example @lang js
 * import { DruxtClient } from '@druxt/client'
 *
 * const druxt = new DruxtClient('https://api.umami.demo.druxtjs.org')
 * const recipes = await druxt.getCollection('node--recipe', { 'page[limit]': 3 })
 */
export class DruxtClient {
  /** Where debug and warning messages go, `console` by default. */
  log: DruxtLogger

  /** The fetch function requests are sent with. */
  fetch: DruxtFetch

  /** Headers sent with every request. Its credential headers go only to Drupal's origin. */
  headers: Record<string, string>

  /** The request listeners, from the `onRequest` option and `onRequest()`. */
  private requestListeners: Set<DruxtRequestListener>

  /** The id of the last request sent. */
  private requestCount: number

  /** True once a request has gone out with credentials. The process cache is then withheld from this client. */
  credentialed: boolean

  /** The options, with the defaults applied. `baseUrl` has no trailing slash, and `endpoint` has one spelling. */
  options: DruxtClientOptions & { baseUrl: string, endpoint: string, jsonapiResourceConfig: string }

  /** OAuth against Drupal's Simple OAuth. Set when the `auth` option has a `clientId`. */
  auth: DruxtAuth | undefined

  /** The key of this site's index in the process cache. */
  indexKey: string

  /** The JSON:API index for each prefix. Each is fetched once and shared between callers. */
  indexCache: JsonApiIndexCache

  /** A counter that `clearCache()` moves on. A cache keyed by this client compares it to know when to empty. */
  cacheGeneration: number

  /**
   * Creates a client for one Drupal site's JSON:API.
   *
   * Auth is turned on when the `auth` option has a `clientId`.
   *
   * @param baseUrl - The Drupal base URL.
   * @param options - The DruxtClient options.
   * @throws When `baseUrl` is empty.
   *
   * @example @lang js
   * import { DruxtClient } from '@druxt/client'
   * const druxt = new DruxtClient('https://api.umami.demo.druxtjs.org', {})
   */
  constructor(baseUrl: string, options: DruxtClientOptions = {}) {
    this.log = options.logger || prefixed(console)

    if (!baseUrl) {
      throw new Error('The \'baseUrl\' parameter is required.')
    }

    // Called through a wrapper: a browser's fetch throws when it is called as a method of another object.
    this.fetch = options.fetch || ((input, init) => globalThis.fetch(input, init))
    this.headers = {}
    this.requestListeners = new Set(options.onRequest ? [options.onRequest] : [])
    this.requestCount = 0
    this.addHeaders({ ...options.headers })
    this.credentialed = false

    this.options = {
      endpoint: '/jsonapi',
      jsonapiResourceConfig: 'jsonapi_resource_config--jsonapi_resource_config',
      ...options,
      // A `baseUrl` option wins over the argument, as in 1.x. Its trailing slashes are removed, so the base URL strips
      // cleanly from the index's links.
      baseUrl: trimEndSlashes(options.baseUrl || baseUrl),
    }

    // One spelling, so a prefix joins the endpoint as `/es/api` however it was given.
    this.options.endpoint = normalEndpoint(this.options.endpoint)

    // Only a `clientId` turns auth on. 1.x code passes other `auth` shapes, such as the schema generator's
    // `{ type: false }`.
    const auth = this.options.auth as Partial<DruxtAuthOptions> | undefined
    this.auth = auth && auth.clientId ? new DruxtAuth(this, auth as DruxtAuthOptions) : undefined

    // The process cache keys this site's index by base URL, endpoint and resource config.
    this.indexKey = JSON.stringify([this.options.baseUrl, this.options.endpoint, this.options.jsonapiResourceConfig])
    this.indexCache = new JsonApiIndexCache({
      key: this.indexKey,
      fetchIndex: (prefix) => this.fetchIndex(prefix),
      // Asked for on each use. A request sent since the last one may have shown that the client sends credentials.
      shared: () => this.processCache('index'),
    })

    this.cacheGeneration = 0
  }

  /** The JSON:API index for each prefix, as fetched so far. */
  get index(): Record<string, JsonApiIndex> {
    return this.indexCache.indexes
  }

  /** The index fetches in flight. Concurrent callers share them. */
  get indexRequests(): Record<string, Promise<FetchedIndex> | undefined> {
    return this.indexCache.requests
  }

  /**
   * Clears the caches this client holds, and the server's process cache.
   *
   * It does four things:
   *
   * - Empties the JSON:API index.
   * - Empties the process cache.
   * - Moves `cacheGeneration` on, so results cached per client, such as menus, are fetched again.
   * - Lets `warnOmitted` warn again about each resource type on this client's site.
   *
   * @example @lang js
   * this.$druxt.clearCache()
   */
  clearCache(): void {
    this.indexCache.clear()
    resetProcessCache()
    this.cacheGeneration += 1
    warnedOmitted.delete(this.options.baseUrl)
  }

  /**
   * Gets the process cache for a scope.
   *
   * The process cache keeps server-side responses between requests. Each response is kept for as long as its
   * `Cache-Control` header allows.
   *
   * The cache must not be used, and this returns undefined, when:
   *
   * - The `cache` option is not set.
   * - The code runs in a browser.
   * - The client sends credentials: an `Authorization` header, a session cookie, an `Origin` header, a signed-in
   *   user's token, or a session the site's server holds.
   *
   * Clients whose headers differ keep separate entries.
   *
   * A handle is for one request. Ask for a new one after `clearCache()` or `resetProcessCache()`. A handle kept
   * across a clear still reads what it held, and its writes are dropped.
   *
   * @param scope - The cache scope, such as `index` or `menu`.
   * @returns The cache, or undefined when it must not be used.
   */
  processCache(scope: string): ProcessCacheHandle | undefined {
    if (!this.options.cache) return undefined
    const { ttl, sessionCookie, maxSize = DEFAULT_MAX_SIZE } = this.options.cache as ProcessCacheOptions

    // A signed-in client in session mode holds no token. Its requests still carry credentials, because the site's
    // proxy adds the session to them.
    const session = !!this.auth?.session && this.auth.loggedIn
    const credentialed = this.credentialed
      || session
      || !!this.auth?.accessToken
      || headersHaveCredentials(this.headers, sessionCookie)

    // Each set of client headers keeps its own entries, `X-Consumer-ID` included. A header may pick a variant that
    // Drupal names in no `Vary`, such as `Accept-Language`. Header names are compared in lower case.
    const headers = Object.entries(this.headers)
      .map(([name, value]): [string, string] => [name.toLowerCase(), value])
      .sort(([a], [b]) => (a < b ? -1 : 1))
    const consumer = headers.length ? JSON.stringify(headers) : ''

    // The content scope stores each response's body as text, so an entry's size is the bytes of that text.
    const sizeOf = scope === 'content' ? (value: unknown) => byteSize((value as StoredResponse).body) : undefined

    return processCache(scope, { credentialed, consumer, ttl, maxSize, sizeOf })
  }

  /**
   * Gets how long a document this client fetched may still be cached.
   *
   * @param document - A JSON:API document returned by this client.
   * @returns The seconds left, from the response's `Cache-Control`. 0 when it may not be cached, or is unknown.
   */
  cacheLifetime(document: unknown): number {
    return lifetimeLeft(document)
  }

  /**
   * Adds headers to every request.
   *
   * `Authorization`, `Proxy-Authorization` and `Cookie` are sent only to the origin Drupal's requests go to, as the
   * access token is. A request to another host goes without them.
   *
   * @param headers - The HTTP headers.
   *
   * @example @lang js
   * this.$druxt.addHeaders({ Authorization: `Basic ${token}` })
   */
  addHeaders(headers?: Record<string, string>): void {
    if (typeof headers === 'undefined') return
    for (const [name, value] of Object.entries(headers)) setHeader(this.headers, name, value)
  }

  /**
   * Gets the absolute URL for a path.
   *
   * The path is joined to the Drupal base URL. When the API is proxied, with the `proxy.api` option, it is joined to
   * this page's origin instead. On a server there is no page origin, so a proxied path stays a path.
   *
   * @param url - A path, with or without its leading slash, or an absolute URL, which is returned as it is.
   * @returns The URL.
   *
   * @example @lang js
   * // 'https://api.umami.demo.druxtjs.org/en/jsonapi/node/article'
   * const url = this.$druxt.url('en/jsonapi/node/article')
   */
  url(url: string): string {
    if (/^https?:\/\//.test(url)) return url
    const base = this.options.proxy?.api ? (globalThis.location?.origin || '') : this.options.baseUrl || ''
    return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
  }

  /**
   * Sends a request, as the signed-in user when there is one.
   *
   * Without a signed-in user, or with `auth: false` in the options, the request is sent once.
   *
   * With a signed-in user:
   *
   * - An expired token is refreshed before the request is sent.
   * - A 401 is answered with one refresh and one retry. This recovers from a token that Drupal revoked before it
   *   expired.
   * - The token goes only to Drupal's origin, or to this origin when the API is proxied. A request to another host is
   *   sent without it, and its 401 is returned as it is.
   *
   * When Drupal refuses the refresh token, with a 400 or a 401, the session ends:
   *
   * - A read, a `GET` or a `HEAD`, is repeated as the anonymous visitor.
   * - A write is not repeated, because it was meant to be made as the user.
   * - A write whose refresh was refused before it was sent is not sent at all. It rejects with the token request's
   *   error.
   *
   * A refresh that fails any other way, such as a timeout, keeps the session. The request is sent with the token it
   * has, and its 401 is not retried.
   *
   * A session with no refresh token cannot refresh. A 401 to its read ends the session, and the read is repeated as
   * the anonymous visitor. A 401 to its write is not retried, and the session is kept.
   *
   * A stream body is sent once. A 401 to it still refreshes the session, but the request is not sent again.
   *
   * A request belongs to the session it was made for:
   *
   * - When another session signs in while the request waits on a refresh, the request is not sent. It rejects with an
   *   error that `isSuperseded()` identifies.
   * - When the session ended while the request waited, the request is sent without a token. A sign-out ends it, and
   *   so does a sign-in that has not stored its tokens yet.
   * - A 401 that arrives after another session signed in is not refreshed or retried.
   *
   * @param url - A path or an absolute URL.
   * @param options - The request options.
   * @returns The response, with its body parsed.
   * @throws When the status fails `validateStatus`, which accepts only a 2xx by default. The error's `response` is
   * the response.
   *
   * @example @lang js
   * const { data, status } = await this.$druxt.request('/jsonapi/node/page', {
   *   method: 'POST',
   *   body: { data: { type: 'node--page', attributes: { title: 'About' } } },
   * })
   */
  async request<T = unknown>(url: string, options: DruxtRequestOptions = {}): Promise<DruxtResponse<T>> {
    const auth = options.auth === false ? undefined : this.auth

    // In session mode the site's proxy adds the session's credentials to every request. This header tells it not to,
    // so a request without auth is anonymous.
    const anonymous = (given: DruxtRequestOptions): DruxtRequestOptions => (
      this.auth?.session ? { ...given, headers: { ...given.headers, 'X-Druxt-Auth': 'none' } } : given
    )
    if (options.auth === false) options = anonymous(options)

    // The token goes only to the origin Drupal's requests go to. Another host gets no token. Its 401 says nothing
    // about Drupal's session, so it causes no refresh, retry or anonymous repeat.
    const own = sameOrigin(this.url(url), this.url('/'))
    const token = () => (own ? auth?.accessToken : undefined)

    // The session this request is made for. A sign-in or a sign-out changes the epoch. A refresh does not.
    const epoch = auth?.epoch

    // An expired token is refreshed first. Only a refusal is kept, as it ends the session. Any other failure keeps
    // the session, and the request is sent with the token it has, so its 401 decides.
    let refused: unknown
    if (own && auth?.expired && auth.canRefresh) {
      await auth.refresh().catch((error: unknown) => {
        if (refreshRefused(error)) refused = error
      })
    }

    // Another session signed in while the request waited, so it is not sent as that session. A session that only
    // ended leaves a signed-out client, and its requests go without a token. A sign-out, a refused refresh and a
    // sign-in still running all end a session that way.
    if (auth && auth.epoch !== epoch && auth.loggedIn) throw supersededError()

    const read = READS.has((options.method || 'GET').toUpperCase())

    // The refresh token was refused. A read goes on as the anonymous visitor. A write is not sent.
    if (refused) {
      if (!read) throw refused
      return this.checked(await this.send<T>(url, anonymous(options)), options)
    }

    // What the storage holds as the request is sent, and whether the request carries a session. A session is a
    // token, or in session mode, the credentials the proxy adds.
    const sent = auth?.held()
    const carried = own && !!auth && (auth.session ? auth.loggedIn : !!auth.accessToken)

    // The first send consumes a stream, so a stream is never sent again. The caller retries with a new one.
    const once = streamed(options.body)

    let response = await this.send<T>(url, options, token())

    if (response.status === 401 && own && auth?.canRefresh) {
      // When another session signed in after the request was sent, the 401 is returned with no refresh or retry.
      if (auth.epoch === epoch) {
        try {
          // The refresh runs for a stream too. The stream is not sent again, but the caller's own retry then goes out
          // as the refreshed session.
          await auth.refresh()
          if (!once) response = await this.send<T>(url, options, token())
        } catch (error) {
          if (refreshRefused(error) && read && !once) response = await this.send<T>(url, anonymous(options))
        }
      }
    } else if (response.status === 401 && auth && carried && sent !== undefined && read) {
      // A read got a 401, and there is nothing to refresh with. Either the session has no refresh token, or another
      // read's refused refresh ended it first. The session the read was sent with ends, unless another was stored
      // since. The read is repeated as the anonymous visitor only when the client is signed out by then.
      auth.drop(sent)
      if (!auth.loggedIn && !once) response = await this.send<T>(url, anonymous(options))
    }

    return this.checked(response, options)
  }

  /**
   * Returns the response, or throws for a status that `validateStatus` refuses.
   *
   * Without a `validateStatus` option, any status but a 2xx is refused.
   *
   * @param response - The response.
   * @param options - The request options.
   * @returns The response.
   * @throws An error whose `response` is the response.
   */
  private checked<T>(response: DruxtResponse<T>, options: DruxtRequestOptions): DruxtResponse<T> {
    if (!(options.validateStatus || ((status: number) => status >= 200 && status < 300))(response.status)) {
      const error = new Error(`Request failed with status code ${response.status}`) as RequestError
      error.response = response
      throw error
    }
    return response
  }

  /**
   * Listens to the requests this client sends.
   *
   * The listener is called when a request starts, with its method and URL. It is called again when the request ends,
   * with its status and duration. It never receives headers, a body or credentials. It suits logging and metrics.
   *
   * @param listener - Called with each start and end.
   * @returns The function that stops listening.
   *
   * @example @lang js
   * const stop = druxt.onRequest((event) => {
   *   if (event.type === 'end') console.log(event.method, event.url, event.status, `${Math.round(event.duration)} ms`)
   * })
   */
  onRequest(listener: DruxtRequestListener): () => void {
    this.requestListeners.add(listener)
    return () => { this.requestListeners.delete(listener) }
  }

  /**
   * Calls each request listener.
   *
   * A listener that throws or rejects is logged as a warning. It never fails the request.
   *
   * @param event - The request's start or end.
   */
  private notify(event: DruxtRequestEvent): void {
    const failed = (error: unknown) => this.log.warn('A request listener failed:', error)
    for (const listener of [...this.requestListeners]) {
      try {
        // A listener may be async, so its rejection is caught too.
        const result: unknown = listener(event)
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          (result as Promise<unknown>).then(undefined, failed)
        }
      } catch (error) {
        failed(error)
      }
    }
  }

  /**
   * Sends one request, with no refresh and no retry.
   *
   * `request()` calls it. It builds the headers, sends a plain object or an array as JSON:API JSON, tells the request
   * listeners, and parses the response.
   *
   * @param url - A path or an absolute URL.
   * @param options - The request options.
   * @param token - An access token to send as a Bearer token.
   * @returns The response. Its `data` is the parsed JSON body, or the text when the body is not JSON.
   */
  async send<T>(url: string, options: DruxtRequestOptions, token?: string): Promise<DruxtResponse<T>> {
    const headers: Record<string, string> = { Accept: 'application/vnd.api+json, application/json;q=0.9, */*;q=0.8' }

    // The client's credential headers go only to Drupal's origin, as its token does. Fetch follows the same rule
    // when it drops an `Authorization` header on a redirect to another origin. Headers given for this one request
    // are sent as given.
    const own = sameOrigin(this.url(url), this.url('/'))
    for (const [name, value] of Object.entries(this.headers)) {
      if (own || !CREDENTIAL_HEADERS.has(name.toLowerCase())) setHeader(headers, name, value)
    }
    if (token) setHeader(headers, 'Authorization', `Bearer ${token}`)

    let body = options.body as BodyInit | undefined
    const proto: unknown = body !== null && typeof body === 'object' ? Object.getPrototypeOf(body) : undefined

    // Only a plain object or an array is a JSON:API document. A Blob, a buffer, FormData, URLSearchParams or a
    // stream goes to fetch as given. So does a plain object that is an async iterable.
    const stream = streamed(body)
    if (!stream && (Array.isArray(body) || proto === Object.prototype || proto === null)) {
      setHeader(headers, 'Content-Type', 'application/vnd.api+json')
      body = JSON.stringify(body)
    }
    for (const [name, value] of Object.entries(options.headers || {})) setHeader(headers, name, value)

    // Once a request carries credentials, the process cache is withheld from this client.
    if (headersHaveCredentials(headers, (this.options.cache || undefined)?.sessionCookie)) this.credentialed = true

    const href = this.url(url)
    if (this.options.debug) this.log.info(href)

    const method = options.method || 'GET'
    const event = { id: ++this.requestCount, method, url: listenerUrl(href) }
    const now = () => globalThis.performance?.now() ?? Date.now()
    const started = now()
    if (this.requestListeners.size) this.notify({ type: 'start', ...event })

    let res: Response
    try {
      const init: RequestInit & { duplex?: 'half' } = { method, headers, body }
      // Fetch refuses a stream body, or an async iterable one, without `duplex`.
      if (stream) init.duplex = 'half'
      res = await this.fetch(href, init)
    } catch (error) {
      if (this.requestListeners.size) this.notify({ type: 'end', ...event, duration: now() - started, failed: true })
      throw error
    }

    const duration = now() - started
    const data = parse(await res.text()) as T

    const omitted = omittedResources(data, this.options.endpoint)
    if (omitted && this.options.warnOmitted) this.warnOmitted(href, omitted)
    if (this.requestListeners.size) {
      this.notify({
        type: 'end',
        ...event,
        status: res.status,
        duration,
        ...(omitted ? { omitted: omitted.detail } : {}),
      })
    }

    return { data, status: res.status, statusText: res.statusText, headers: res.headers, url: href }
  }

  /**
   * Warns that Drupal omitted resources from a response.
   *
   * Each resource type is warned about once per site, until a client of that site runs `clearCache()`. The types come
   * from the links of the omitted items. When the links name no type, the type is the one the request read.
   *
   * @param href - The request's URL.
   * @param omitted - What Drupal omitted.
   */
  private warnOmitted(href: string, { detail, resources }: DruxtOmitted): void {
    const asked = resourceTypeOf(href, this.options.endpoint)
    const types = resources.length ? [...new Set(resources.map((resource) => resource.type))] : [asked]

    let warned = warnedOmitted.get(this.options.baseUrl)
    if (!warned) warnedOmitted.set(this.options.baseUrl, (warned = new Set()))

    for (const type of types) {
      if (warned.has(type)) continue
      warned.add(type)
      const from = type === asked ? '' : ` in a read of ${asked}`
      this.log.warn(`DRUXT_E01001: Drupal omitted ${type} resources from a response${from}: "${detail}". What renders from it is incomplete. Read it as a user who may see them, such as with the build credentials on the server.`)
    }
  }

  /**
   * Adds a query to a URL.
   *
   * @param url - The URL to add the query to.
   * @param query - A JSON:API query: a string, an object with `getQueryString()` such as drupal-jsonapi-params, or a
   * plain object.
   * @returns The URL with its query string, or the URL alone when there is no query.
   *
   * @example @lang js
   * const query = new DrupalJsonApiParams()
   * query.addFilter('status', '1')
   * const queryUrl = this.$druxt.buildQueryUrl(resourceUrl, query)
   */
  buildQueryUrl(url: string, query?: DruxtClientQuery): string {
    if (!query) {
      return url
    }

    if (typeof query === 'string') {
      return withQuery(url, query.replace(/^\?/, ''))
    }

    if (typeof query.getQueryString === 'function') {
      return withQuery(url, (query.getQueryString as () => string)())
    }

    // Drupal reads one `include` and one `sort`, each a comma-separated list, so a list is joined into one value.
    const params: Record<string, unknown> = { ...query }
    for (const name of ['include', 'sort']) {
      if (Array.isArray(params[name])) params[name] = (params[name] as unknown[]).join(',')
    }
    return withQuery(url, stringify(params))
  }

  /**
   * Throws when Drupal omitted resources for lack of permissions.
   *
   * The error lists each permission Drupal named. It links Drupal's help on omitted resources when the response has
   * the link. Nothing is thrown when no resource was omitted, or when Drupal named no permission.
   *
   * @param res - The response to check.
   * @throws A `DruxtPermissionsError`.
   */
  checkPermissions(res: { data: JsonApiDocument<unknown> }): void {
    const omitted = res.data.meta?.omitted
    if (!omitted) return

    const permissions = new Set<string>()
    for (const [key, link] of Object.entries(omitted.links || {}) as [string, { meta?: { detail?: string } }][]) {
      if (key === 'help') continue
      const match = link?.meta?.detail?.match(/'(.*?)'/)
      if (match?.[1]) permissions.add(match[1])
    }
    if (!permissions.size) return

    throw new DruxtPermissionsError(omitted.detail, [...permissions], omitted.links?.help?.href)
  }

  /**
   * Creates a JSON:API resource.
   *
   * A resource that has an `id` is updated instead, through `updateResource()`.
   *
   * @param resource - The JSON:API resource.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @returns The response.
   * @throws A `TypeError` when the resource has no type, and a formatted error when the request fails.
   *
   * @example @lang js
   * await this.$druxt.createResource(
   *   {
   *     type: 'node--page',
   *     attributes: {},
   *     relationships: {},
   *   },
   *   'en',
   * )
   */
  async createResource(
    resource: Partial<JsonApiResource> & { type: string },
    prefix = '',
  ): Promise<DruxtResponse<JsonApiDocument<JsonApiResource>>> {
    if (resource.id) {
      return this.updateResource(resource as JsonApiResource, prefix)
    }

    if (!resource.type) throw new TypeError('createResource() needs a type')

    const href = await this.resourceHref(resource.type, prefix)
    try {
      return await this.request<JsonApiDocument<JsonApiResource>>(href, { method: 'POST', body: { data: resource } })
    } catch (err) {
      this.error(err as ErrorLike, { url: href })
    }
  }

  /**
   * Throws a formatted error for a failed request.
   *
   * The message holds the status and its text, the URL, and the detail of Drupal's first JSON:API error when there
   * is one. The error carries the response as `response` and the context as `druxt`.
   *
   * @param err - The error.
   * @param context - The error context: the requested URL.
   * @throws The formatted error, always. A superseded error is thrown as it is.
   *
   * @example @lang js
   * try {
   *   await this.$druxt.request(url)
   * } catch (err) {
   *   this.$druxt.error(err, { url })
   * }
   */
  error(err: ErrorLike, context: { url?: string } = {}): never {
    // A request that a newer session replaced was never sent, so there is nothing to format. It is thrown unchanged,
    // so `isSuperseded()` still identifies it.
    if (isSuperseded(err)) throw err

    let { url } = context
    if (!url && err.response && 'url' in err.response && err.response.url) {
      url = err.response.url
    }

    const title = [
      err.response?.status,
      err.response?.statusText || err.message,
    ].filter((s) => s).join(': ')
    const meta = { url: url && this.url(url) }

    const message = [title]

    if (Object.values(meta).filter((o) => o).length) {
      message.push(
        Object.entries(meta).filter(([, v]) => v).map(([key, value]) => `${key.toUpperCase()}: ${value}`).join('\n'),
      )
    }

    const data = err.response?.data as { errors?: { detail?: string }[] } | undefined
    const detail = data?.errors?.[0]?.detail
    if (detail) {
      message.push(detail)
    }

    const error = new Error(message.join('\n\n')) as DruxtError
    error.response = err.response
    error.druxt = context
    throw error
  }

  /**
   * Sends a GET request and returns the HTTP response.
   *
   * The JSON:API document is the response's `data`. The resource methods, such as `getCollection()`, return the
   * document itself.
   *
   * It records the response's cache lifetime, which `cacheLifetime()` reads. With the `cache.content` option, it also
   * reads from the process cache and writes to it.
   *
   * @param url - The URL to GET.
   * @param options - The request options.
   * @returns The response, whose `data` is the JSON:API document.
   * @throws A formatted error, from `error()`, when the request fails.
   *
   * @example @lang js
   * // get() is the raw request: it returns the HTTP response.
   * const res = await druxt.get('/jsonapi/node/article')
   * res.data        // the JSON:API document
   * res.data.data   // the resources
   *
   * // The resource methods return the parsed document.
   * const col = await druxt.getCollection('node--article')
   * col.data        // the resources
   */
  async get<T = JsonApiDocument>(url: string, options?: DruxtRequestOptions): Promise<DruxtResponse<T>> {
    const { bypassCache, ...request } = options || {}

    // The content cache, on with `cache.content`. It keeps a response to a request without credentials for as long
    // as its `Cache-Control` allows. The next server request for the same URL is answered from it.
    //
    // - The key is the backend and the URL alone. So a request whose own options could change the response, such as
    //   headers or a body, is never read from the cache and never stored.
    // - Only a 200 whose body is a JSON object or array is stored. So a caller whose `validateStatus` refuses a 200
    //   always goes to Drupal.
    // - Any other answer from Drupal removes what an earlier answer stored. The cache follows Drupal's latest answer.
    const cacheable = !!(this.options.cache || undefined)?.content
      && Object.keys(options || {}).every((option) => CACHE_SAFE_OPTIONS.has(option))
      && (typeof request.validateStatus !== 'function' || request.validateStatus(200))
    const before = cacheable ? this.processCache('content') : undefined
    const key = JSON.stringify([this.indexKey, url])

    if (before && !bypassCache) {
      const stored = before.get<StoredResponse>(key)
      if (stored) return this.storedResponse<T>(stored, url)
    }

    // The request's place in the order requests started in. A timestamp cannot order two requests that start in the
    // same millisecond.
    const started = nextRequest()

    // Records Drupal's answer. An answer that may be kept is stored. Any other removes what an earlier answer stored
    // under the key.
    const settle = (res: DruxtResponse<T>) => {
      // The cache is asked for again now the request has resolved, as it may have shown that the client sends
      // credentials. The client's headers may also have changed while the request was in flight. The answer could
      // then be either set's variant, so it is stored under neither, and removes nothing.
      const after = before && this.processCache('content')
      if (!after || after.consumer !== before!.consumer) return

      // The handle refuses the write when a request that started later, such as a bypass, has already stored or
      // removed the entry.
      if (res.status === 200 && res.data && typeof res.data === 'object') {
        const seconds = parseCacheLifetime(res.headers)
        const value: StoredResponse = {
          body: JSON.stringify(res.data),
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          seconds,
          at: Date.now(),
        }
        after.set(key, value, seconds, before!.generation, started)
      } else after.set(key, undefined, 0, before!.generation, started)
    }

    try {
      let res: DruxtResponse<T>
      try {
        res = await this.request<T>(url, options && Object.keys(request).length ? request : undefined)
      } catch (error) {
        // A response the caller refused is still Drupal's latest answer, so it is recorded. A request that never
        // reached Drupal has no answer to record.
        const answered = (error as RequestError).response
        if (answered) settle(answered as DruxtResponse<T>)
        throw error
      }
      rememberLifetime(res?.data, res?.headers)
      settle(res)
      return res
    } catch (err) {
      this.error(err as ErrorLike, { url })
    }
  }

  /**
   * Builds a response from a content cache entry.
   *
   * The document is a fresh copy of the stored one, so a caller cannot change what the next caller reads. Its cache
   * lifetime is what is left of the entry's.
   *
   * @param stored - The entry.
   * @param url - The URL it was stored for.
   * @returns The response.
   */
  private storedResponse<T>(stored: StoredResponse, url: string): DruxtResponse<T> {
    const data = JSON.parse(stored.body) as T
    rememberLifetimeFrom(data, stored.seconds, stored.at)
    return {
      data,
      status: stored.status,
      statusText: stored.statusText,
      headers: new Headers(stored.headers),
      url: this.url(url),
    }
  }

  /**
   * Gets a collection of resources.
   *
   * A type the index does not list is read from its conventional URL, such as `/jsonapi/node/recipe`.
   *
   * @param type - The JSON:API resource type.
   * @param query - A JSON:API query string or object.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @param options - How the read goes to Drupal, such as `bypassCache`.
   * @returns The collection document.
   * @throws A `TypeError` when `type` is empty, and a formatted error when the request fails.
   *
   * @example @lang js
   * const collection = await this.$druxt.getCollection(
   *   'node--recipe',
   *   undefined,
   *   'en',
   * )
   */
  async getCollection(
    type: string,
    query?: DruxtClientQuery,
    prefix = '',
    options?: DruxtReadOptions,
  ): Promise<JsonApiCollection> {
    if (!type) throw new TypeError('getCollection() needs a type')

    const href = await this.resourceHref(type, prefix)
    const { data } = await this.get<JsonApiCollection>(this.buildQueryUrl(href, query), readOptions(options))
    return data
  }

  /**
   * Gets every page of a collection.
   *
   * It follows each page's `next` link until there is none.
   *
   * @param type - The JSON:API resource type.
   * @param query - A JSON:API query string or object.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @param options - How the read goes to Drupal, such as `bypassCache`.
   * @returns One collection document per page, in order.
   * @throws A `TypeError` when `type` is empty, and a formatted error when a request fails.
   *
   * @example @lang js
   * const collections = await this.$druxt.getCollectionAll(
   *   'node--recipe',
   *   'fields[node--recipe]=title',
   *   'en',
   * )
   */
  async getCollectionAll(
    type: string,
    query?: DruxtClientQuery,
    prefix = '',
    options?: DruxtReadOptions,
  ): Promise<JsonApiCollection[]> {
    if (!type) throw new TypeError('getCollectionAll() needs a type')

    let res = await this.getCollection(type, query, prefix, options)
    const collections = [res]

    let next = res.links?.next?.href
    while (next) {
      res = await this.getCollection(type, next.split('?')[1], prefix, options)
      collections.push(res)
      next = res.links?.next?.href
    }

    return collections
  }

  /**
   * Gets the index of available resources, or one resource type's entry.
   *
   * Without a resource type, it returns the whole index for the prefix. With one, it returns that type's entry, or
   * undefined when the index has none.
   *
   * The index is fetched once for each prefix, and concurrent callers share the fetch.
   *
   * @param resource - A resource type, or nothing for the whole index.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @returns The index, or the entry.
   *
   * @example @lang js
   * const entry = await this.$druxt.getIndex('node--article', 'en')
   * const href = entry ? entry.href : undefined
   *
   * @example @lang js
   * const index = await this.$druxt.getIndex(null, 'en')
   */
  async getIndex(resource?: null, prefix?: string): Promise<JsonApiIndex>
  async getIndex(resource: string, prefix?: string): Promise<JsonApiIndexEntry | undefined>
  async getIndex(resource?: string | null, prefix = ''): Promise<JsonApiIndex | JsonApiIndexEntry | undefined> {
    const index = await this.indexCache.get(this.urlPrefix(prefix))
    return resource ? index[resource] : index
  }

  /**
   * Gets the URL prefix that a `prefix` argument stands for.
   *
   * A langcode in the `prefixes` option gives its configured prefix, such as `spanish` for `es`. Any other value is
   * returned as it is: a prefix given as such, or a langcode the option lacks.
   *
   * @param prefix - A langcode or a URL prefix, empty for none.
   * @returns The URL prefix, with no slash.
   *
   * @example @lang js
   * // With prefixes { en: '', es: 'spanish' }:
   * druxt.urlPrefix('es') // 'spanish'
   * druxt.urlPrefix('en') // ''
   * druxt.urlPrefix('fr') // 'fr'
   */
  urlPrefix(prefix = ''): string {
    const prefixes = this.options.prefixes
    return prefixes && Object.prototype.hasOwnProperty.call(prefixes, prefix) ? prefixes[prefix]! : prefix
  }

  /**
   * Fetches the JSON:API index for a prefix from Drupal.
   *
   * `getIndex()` calls it and holds the result. Each link in the index becomes a path under the base URL. When JSON:API
   * Extras' resource config can be read, each entry also gets its resource type, entity type, bundle and fields.
   *
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @returns The index, and the seconds it may be cached, from the `Cache-Control` of its responses.
   * @throws A formatted error when the endpoint does not answer with a JSON:API index.
   */
  async fetchIndex(prefix = ''): Promise<FetchedIndex> {
    const url = [prefix, this.options.endpoint].join('')
    const { data } = await this.get<{ links?: JsonApiIndex }>(url)

    if (typeof data.links !== 'object') {
      this.error({ response: { statusText: 'Invalid JSON:API endpoint' } }, { url })
    }

    const baseUrl = this.options.baseUrl || ''
    const index: JsonApiIndex = Object.fromEntries(Object.entries(data.links).map(([key, value]) => {
      value.href = indexPath(value.href, baseUrl)
      return [key, value]
    }))

    // Every response the index is built from. The merged index may be cached no longer than the shortest-lived one.
    const documents: object[] = [data]

    const resourceConfig = index[this.options.jsonapiResourceConfig]
    if (resourceConfig) {
      let resources: JsonApiResource[] = []

      // Reading the resource config needs a permission. Without it the index is used as it is, and the failure is
      // logged as a warning.
      try {
        const config = (await this.get<JsonApiCollection>(resourceConfig.href)).data
        resources = config.data
        documents.push(config)
      } catch (err) {
        this.log.warn((err as Error).message)
      }

      for (const resource of resources) {
        const internal = String(resource.attributes?.drupal_internal__id).split('--')
        const item = {
          resourceType: resource.attributes?.resourceType,
          entityType: internal[0],
          bundle: internal[1],
          resourceFields: resource.attributes?.resourceFields,
        }

        const id = [item.entityType, item.bundle].join('--')
        index[id] = { ...item, ...index[id] } as JsonApiIndexEntry
      }
    }

    return { index, lifetime: Math.min(...documents.map((document) => this.cacheLifetime(document))) }
  }

  /**
   * Gets the related resources of a resource.
   *
   * @param type - The JSON:API resource type.
   * @param id - The resource UUID.
   * @param related - The relationship name.
   * @param query - A JSON:API query string or object.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @param options - How the read goes to Drupal, such as `bypassCache`.
   * @returns The document of related resources.
   * @throws A `TypeError` when `type`, `id` or `related` is empty, and a formatted error when the request fails.
   *
   * @example @lang js
   * const related = await this.$druxt.getRelated(
   *   'node--page',
   *   id,
   *   'uid',
   *   undefined,
   *   'en',
   * )
   */
  async getRelated(
    type: string,
    id: string,
    related: string,
    query?: DruxtClientQuery,
    prefix = '',
    options?: DruxtReadOptions,
  ): Promise<JsonApiDocument> {
    if (!type) throw new TypeError('getRelated() needs a type')
    if (!id) throw new TypeError('getRelated() needs an id')
    if (!related) throw new TypeError('getRelated() needs a related field name')

    const href = await this.resourceHref(type, prefix)

    const { data } = await this.get(this.buildQueryUrl(`${href}/${id}/${related}`, query), readOptions(options))
    return data
  }

  /**
   * Gets a resource by type and ID.
   *
   * @param type - The JSON:API resource type.
   * @param id - The resource UUID.
   * @param query - A JSON:API query string or object.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @param options - How the read goes to Drupal, such as `bypassCache`.
   * @returns The document.
   * @throws A `TypeError` when `type` or `id` is empty, and a formatted error when the request fails.
   *
   * @example @lang js
   * const document = await this.$druxt.getResource(
   *   'node--article',
   *   id,
   *   undefined,
   *   'en',
   * )
   */
  async getResource(
    type: string,
    id: string,
    query?: DruxtClientQuery,
    prefix = '',
    options?: DruxtReadOptions,
  ): Promise<JsonApiDocument<JsonApiResource>> {
    if (!type) throw new TypeError('getResource() needs a type')
    if (!id) throw new TypeError('getResource() needs an id')

    const href = await this.resourceHref(type, prefix)

    const { data } = await this.get<JsonApiDocument<JsonApiResource>>(
      this.buildQueryUrl([href, id].join('/'), query),
      readOptions(options),
    )
    return data
  }

  /**
   * Updates a resource.
   *
   * @param resource - The JSON:API resource, with its `type` and `id`.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @returns The response.
   * @throws A `TypeError` when the resource has no type or no id, and a formatted error when the request fails.
   *
   * @example @lang js
   * await this.$druxt.updateResource(
   *   {
   *     type: 'node--page',
   *     id,
   *     attributes: {},
   *     relationships: {},
   *   },
   *   'en',
   * )
   */
  async updateResource(
    resource: JsonApiResource,
    prefix = '',
  ): Promise<DruxtResponse<JsonApiDocument<JsonApiResource>>> {
    if (!resource.type) throw new TypeError('updateResource() needs a type')
    if (!resource.id) throw new TypeError('updateResource() needs an id')

    const url = [await this.resourceHref(resource.type, prefix), resource.id].join('/')
    try {
      return await this.request<JsonApiDocument<JsonApiResource>>(url, { method: 'PATCH', body: { data: resource } })
    } catch (err) {
      this.error(err as ErrorLike, { url })
    }
  }

  /**
   * Gets a resource type's URL.
   *
   * The index's link is used. A type the index does not list gets the conventional URL: the prefix, the endpoint,
   * then the entity type and bundle, such as `/jsonapi/node/recipe`.
   *
   * @param type - The JSON:API resource type.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @returns The URL, as a path.
   */
  private async resourceHref(type: string, prefix: string): Promise<string> {
    const entry = await this.getIndex(type, prefix)
    return (entry && entry.href) || `${this.urlPrefix(prefix)}${this.options.endpoint}/${type.replace('--', '/')}`
  }
}
