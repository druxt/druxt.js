/* global globalThis */
// Process-wide cache for server-side responses to requests that carry no credentials.
// Held on globalThis so every copy of this module in the process shares one cache.
const SCOPES = Symbol.for('druxt.processCache')
const scopes = globalThis[SCOPES] || (globalThis[SCOPES] = new Map())

// Moves on each clear, so a write from a request that was in flight at the time
// is refused. Shared like the scopes, so every copy of the module agrees.
const GENERATION = Symbol.for('druxt.processCacheGeneration')
const generation = globalThis[GENERATION] || (globalThis[GENERATION] = { value: 0 })

/**
 * The process cache's generation, which moves on each clear.
 *
 * Take it as a request starts and pass it to a handle's `set()`, so the value is dropped when a clear came while the
 * request was in flight. It is there whether or not the cache may be used when the request starts.
 *
 * @returns {number}
 */
export const processCacheGeneration = () => generation.value

// Numbers requests in the order they start, shared like the scopes so every
// copy of the module counts on one sequence.
const SEQUENCE = Symbol.for('druxt.processCacheSequence')
const sequence = globalThis[SEQUENCE] || (globalThis[SEQUENCE] = { value: 0 })

/**
 * The next number in the order requests start in, unique within the process.
 *
 * @returns {number}
 */
export const nextRequest = () => ++sequence.value

// The running size of a consumer's entries, held on its map of entries.
const SIZE = Symbol.for('druxt.processCacheSize')

/**
 * The size of a string in UTF-8 bytes.
 *
 * Counted from its UTF-16 code units rather than with Buffer, which webpack
 * would otherwise polyfill into the browser bundle this file is part of.
 *
 * @param {string} text - The text to measure.
 *
 * @returns {number} Bytes.
 */
export const byteSize = (text) => {
  let bytes = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    // A high surrogate and the low one after it are one four-byte character.
    else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      bytes += 4
      i++
    } else bytes += 3
  }
  return bytes
}

// The size a value counts for against `maxSize`, as the bytes of its JSON.
const jsonSize = (value) => {
  try {
    return byteSize(typeof value === 'string' ? value : JSON.stringify(value) || '')
  } catch (err) {
    return 0
  }
}

// Axios instances seen sending credentials, instances a response has passed the watch on, and the patterns watched
// on each.
const credentialed = new WeakSet()
const seen = new WeakSet()
const watched = new WeakMap()

// Where the code runs. Tests replace isServer, as jsdom always has a window.
export const runtime = { isServer: () => typeof window === 'undefined' }

// Drupal names its session cookie SESS or SSESS plus a hash.
const DRUPAL_SESSION_COOKIE = 'S?SESS[0-9a-f]+'

// The consumers module varies every response by X-Consumer-ID, so a client
// sending one keeps entries of its own within a scope.
const consumerId = (axios) => {
  const headers = ((axios || {}).defaults || {}).headers || {}
  for (const set of [headers, headers.common, headers.get]) {
    const match = Object.entries(set || {}).find(([name]) => name.toLowerCase() === 'x-consumer-id')
    if (match && match[1]) return String(match[1])
  }
  return ''
}

const headersHaveCredentials = (headers, sessionCookie) => {
  const session = new RegExp(`(?:^|;\\s*)(?:${sessionCookie})=`, 'i')
  return Object.entries(headers || {}).some(([name, raw]) => {
    // Axios takes an array for a value; other objects are the per-method maps.
    const value = Array.isArray(raw) ? raw.join('; ') : raw
    if (!value || typeof value === 'object') return false
    const header = name.toLowerCase()
    // An Origin counts too: Drupal varies by it, and the cache key holds none.
    return header === 'authorization' || header === 'origin' || (header === 'cookie' && session.test(String(value)))
  })
}

/**
 * Whether a request config, as sent, carries credentials, or an Origin the
 * cache key cannot tell apart.
 *
 * @param {object} config - The Axios request config.
 * @param {string} [sessionCookie] - A pattern for the session cookie name.
 *
 * @returns {boolean}
 */
export const configHasCredentials = (config, sessionCookie = DRUPAL_SESSION_COOKIE) => {
  if (!config) return false
  if (config.auth) return true
  const headers = config.headers || {}
  return headersHaveCredentials(headers, sessionCookie) ||
    headersHaveCredentials(headers.common, sessionCookie) ||
    headersHaveCredentials(headers.get, sessionCookie)
}

/**
 * Whether an Axios instance sends credentials, or an Origin, with its requests.
 *
 * True when its defaults hold credentials, or when a watched request was seen
 * leaving with credentials that an interceptor added.
 *
 * @param {object} axios - The Axios instance.
 * @param {string} [sessionCookie] - A pattern for the session cookie name.
 * @param {string} [url] - The URL of the request about to be made, which an interceptor may look at.
 *
 * @returns {boolean}
 */
export const hasCredentials = (axios, sessionCookie = DRUPAL_SESSION_COOKIE, url = '') => {
  if (!axios) return false
  if (credentialed.has(axios)) return true
  return configHasCredentials(axios.defaults, sessionCookie) || probeInterceptors(axios, sessionCookie, url).credentials
}

/**
 * Whether the cache may be used for a request on an instance. The instance mustn't send credentials, as
 * `hasCredentials` reads them. Nor may it have a request interceptor the probe passes over, such as an async one,
 * until a response has passed the watch on the instance. That response shows the request as it went out. The
 * interceptors run once.
 *
 * Once a response has passed, a request to another URL may be answered from the cache, so no request goes out for
 * the watch to see. An interceptor the probe passes over is taken to add the same credentials to every request on
 * the instance. One that adds them for some URLs only must add them synchronously, where the probe sees them.
 *
 * @param {object} axios - The Axios instance.
 * @param {string} sessionCookie - A pattern for the session cookie name.
 * @param {string} url - The URL of the request about to be made.
 *
 * @returns {boolean}
 * @private
 */
const anonymous = (axios, sessionCookie = DRUPAL_SESSION_COOKIE, url = '') => {
  if (!axios) return true
  if (credentialed.has(axios) || configHasCredentials(axios.defaults, sessionCookie)) return false
  const { credentials, skipped } = probeInterceptors(axios, sessionCookie, url)
  return !credentials && !(skipped && !seen.has(axios))
}

/** Marks a probe config, so an interceptor can tell it from a request. */
const PROBE = Symbol.for('druxt.processCache.probe')

/**
 * Whether a request config is the process cache's probe rather than a request.
 *
 * An interceptor with side effects, such as logging, can leave a probe alone.
 *
 * @param {object} config - The Axios request config.
 *
 * @returns {boolean}
 */
export const isProbe = (config) => !!(config && config[PROBE])

// A copy of plain objects and arrays, so the probe cannot change the defaults.
// Anything else, such as a function or an agent, is shared as it is.
const copy = (value) => {
  if (Array.isArray(value)) return value.map(copy)
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]))
}

// The headers a GET request starts with, as Axios 1 hands them to its
// interceptors. GET headers win over common ones, and the instance's own
// headers win over both. The per-method maps go, apart from the common one,
// which Axios 0.x hands to interceptors as it is.
const METHODS = ['delete', 'get', 'head', 'post', 'put', 'patch', 'options']
const flattenHeaders = (headers) => {
  const own = Object.fromEntries(Object.entries(headers).filter(([name]) => name !== 'common' && !METHODS.includes(name)))
  // Names are merged without regard to case, as AxiosHeaders sets them: a
  // name keeps its first spelling, and a false value is not replaced by a
  // name spelt another way.
  const flat = {}
  for (const layer of [headers.common, headers.get, own]) {
    for (const [name, value] of Object.entries(layer || {})) {
      const key = Object.keys(flat).find((item) => item.toLowerCase() === name.toLowerCase())
      if (key === undefined || key === name) flat[name] = value
      else if (flat[key] !== false) flat[key] = value
    }
  }
  if (headers.common && typeof headers.common === 'object') flat.common = headers.common
  return flat
}

// The probe's headers, with the methods of Axios 1's AxiosHeaders for an
// interceptor that uses them. The methods are not enumerable, so the headers
// still read as a plain object. Names are matched without regard to case.
const probeHeaders = (headers) => {
  const find = (name) => Object.keys(headers).find((key) => key.toLowerCase() === String(name).toLowerCase())
  const methods = {
    set(name, value) {
      if (name && typeof name === 'object') {
        for (const [key, item] of Object.entries(name)) methods.set(key, item)
      } else if (value !== undefined && value !== false) {
        const key = find(name)
        if (key && key !== name) delete headers[key]
        headers[name] = value
      }
      return headers
    },
    get: (name) => { const key = find(name); return key ? headers[key] : undefined },
    has: (name) => !!find(name),
    delete: (name) => { const key = find(name); if (key) delete headers[key]; return !!key },
    toJSON: () => ({ ...headers }),
  }
  for (const name of ['Authorization', 'Content-Type', 'Accept']) {
    const suffix = name.replace('-', '')
    methods[`set${suffix}`] = (value) => methods.set(name, value)
    methods[`get${suffix}`] = () => methods.get(name)
    methods[`has${suffix}`] = () => methods.has(name)
  }
  for (const [name, fn] of Object.entries(methods)) {
    Object.defineProperty(headers, name, { value: fn, enumerable: false, configurable: true, writable: true })
  }
  return headers
}

/**
 * Whether an instance's request interceptors add credentials to a request.
 *
 * Runs them on a copy of the defaults, with the request's URL, as Axios does:
 * each `runWhen` is asked first, on the config as it starts and in the order
 * the interceptors were added, and those it does not refuse run last added
 * first.
 *
 * The probe can't tell what an async function, a returned promise or a throw
 * would add, so it passes over each of those and goes on with the config it
 * has, and says it did. An async function is never called, as running it may
 * send requests of its own. Only the response-side watch sees what they add,
 * so the cache is withheld from the instance until a response has passed it.
 *
 * Counting them as credentials would turn the cache off for every visitor on a
 * site using @nuxtjs/auth-next, which adds an async interceptor to refresh
 * tokens whether or not anyone is signed in. Its token goes on the defaults.
 *
 * @param {object} axios - The Axios instance.
 * @param {string} sessionCookie - A pattern for the session cookie name.
 * @param {string} url - The URL of the request about to be made.
 *
 * @returns {{credentials: boolean, skipped: boolean}} Whether they add credentials, and whether any was passed over.
 * @private
 */
const probeInterceptors = (axios, sessionCookie, url) => {
  const manager = ((axios || {}).interceptors || {}).request
  if (!manager || typeof manager.forEach !== 'function') return { credentials: false, skipped: false }

  const defaults = copy({ ...(axios.defaults || {}) })
  // Own properties only, so headers held in a class are copied too.
  const headers = probeHeaders(flattenHeaders(copy({ ...((axios.defaults || {}).headers || {}) })))
  let config = { ...defaults, headers, method: 'get', url, [PROBE]: true }

  const handlers = []
  manager.forEach((handler) => {
    if (!handler || typeof handler.fulfilled !== 'function') return
    if (typeof handler.runWhen === 'function') {
      // A predicate that throws here is kept, so the probe never fails a request.
      let refused = false
      try {
        refused = handler.runWhen(config) === false
      } catch {
        refused = false
      }
      if (refused) return
    }
    handlers.unshift(handler)
  })

  let skipped = false
  for (const { fulfilled } of handlers) {
    if (fulfilled.constructor && fulfilled.constructor.name === 'AsyncFunction') {
      skipped = true
      continue
    }
    let next
    try {
      next = fulfilled(config)
    } catch {
      skipped = true
      continue
    }
    if (next && typeof next.then === 'function') {
      next.then(undefined, () => {})
      skipped = true
      continue
    }
    if (next) config = next
  }
  return { credentials: configHasCredentials(config, sessionCookie), skipped }
}

/**
 * Watch an Axios instance for credentials added while a request is sent.
 *
 * A request interceptor can add an Authorization header that the defaults
 * never show. The response holds the config as sent, so the instance is
 * marked there and the cache is withheld from it from then on.
 *
 * Clients sharing an instance may each configure a different session cookie.
 * One interceptor is registered, against every pattern registered on the
 * instance, so a cookie only the second client would recognise is still seen.
 *
 * @param {object} axios - The Axios instance.
 * @param {string} [sessionCookie] - A pattern for the session cookie name.
 */
export const watchCredentials = (axios, sessionCookie = DRUPAL_SESSION_COOKIE) => {
  const interceptors = ((axios || {}).interceptors || {}).response
  if (!interceptors || typeof interceptors.use !== 'function') return

  const registered = watched.get(axios)
  if (registered) {
    registered.add(sessionCookie)
    return
  }
  const patterns = new Set([sessionCookie])
  watched.set(axios, patterns)

  // `sent` only for a request that went out. A request interceptor's rejection reaches the error handler with
  // the config it was given, before anything is sent, so it shows credentials but not the request as sent.
  const mark = (config, sent) => {
    if (config && sent) seen.add(axios)
    for (const pattern of patterns) {
      if (configHasCredentials(config, pattern)) {
        credentialed.add(axios)
        return
      }
    }
  }
  interceptors.use(
    (response) => { mark((response || {}).config, true); return response },
    // Axios gives an error `request` once the request is sent, and `response` once it is answered.
    (error) => { mark((error || {}).config, !!(error && (error.request || error.response))); return Promise.reject(error) }
  )
}

/**
 * How long a shared cache may keep a response, from its headers.
 *
 * Follows Cache-Control as a shared cache must: `private`, `no-store` or
 * `no-cache` forbid storing, `s-maxage` wins over `max-age`, time already spent
 * in a cache in front of Drupal (`Age`) is taken off, and no directive means 0.
 * A `Vary` on any request header other than `Cookie`, `X-Consumer-ID`,
 * `Accept-Encoding` or `Origin` also forbids storing, as the cache key holds
 * nothing that could tell variants apart.
 *
 * @param {object} [headers] - The response headers.
 *
 * @returns {number} Seconds the response may be kept, 0 when it may not.
 */
export const parseCacheLifetime = (headers) => {
  // Every key that names the header, whatever its case, joined as a list header is.
  const header = (name) => Object.entries(headers || {})
    .filter(([key]) => key.toLowerCase() === name)
    .map(([, value]) => String(value))
    .join(', ')

  const directives = header('cache-control').toLowerCase().split(',').map((d) => d.trim())
  if (directives.some((d) => ['private', 'no-store', 'no-cache'].includes(d))) return 0

  // The cache is keyed by URL alone, so a response that varies by a header the
  // visitor's browser sends, such as Accept-Language, cannot be stored. A header
  // the site's own client sends the same way on every request tells no variants
  // apart, and Drupal names four of those on cacheable responses: Cookie,
  // which its own page cache also ignores without a session; X-Consumer-ID,
  // which no browser sets and which keys a client's own entries;
  // Accept-Encoding, harmless since the decoded document is what is stored; and
  // Origin, which Drupal's CORS adds whenever it is on and which the site's
  // server does not send, so every answer is the one for no origin. A client
  // that does send one doesn't use the cache at all (see hasCredentials).
  const vary = header('vary').toLowerCase().split(',').map((v) => v.trim()).filter(Boolean)
  if (vary.some((v) => !['cookie', 'x-consumer-id', 'accept-encoding', 'origin'].includes(v))) return 0

  const seconds = (name) => {
    const directive = directives.find((d) => d.startsWith(`${name}=`))
    // The whole value must be digits: parseInt would read 300 from `300abc`.
    const value = directive ? directive.slice(name.length + 1) : ''
    return /^\d+$/.test(value) ? Number(value) : NaN
  }
  // A present but unusable s-maxage means stale, not "use max-age instead".
  const lifetime = directives.some((d) => d.startsWith('s-maxage=')) ? seconds('s-maxage') : seconds('max-age')
  if (Number.isNaN(lifetime)) return 0

  // Age already spent in a cache in front of Drupal, from the Age header
  // alone. Drupal's own page cache serves a stored response with its original
  // Date and no Age, so an age read from Date would leave nothing to keep
  // once that entry is five minutes old.
  const age = parseInt(header('age'), 10) || 0
  return Math.max(0, lifetime - age)
}

/**
 * Get the process cache for a scope.
 *
 * Returns null in a browser, when the Axios instance sends credentials, and
 * when an interceptor the probe can't run may add them, until a response has
 * shown that it doesn't. An
 * entry with no lifetime, such as a response Drupal marks `no-cache`, is never
 * stored. Each entry lives for the lifetime it is stored with, which comes from
 * the response's Cache-Control.
 * Store a value only after its request has resolved, and ask for the cache
 * again at that point: the request may have shown the instance to be credentialed.
 *
 * @param {string} scope - The cache scope, e.g. 'index'.
 * @param {object} options - The cache options.
 * @param {object} options.axios - The Axios instance the request uses.
 * @param {number} [options.ttl] - Seconds an entry may live at most. It shortens a lifetime, never extends one, and 0 keeps nothing.
 * @param {string} [options.sessionCookie] - A pattern for the session cookie name.
 * @param {number} [options.maxSize] - The size the scope keeps per consumer at most, in bytes of stored JSON. Past it, expired entries go first, then the least recently used, and a value larger than the whole limit is not stored.
 * @param {Function} [options.sizeOf] - Measures a value for `maxSize`. The bytes of its JSON by default.
 * @param {string} [options.url] - The URL of the request the cache is asked for, which the request interceptors are probed with.
 *
 * @returns {?{get: Function, set: Function}}
 */
export const processCache = (scope, { axios, ttl, sessionCookie, maxSize, sizeOf = jsonSize, url } = {}) => {
  if (!runtime.isServer() || !anonymous(axios, sessionCookie, url)) return null

  if (!scopes.has(scope)) scopes.set(scope, new Map())
  const consumers = scopes.get(scope)
  const consumer = consumerId(axios)
  if (!consumers.has(consumer)) consumers.set(consumer, new Map())
  const entries = consumers.get(consumer)
  // A ttl caps what may be kept, so 0 keeps nothing; without one, Drupal's lifetime stands.
  const cap = (seconds) => (typeof ttl === 'number' ? Math.min(seconds, ttl) : seconds)
  const taken = generation.value

  const expired = (entry, now = Date.now()) => now - entry.created >= entry.seconds * 1000
  // The running size of the entries, kept on the map so every handle and copy of the module agrees.
  const total = () => entries[SIZE] || 0
  const remove = (key) => {
    const entry = entries.get(key)
    if (!entry) return
    entries[SIZE] = total() - entry.size
    entries.delete(key)
  }
  const bounded = typeof maxSize === 'number'
  // Keeps the scope within `maxSize`: expired entries go first, then the least recently used.
  const bound = () => {
    if (!bounded || total() <= maxSize) return
    const now = Date.now()
    for (const [key, entry] of entries) if (expired(entry, now)) remove(key)
    for (const key of entries.keys()) {
      if (total() <= maxSize) break
      remove(key)
    }
  }

  return {
    // The generation this handle was taken at. Compare a handle taken after a
    // request resolves against one taken before it started: a difference means
    // the cache was cleared while the request was in flight.
    generation: taken,

    // The reader's cap applies too, so a shorter ttl never serves an older entry.
    get(key) {
      const entry = entries.get(key)
      if (!entry) return undefined
      // Past its own lifetime the entry is no use to any reader, so it goes.
      if (expired(entry)) {
        remove(key)
        return undefined
      }
      if (Date.now() - entry.created >= cap(entry.seconds) * 1000) return undefined
      // A Map keeps insertion order, so moving a read entry to the end keeps the oldest first.
      entries.delete(key)
      entries.set(key, entry)
      return entry.value
    },

    /**
     * Store a value, unless a clear has happened since this handle was taken.
     *
     * A value that may not be kept also removes what an earlier response
     * stored under the key, so the cache follows Drupal's latest answer.
     *
     * @param {string} key - The cache key.
     * @param {*} value - The value to store.
     * @param {number} seconds - Seconds the value may be kept.
     * @param {number} [since] - A generation the value was fetched at. The value is dropped when a clear has happened since.
     *
     * @returns {*} The value, stored or not.
     */
    set(key, value, seconds, since) {
      if (since !== undefined && since !== generation.value) return value
      remove(key)
      if (cap(seconds) > 0) {
        const size = sizeOf(value)
        // A value larger than the whole limit would empty the scope and still not fit.
        if (bounded && size > maxSize) return value
        entries.set(key, { value, seconds: cap(seconds), created: Date.now(), size })
        entries[SIZE] = total() + size
        bound()
      }
      return value
    },
  }
}

/**
 * Empty the process cache.
 *
 * @param {string} [scope] - The scope to empty. All scopes when omitted.
 */
export const resetProcessCache = (scope) => {
  if (scope) scopes.delete(scope)
  else scopes.clear()
  generation.value += 1
}
