/* global globalThis */
// Process-wide cache for server-side responses to requests that carry no credentials.
// Held on globalThis so every copy of this module in the process shares one cache.
const SCOPES = Symbol.for('druxt.processCache')
const scopes = globalThis[SCOPES] || (globalThis[SCOPES] = new Map())

// Axios instances seen sending credentials, and instances already watched.
const credentialed = new WeakSet()
const watched = new WeakSet()

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
  return Object.entries(headers || {}).some(([name, value]) => {
    if (!value || typeof value === 'object') return false
    const header = name.toLowerCase()
    return header === 'authorization' || (header === 'cookie' && session.test(String(value)))
  })
}

/**
 * Whether a request config, as sent, carries credentials.
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
 * Whether an Axios instance sends credentials with its requests.
 *
 * True when its defaults hold credentials, or when a watched request was seen
 * leaving with credentials that an interceptor added.
 *
 * @param {object} axios - The Axios instance.
 * @param {string} [sessionCookie] - A pattern for the session cookie name.
 *
 * @returns {boolean}
 */
export const hasCredentials = (axios, sessionCookie = DRUPAL_SESSION_COOKIE) => {
  if (!axios) return false
  if (credentialed.has(axios)) return true
  return configHasCredentials(axios.defaults, sessionCookie)
}

/**
 * Watch an Axios instance for credentials added while a request is sent.
 *
 * A request interceptor can add an Authorization header that the defaults
 * never show. The response holds the config as sent, so the instance is
 * marked there and the cache is withheld from it from then on.
 *
 * @param {object} axios - The Axios instance.
 * @param {string} [sessionCookie] - A pattern for the session cookie name.
 */
export const watchCredentials = (axios, sessionCookie = DRUPAL_SESSION_COOKIE) => {
  const interceptors = ((axios || {}).interceptors || {}).response
  if (!interceptors || typeof interceptors.use !== 'function' || watched.has(axios)) return
  watched.add(axios)

  const mark = (config) => { if (configHasCredentials(config, sessionCookie)) credentialed.add(axios) }
  interceptors.use(
    (response) => { mark((response || {}).config); return response },
    (error) => { mark((error || {}).config); return Promise.reject(error) }
  )
}

/**
 * How long a shared cache may keep a response, from its headers.
 *
 * Follows Cache-Control as a shared cache must: `private`, `no-store` or
 * `no-cache` forbid storing, `s-maxage` wins over `max-age`, time already spent
 * in a cache in front of Drupal (`Age`) is taken off, and no directive means 0.
 * A `Vary` on any request header other than `Cookie` or `Accept-Encoding` also
 * forbids storing, as the cache key holds nothing that could tell variants apart.
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
  // apart, and Drupal names three of those on every cacheable response: Cookie,
  // which its own page cache also ignores without a session; X-Consumer-ID,
  // which no browser sets and which keys a client's own entries; and
  // Accept-Encoding, harmless since the decoded document is what is stored.
  const vary = header('vary').toLowerCase().split(',').map((v) => v.trim()).filter(Boolean)
  if (vary.some((v) => !['cookie', 'x-consumer-id', 'accept-encoding'].includes(v))) return 0

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
 * Returns null in a browser or when the Axios instance sends credentials, so a
 * response built for one user is never stored or served. Each entry lives for
 * the lifetime it is stored with, which comes from the response's Cache-Control.
 * Store a value only after its request has resolved, and ask for the cache
 * again at that point: the request may have shown the instance to be credentialed.
 *
 * @param {string} scope - The cache scope, e.g. 'index'.
 * @param {object} options - The cache options.
 * @param {object} options.axios - The Axios instance the request uses.
 * @param {number} [options.ttl] - Seconds an entry may live at most. It shortens a lifetime, never extends one, and 0 keeps nothing.
 * @param {string} [options.sessionCookie] - A pattern for the session cookie name.
 *
 * @returns {?{get: Function, set: Function}}
 */
export const processCache = (scope, { axios, ttl, sessionCookie } = {}) => {
  if (!runtime.isServer() || hasCredentials(axios, sessionCookie)) return null

  if (!scopes.has(scope)) scopes.set(scope, new Map())
  const consumers = scopes.get(scope)
  const consumer = consumerId(axios)
  if (!consumers.has(consumer)) consumers.set(consumer, new Map())
  const entries = consumers.get(consumer)
  // A ttl caps what may be kept, so 0 keeps nothing; without one, Drupal's lifetime stands.
  const cap = (seconds) => (typeof ttl === 'number' ? Math.min(seconds, ttl) : seconds)

  return {
    // The reader's cap applies too, so a shorter ttl never serves an older entry.
    get(key) {
      const entry = entries.get(key)
      if (!entry) return undefined
      if (Date.now() - entry.created >= cap(entry.seconds) * 1000) return undefined
      return entry.value
    },

    // A value that may not be kept also removes what an earlier response
    // stored under the key, so the cache follows Drupal's latest answer.
    set(key, value, seconds) {
      if (cap(seconds) > 0) entries.set(key, { value, seconds: cap(seconds), created: Date.now() })
      else entries.delete(key)
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
}
