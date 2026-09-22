// Process-wide cache for server-side responses to requests that carry no credentials.
const scopes = new Map()

// Axios instances seen sending credentials, and instances already watched.
const credentialed = new WeakSet()
const watched = new WeakSet()

// Where the code runs. Tests replace isServer, as jsdom always has a window.
export const runtime = { isServer: () => typeof window === 'undefined' }

// Drupal names its session cookie SESS or SSESS plus a hash.
const DRUPAL_SESSION_COOKIE = 'S?SESS[0-9a-f]+'

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
 * Get the process cache for a scope.
 *
 * Returns null in a browser, without a ttl, or when the Axios instance sends
 * credentials, so a response built for one user is never stored or served.
 * Store a value only after its request has resolved, and ask for the cache
 * again at that point: the request may have shown the instance to be credentialed.
 *
 * @param {string} scope - The cache scope, e.g. 'index'.
 * @param {object} options - The cache options.
 * @param {object} options.axios - The Axios instance the request uses.
 * @param {number} [options.ttl] - Seconds an entry lives. Falsy disables the cache.
 * @param {string} [options.sessionCookie] - A pattern for the session cookie name.
 *
 * @returns {?{get: Function, set: Function}}
 */
export const processCache = (scope, { axios, ttl, sessionCookie } = {}) => {
  if (!ttl || !runtime.isServer() || hasCredentials(axios, sessionCookie)) return null

  if (!scopes.has(scope)) scopes.set(scope, new Map())
  const entries = scopes.get(scope)

  return {
    // The reader's ttl applies, so a shorter ttl never serves an older entry.
    get(key) {
      const entry = entries.get(key)
      if (!entry) return undefined
      if (Date.now() - entry.created >= ttl * 1000) return undefined
      return entry.value
    },

    set(key, value) {
      entries.set(key, { value, created: Date.now() })
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
