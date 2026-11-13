import { DruxtAuth, refreshRefused } from './auth'
import { JsonApiIndexCache } from './jsonApiIndex'
import type { FetchedIndex } from './jsonApiIndex'
import { byteSize, headersHaveCredentials, lifetimeLeft, nextRequest, parseCacheLifetime, processCache, rememberLifetime, rememberLifetimeFrom, resetProcessCache } from './processCache'
import type { ProcessCacheHandle } from './processCache'
import { DruxtPermissionsError, isSuperseded } from './errors'
import type { ErrorLike, RequestError } from './errors'
import { indexPath, resourceTypeOf, setHeader, trimEnd, trimStart } from './utils/href'
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

/** The methods safe to repeat as the anonymous visitor once the session has ended: reads. */
const READS = new Set(['GET', 'HEAD'])

/** Whether two URLs share an origin, a relative URL resolving against the same one. */
const sameOrigin = (a: string, b: string): boolean => {
  try {
    return new URL(a, 'http://localhost').origin === new URL(b, 'http://localhost').origin
  } catch {
    return false
  }
}

/** The client headers that carry credentials, sent only to the origin the client sends Drupal's requests to. */
const CREDENTIAL_HEADERS = new Set(['authorization', 'proxy-authorization', 'cookie'])

/**
 * Whether a body is sent as it streams: a `ReadableStream`, told by its shape so one from another realm counts, or an
 * async iterable, a plain object among them. Its shape is methods, which no JSON document has. Fetch sends it with
 * `duplex`, and it is consumed as it is sent, so it cannot be sent again, and it is never sent as JSON.
 */
const streamed = (body: unknown): boolean => !!body && typeof body === 'object' && (
  (typeof (body as ReadableStream).getReader === 'function' && typeof (body as ReadableStream).locked === 'boolean')
  || typeof (body as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function')

/**
 * The Druxt JSON:API client.
 *
 * Communicates with the Drupal JSON:API to fetch, create and update resources.
 *
 * @see {@link https://druxtjs.org/modules/druxt|Druxt module guide}
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
  /** The fetch requests are sent with. */
  fetch: DruxtFetch
  /** Headers sent with every request, its credential headers only to Drupal's origin. */
  headers: Record<string, string>
  /** The request listeners, from the `onRequest` option and `onRequest()`. */
  private requestListeners: Set<DruxtRequestListener>
  /** The last request's id. */
  private requestCount: number
  /** Set once a request has gone out with credentials, so the process cache is withheld. */
  credentialed: boolean
  options: DruxtClientOptions & { baseUrl: string, endpoint: string, jsonapiResourceConfig: string }
  /** OAuth against Drupal's Simple OAuth, when the `auth` option has a clientId. */
  auth: DruxtAuth | undefined
  /** What this site's index is keyed by in the process cache. */
  indexKey: string
  /** The JSON:API index per prefix, fetched once and shared between callers. */
  indexCache: JsonApiIndexCache
  /** Moves on each time `clearCache()` runs, so caches keyed by this client know to empty. */
  cacheGeneration: number
  /**
   * Creates a client for one Drupal site's JSON:API.
   *
   * Requires the base URL, sets up the options, and turns on auth when the
   * `auth` option has a clientId.
   *
   * @param baseUrl - The Drupal base URL.
   * @param options - The DruxtClient options.
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

    // Bound, as a browser's fetch throws when called on another object.
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
      // As in 1.x, a baseUrl in the options wins over the argument. Without a trailing slash, so it strips cleanly
      // from the index's links.
      baseUrl: trimEnd(options.baseUrl || baseUrl),
    }
    // A leading slash and no trailing one, so a prefix joins the endpoint as `/es/api` however it was given.
    this.options.endpoint = `/${trimEnd(trimStart(String(this.options.endpoint)))}`

    // Keyed on a clientId: 1.x code passes other `auth` shapes, such as the schema generator's `{ type: false }`.
    const auth = this.options.auth as Partial<DruxtAuthOptions> | undefined
    this.auth = auth && auth.clientId ? new DruxtAuth(this, auth as DruxtAuthOptions) : undefined

    // The process cache keys the index by base URL, endpoint and resource config.
    this.indexKey = JSON.stringify([this.options.baseUrl, this.options.endpoint, this.options.jsonapiResourceConfig])
    this.indexCache = new JsonApiIndexCache({
      key: this.indexKey,
      fetchIndex: (prefix) => this.fetchIndex(prefix),
      // Asked for afresh each time: a request may have shown the client to be credentialed since.
      shared: () => this.processCache('index'),
    })

    this.cacheGeneration = 0
  }

  /** JSON:API index per prefix, as fetched so far. */
  get index(): Record<string, JsonApiIndex> {
    return this.indexCache.indexes
  }

  /** Index fetches in flight, shared between concurrent callers. */
  get indexRequests(): Record<string, Promise<FetchedIndex> | undefined> {
    return this.indexCache.requests
  }

  /**
   * Clear the caches this client holds, and the server's process cache.
   *
   * Empties the JSON:API index and the process cache, moves `cacheGeneration`
   * on so results cached per client, such as menus, are fetched again, and lets
   * `warnOmitted` warn again about each resource type on this client's site.
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
   * Get the process cache for a scope.
   *
   * The cache holds server-side responses between requests, each for as long
   * as its Cache-Control header allows. It is off unless the `cache` option is
   * set, and it is skipped for any request that sends an Authorization header,
   * basic auth, a session cookie or an Origin, and for a session-mode client
   * while it is signed in. Clients whose headers differ keep their entries
   * apart. A handle is for one request: ask for a new one after
   * `clearCache()` or `resetProcessCache()`, as one kept across a clear still
   * reads what it held, and its writes are dropped.
   *
   * @param scope - The cache scope, e.g. 'index' or 'menu'.
   * @returns The cache, or undefined when it must not be used.
   */
  processCache(scope: string): ProcessCacheHandle | undefined {
    if (!this.options.cache) return undefined
    const { ttl, sessionCookie, maxSize = DEFAULT_MAX_SIZE } = this.options.cache as ProcessCacheOptions
    // A signed-in session-mode client holds no token, but its requests carry the session the site's proxy adds,
    // wherever it runs.
    const session = !!this.auth?.session && this.auth.loggedIn
    const credentialed = this.credentialed || session || !!this.auth?.accessToken || headersHaveCredentials(this.headers, sessionCookie)
    // Each set of client headers keeps its own entries, X-Consumer-ID among them: a header may pick a variant Drupal
    // names in no Vary, such as an Accept-Language. Names are compared in any case.
    const headers = Object.entries(this.headers).map(([name, value]): [string, string] => [name.toLowerCase(), value]).sort(([a], [b]) => (a < b ? -1 : 1))
    const consumer = headers.length ? JSON.stringify(headers) : ''
    // A stored response counts as the bytes of its body.
    const sizeOf = scope === 'content' ? (value: unknown) => byteSize((value as StoredResponse).body) : undefined
    return processCache(scope, { credentialed, consumer, ttl, maxSize, sizeOf })
  }

  /**
   * How long a document this client fetched may be cached.
   *
   * @param document - A JSON:API document returned by this client.
   * @returns Seconds, from the response's Cache-Control. 0 when it may not be cached or is unknown.
   */
  cacheLifetime(document: unknown): number {
    return lifetimeLeft(document)
  }

  /**
   * Add headers to every request. `Authorization`, `Proxy-Authorization` and
   * `Cookie` go only to the origin the client sends Drupal's requests to, as
   * the access token does; a request to another host is sent without them.
   *
   * @param headers - HTTP headers.
   *
   * @example @lang js
   * this.$druxt.addHeaders({ Authorization: `Basic ${token}` })
   */
  addHeaders(headers?: Record<string, string>): void {
    if (typeof headers === 'undefined') return
    for (const [name, value] of Object.entries(headers)) setHeader(this.headers, name, value)
  }

  /**
   * The absolute URL for a path: against Drupal, or this origin when the API is proxied.
   *
   * @param url - A path, with or without its leading slash, or an absolute URL.
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
   * Send a request, as the signed-in user when there is one.
   *
   * An expired token is refreshed first. A 401 is refreshed and retried once,
   * for a token Drupal revoked that still looks unexpired here. When Drupal
   * refuses the refresh token, the session ends and a read is repeated as the
   * anonymous visitor it now is; a write is not, as it was meant to be made as
   * the user. Refused before a write is sent, the write is not sent at all,
   * and rejects with the refusal: the token request's error, its status a 400
   * or a 401. A refresh that fails otherwise, such as a timeout, keeps the
   * session: the request is sent as it, and a 401 stands. A read Drupal
   * refuses for a token with no refresh token to try ends the session the
   * same way, and is repeated as the anonymous visitor; a write's 401 stands,
   * and the session is kept. A stream body is sent once: a 401 to it still
   * refreshes, and stands. The token goes only to Drupal's origin, or this
   * one when the API is proxied: a request to another host is sent without
   * it, and its 401 is returned as it is.
   *
   * A request is sent, refreshed and retried only as the session it was made
   * for. One still waiting on a refresh when another session signs in rejects
   * with an error `isSuperseded()` tells, and is not sent; one whose session a
   * sign-out ended, or a sign-in that has not stored its tokens yet, is sent
   * without a token, as a signed-out client's are. A 401 answered after
   * another session signed in is returned as it is, whether the request was
   * sent as the session before or while the sign-in ran.
   *
   * @param url - A path or an absolute URL.
   * @param options - The request options.
   * @returns The response, its body parsed.
   *
   * @example @lang js
   * const { data, status } = await this.$druxt.request('/jsonapi/node/page', {
   *   method: 'POST',
   *   body: { data: { type: 'node--page', attributes: { title: 'About' } } },
   * })
   */
  async request<T = unknown>(url: string, options: DruxtRequestOptions = {}): Promise<DruxtResponse<T>> {
    const auth = options.auth === false ? undefined : this.auth
    // The site's proxy adds the session's credentials unless asked not to, as a request without auth must be anonymous.
    const anonymous = (given: DruxtRequestOptions): DruxtRequestOptions => (this.auth?.session ? { ...given, headers: { ...given.headers, 'X-Druxt-Auth': 'none' } } : given)
    if (options.auth === false) options = anonymous(options)
    // The token goes only to the origin the client sends Drupal's requests to, as druxt-auth's `targetsBackend` keeps
    // it. Another host gets no token, and its 401 says nothing about Drupal's: no refresh, retry or anonymous repeat.
    const own = sameOrigin(this.url(url), this.url('/'))
    const token = () => (own ? auth?.accessToken : undefined)
    // The session the request is made for: a sign-in or a sign-out moves it on, a refresh does not.
    const epoch = auth?.epoch
    // A refusal ends the session; any other failure keeps it, and the request is sent as it, for its 401 to decide.
    let refused: unknown
    if (own && auth?.expired && auth.canRefresh) await auth.refresh().catch((error: unknown) => { if (refreshRefused(error)) refused = error })
    // Another session signed in while the request waited: it is not sent as that one. A session that only ended, by a
    // sign-out, a refused refresh or a sign-in still running, leaves a signed-out client, whose requests go without a
    // token.
    if (auth && auth.epoch !== epoch && auth.loggedIn) throw supersededError()

    const read = READS.has((options.method || 'GET').toUpperCase())
    // As on a 401: a read goes on as the anonymous visitor, and a write, meant for the user, is not sent.
    if (refused) {
      if (!read) throw refused
      return this.checked(await this.send<T>(url, anonymous(options)), options)
    }
    // The session the request is sent for, and whether it carries one: a token, or with `session` on, the proxy's.
    const sent = auth?.held()
    const carried = own && !!auth && (auth.session ? auth.loggedIn : !!auth.accessToken)
    // A stream the first send consumed cannot be sent again: its 401 stands, for the caller to retry with a new one.
    const once = streamed(options.body)
    let response = await this.send<T>(url, options, token())
    if (response.status === 401 && own && auth?.canRefresh) {
      // Unless another session signed in after it was sent: its 401 then stands, with no refresh or retry as that one.
      if (auth.epoch === epoch) {
        try {
          // Refreshed even for a stream, so the caller's retry goes as the refreshed session.
          await auth.refresh()
          if (!once) response = await this.send<T>(url, options, token())
        } catch (error) {
          if (refreshRefused(error) && read && !once) response = await this.send<T>(url, anonymous(options))
        }
      }
    } else if (response.status === 401 && auth && carried && sent !== undefined && read) {
      // Nothing to refresh with, or another read's refused refresh ended the session first: what the read was sent
      // with decides. Only a client signed out by then repeats it anonymously: another session's 401 stands.
      auth.drop(sent)
      if (!auth.loggedIn && !once) response = await this.send<T>(url, anonymous(options))
    }
    return this.checked(response, options)
  }

  /**
   * The response, or the error for a status the request's `validateStatus` refuses: any but a 2xx by default.
   *
   * @param response - The response.
   * @param options - The request options.
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
   * Listens to the requests this client sends: each one's method and URL as it starts, then its status and timing as it
   * ends. No headers, body or credentials are passed. Useful for logging and metrics.
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

  /** Tells the request listeners, and keeps a listener's failure from failing the request. */
  private notify(event: DruxtRequestEvent): void {
    const failed = (error: unknown) => this.log.warn('A request listener failed:', error)
    for (const listener of [...this.requestListeners]) {
      try {
        // A listener may be async: its rejection is caught too.
        const result: unknown = listener(event)
        if (result && typeof (result as Promise<unknown>).then === 'function') (result as Promise<unknown>).then(undefined, failed)
      } catch (error) {
        failed(error)
      }
    }
  }

  /**
   * Send one request.
   *
   * @param url - A path or an absolute URL.
   * @param options - The request options.
   * @param token - An access token to send.
   */
  async send<T>(url: string, options: DruxtRequestOptions, token?: string): Promise<DruxtResponse<T>> {
    const headers: Record<string, string> = { Accept: 'application/vnd.api+json, application/json;q=0.9, */*;q=0.8' }
    // The client's credentials go only to Drupal's origin, as its token does, and as fetch drops an Authorization on a
    // redirect to another one. A request's own headers are sent as given.
    const own = sameOrigin(this.url(url), this.url('/'))
    for (const [name, value] of Object.entries(this.headers)) {
      if (own || !CREDENTIAL_HEADERS.has(name.toLowerCase())) setHeader(headers, name, value)
    }
    if (token) setHeader(headers, 'Authorization', `Bearer ${token}`)
    let body = options.body as BodyInit | undefined
    const proto: unknown = body !== null && typeof body === 'object' ? Object.getPrototypeOf(body) : undefined
    // Only a plain object or an array is a JSON:API document. A Blob, a buffer, FormData, URLSearchParams or a
    // stream goes to fetch as given, as does a plain object that is an async iterable.
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
      // Fetch refuses a stream body, or an async iterable one, without it.
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
    if (this.requestListeners.size) this.notify({ type: 'end', ...event, status: res.status, duration, ...(omitted ? { omitted: omitted.detail } : {}) })
    return { data, status: res.status, statusText: res.statusText, headers: res.headers, url: href }
  }

  /**
   * Warns, once per omitted resource type for the site until a client of it runs `clearCache()`, that Drupal omitted
   * resources from a response: each type its omitted items' links name, else the type the request read.
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
   * Build a query URL.
   *
   * @param url - The base query URL.
   * @param query - A JSON:API query string or object.
   * @returns The URL with its query string.
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

    // An object with `getQueryString`, such as drupal-jsonapi-params.
    if (typeof query.getQueryString === 'function') {
      return withQuery(url, (query.getQueryString as () => string)())
    }

    return withQuery(url, stringify(query as Record<string, unknown>))
  }

  /**
   * Throws when Drupal omitted resources for lack of permissions.
   *
   * The error names each permission Drupal reported, and links Drupal's help
   * on omitted resources when the response carries it.
   *
   * @param res - The response to check.
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
   * Create a JSON:API resource, or update it when it has an id.
   *
   * @param resource - The JSON:API resource.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @returns The response.
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
  async createResource(resource: Partial<JsonApiResource> & { type: string }, prefix = ''): Promise<DruxtResponse<JsonApiDocument<JsonApiResource>>> {
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
   * Throw a formatted error.
   *
   * @param err - The error.
   * @param context - The error context; the requested URL.
   *
   * @example @lang js
   * try {
   *   await this.$druxt.request(url)
   * } catch (err) {
   *   this.$druxt.error(err, { url })
   * }
   */
  error(err: ErrorLike, context: { url?: string } = {}): never {
    // A request a newer session replaced was never sent: there is nothing to format, and `isSuperseded()` must tell it.
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
      message.push(Object.entries(meta).filter(([, v]) => v).map(([key, value]) => `${key.toUpperCase()}: ${value}`).join('\n'))
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
   * A GET request, recording the response's cache lifetime, with error handling.
   *
   * It returns the HTTP response, not the document: the JSON:API document is
   * its `data`. The resource methods, such as `getCollection()`, return the
   * document itself.
   *
   * @param url - The URL to GET.
   * @param options - Request options.
   * @returns The response, whose `data` is the JSON:API document.
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
    // With `cache.content`, a response to a request without credentials is kept in the process cache for as long as
    // its Cache-Control allows, and the next server request for the same URL is answered from it. The key is the
    // backend and the URL alone, so a request whose own options could change the response, such as headers or a
    // body, is never read from or stored. Only a 200 whose body is a JSON object or array is stored, so a caller
    // whose validateStatus refuses one goes to Drupal. Any other answer from Drupal removes what an earlier one stored,
    // so the cache follows its latest answer.
    const cacheable = !!(this.options.cache || undefined)?.content
      && Object.keys(options || {}).every((option) => CACHE_SAFE_OPTIONS.has(option))
      && (typeof request.validateStatus !== 'function' || request.validateStatus(200))
    const before = cacheable ? this.processCache('content') : undefined
    const key = JSON.stringify([this.indexKey, url])
    if (before && !bypassCache) {
      const stored = before.get<StoredResponse>(key)
      if (stored) return this.storedResponse<T>(stored, url)
    }
    // Its place in the order requests started in, which a timestamp cannot give two requests in one millisecond.
    const started = nextRequest()
    // Drupal's answer: kept when it may be, and otherwise removing what an earlier answer stored under the key.
    const settle = (res: DruxtResponse<T>) => {
      // Asked again once resolved, as the request may have shown the client to be credentialed. Headers changed while
      // it was in flight may pick another variant, and it may have been sent with either set: it is stored under
      // neither, and removes nothing.
      const after = before && this.processCache('content')
      if (!after || after.consumer !== before!.consumer) return
      // The handle refuses it when a request that started later, such as a bypass, has stored or removed the entry.
      if (res.status === 200 && res.data && typeof res.data === 'object') {
        const seconds = parseCacheLifetime(res.headers)
        const value: StoredResponse = { body: JSON.stringify(res.data), status: res.status, statusText: res.statusText, headers: Object.fromEntries(res.headers.entries()), seconds, at: Date.now() }
        after.set(key, value, seconds, before!.generation, started)
      } else after.set(key, undefined, 0, before!.generation, started)
    }
    try {
      let res: DruxtResponse<T>
      try {
        res = await this.request<T>(url, options && Object.keys(request).length ? request : undefined)
      } catch (error) {
        // An answer the caller refused is still Drupal's latest. A request that never reached Drupal has none.
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
   * A response from a content cache entry: a fresh copy of the stored document, with what is left of its lifetime.
   *
   * @param stored - The entry.
   * @param url - The URL it was stored for.
   */
  private storedResponse<T>(stored: StoredResponse, url: string): DruxtResponse<T> {
    const data = JSON.parse(stored.body) as T
    rememberLifetimeFrom(data, stored.seconds, stored.at)
    return { data, status: stored.status, statusText: stored.statusText, headers: new Headers(stored.headers), url: this.url(url) }
  }

  /**
   * Get a collection of resources.
   *
   * @param type - The JSON:API resource type.
   * @param query - A JSON:API query string or object.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @param options - How the read goes to Drupal, such as `bypassCache`.
   * @returns The collection, from the conventional URL for a type the index does not list.
   *
   * @example @lang js
   * const collection = await this.$druxt.getCollection(
   *   'node--recipe',
   *   undefined,
   *   'en',
   * )
   */
  async getCollection(type: string, query?: DruxtClientQuery, prefix = '', options?: DruxtReadOptions): Promise<JsonApiCollection> {
    if (!type) throw new TypeError('getCollection() needs a type')

    const href = await this.resourceHref(type, prefix)
    const { data } = await this.get<JsonApiCollection>(this.buildQueryUrl(href, query), readOptions(options))
    return data
  }

  /**
   * Get every page of a collection.
   *
   * @param type - The JSON:API resource type.
   * @param query - A JSON:API query string or object.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @param options - How the read goes to Drupal, such as `bypassCache`.
   *
   * @example @lang js
   * const collections = await this.$druxt.getCollectionAll(
   *   'node--recipe',
   *   'fields[node--recipe]=title',
   *   'en',
   * )
   */
  async getCollectionAll(type: string, query?: DruxtClientQuery, prefix = '', options?: DruxtReadOptions): Promise<JsonApiCollection[]> {
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
   * Get the index of available resources, or one resource's entry.
   *
   * Without a resource type, the whole index for the prefix; with one, that
   * type's entry, or undefined when the index has none. Two signatures, so each
   * call is typed by what it asks for.
   *
   * @param resource - A resource type, or nothing for the whole index.
   * @param prefix - The JSON:API endpoint prefix or langcode.
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
   * The URL prefix a `prefix` argument stands for: a langcode's configured prefix from `prefixes`, such as `spanish`
   * for `es`, else the argument itself, a prefix given as such or a langcode the map lacks.
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
   * Fetches the JSON:API index for a prefix.
   *
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @returns The index, and the seconds it may be cached from its Cache-Control.
   */
  async fetchIndex(prefix = ''): Promise<FetchedIndex> {
    const url = [prefix, this.options.endpoint].join('')
    const { data } = await this.get<{ links?: JsonApiIndex }>(url)

    // Throw error if index is invalid.
    if (typeof data.links !== 'object') {
      this.error({ response: { statusText: 'Invalid JSON:API endpoint' } }, { url })
    }

    const baseUrl = this.options.baseUrl || ''
    const index: JsonApiIndex = Object.fromEntries(Object.entries(data.links).map(([key, value]) => {
      value.href = indexPath(value.href, baseUrl)
      return [key, value]
    }))

    // Use JSON:API resource config to decorate the index.
    // The merged index lives no longer than any response it was built from.
    const documents: object[] = [data]
    const resourceConfig = index[this.options.jsonapiResourceConfig]
    if (resourceConfig) {
      let resources: JsonApiResource[] = []

      // Get JSON:API resource config if permissions are set up correctly.
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
   * Get the related resources of a resource.
   *
   * @param type - The JSON:API resource type.
   * @param id - The resource UUID.
   * @param related - The relationship name.
   * @param query - A JSON:API query string or object.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @param options - How the read goes to Drupal, such as `bypassCache`.
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
  async getRelated(type: string, id: string, related: string, query?: DruxtClientQuery, prefix = '', options?: DruxtReadOptions): Promise<JsonApiDocument> {
    if (!type) throw new TypeError('getRelated() needs a type')
    if (!id) throw new TypeError('getRelated() needs an id')
    if (!related) throw new TypeError('getRelated() needs a related field name')

    const href = await this.resourceHref(type, prefix)

    const { data } = await this.get(this.buildQueryUrl(`${href}/${id}/${related}`, query), readOptions(options))
    return data
  }

  /**
   * Get a resource by type and ID.
   *
   * @param type - The JSON:API resource type.
   * @param id - The resource UUID.
   * @param query - A JSON:API query string or object.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @param options - How the read goes to Drupal, such as `bypassCache`.
   * @returns The document.
   *
   * @example @lang js
   * const document = await this.$druxt.getResource(
   *   'node--article',
   *   id,
   *   undefined,
   *   'en',
   * )
   */
  async getResource(type: string, id: string, query?: DruxtClientQuery, prefix = '', options?: DruxtReadOptions): Promise<JsonApiDocument<JsonApiResource>> {
    if (!type) throw new TypeError('getResource() needs a type')
    if (!id) throw new TypeError('getResource() needs an id')

    const href = await this.resourceHref(type, prefix)

    const { data } = await this.get<JsonApiDocument<JsonApiResource>>(this.buildQueryUrl([href, id].join('/'), query), readOptions(options))
    return data
  }

  /**
   * Update a resource.
   *
   * @param resource - The JSON:API resource.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   * @returns The response.
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
  async updateResource(resource: JsonApiResource, prefix = ''): Promise<DruxtResponse<JsonApiDocument<JsonApiResource>>> {
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
   * A resource type's URL: the index's, or the conventional one for a type the index does not list.
   *
   * @param type - The JSON:API resource type.
   * @param prefix - The JSON:API endpoint prefix or langcode.
   */
  private async resourceHref(type: string, prefix: string): Promise<string> {
    const entry = await this.getIndex(type, prefix)
    return (entry && entry.href) || `${this.urlPrefix(prefix)}${this.options.endpoint}/${type.replace('--', '/')}`
  }
}
