// Process-wide cache for server-side responses to requests that carry no credentials.
const scopes = new Map()

// Where the code runs. Tests replace isServer, as jsdom always has a window.
export const runtime = { isServer: () => typeof window === 'undefined' }

// Drupal names its session cookie SESS or SSESS plus a hash.
const DRUPAL_SESSION_COOKIE = 'S?SESS[0-9a-f]+'

/**
 * Whether an Axios instance sends credentials with its requests.
 *
 * @param {object} axios - The Axios instance.
 * @param {string} [sessionCookie] - A pattern for the session cookie name.
 *
 * @returns {boolean}
 */
export const hasCredentials = (axios, sessionCookie = DRUPAL_SESSION_COOKIE) => {
  const defaults = (axios || {}).defaults || {}
  if (defaults.auth) return true

  const session = new RegExp(`(?:^|;\\s*)(?:${sessionCookie})=`, 'i')
  const headers = { ...(defaults.headers || {}).common, ...(defaults.headers || {}).get }
  return Object.entries(headers).some(([name, value]) => {
    if (!value) return false
    const header = name.toLowerCase()
    return header === 'authorization' || (header === 'cookie' && session.test(String(value)))
  })
}

/**
 * Get the process cache for a scope.
 *
 * Returns null in a browser, without a ttl, or when the Axios instance sends
 * credentials, so a response built for one user is never stored or served.
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
    get(key) {
      const entry = entries.get(key)
      if (!entry) return undefined
      if (entry.expires <= Date.now()) {
        entries.delete(key)
        return undefined
      }
      return entry.value
    },

    set(key, value) {
      const entry = { value, expires: Date.now() + ttl * 1000 }
      entries.set(key, entry)
      // A rejected request is dropped so the next caller retries.
      if (value && typeof value.then === 'function') {
        value.catch(() => { if (entries.get(key) === entry) entries.delete(key) })
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
}
