/**
 * Special Drupal routes, and the URL each one resolves to.
 *
 * `<nolink>`, `<none>` and `<button>` have no URL, so the menu item renders
 * as text.
 *
 * @private
 */
const specialRoutes = {
  '<front>': '/',
  '<nolink>': '',
  '<none>': '',
  '<button>': '',
}

/**
 * Drupal file paths. Drupal serves these, not the frontend router.
 *
 * @private
 */
const filePath = /^\/(sites\/[^/]+\/files|system\/files)(\/|$)/

/**
 * A URL with a scheme, such as `https:` or `mailto:`, or a URL that starts
 * with `//`.
 *
 * @private
 */
const absoluteUrl = /^([a-z][a-z\d+.-]*:|\/\/)/i

/**
 * Parses a URL. Relative URLs are parsed against a placeholder host.
 *
 * @private
 *
 * @param {string} url - The URL to parse.
 *
 * @returns {URL|undefined} The parsed URL, or undefined if it cannot be parsed.
 */
const parse = (url) => {
  try {
    return new URL(url, 'http://placeholder.invalid')
  } catch (err) {
    return undefined
  }
}

/**
 * Gets the host of a URL.
 *
 * @private
 *
 * @param {string} [url] - The URL.
 *
 * @returns {string|undefined} The host, with the port if the URL has one.
 */
const getHost = (url) => url ? (parse(url) || {}).host : undefined

/**
 * Converts a Drupal link field URI to a URL.
 *
 * @private
 *
 * @param {string} [uri] - The link field URI, such as `entity:node/1`.
 *
 * @returns {string} The URL, or an empty string if the URI has no URL.
 */
const uriToUrl = (uri) => {
  if (typeof uri !== 'string') return ''

  const [scheme, ...parts] = uri.split(':')
  const value = parts.join(':')
  switch (scheme) {
    case 'internal':
      return value
    case 'base':
      return `/${value.replace(/^\//, '')}`
    case 'entity':
      return `/${value}`
    case 'route':
      // The frontend cannot resolve other routes.
      return Object.prototype.hasOwnProperty.call(specialRoutes, value) ? specialRoutes[value] : ''
    default:
      return uri
  }
}

/**
 * Builds a Vue Router location from a parsed URL.
 *
 * @private
 *
 * @param {URL} url - The parsed URL.
 *
 * @returns {object} The location, with `query` and `hash` only if the URL has them.
 */
const toLocation = ({ pathname, searchParams, hash }) => {
  const location = { path: pathname }

  const query = {}
  for (const [key, value] of searchParams) {
    query[key] = Object.prototype.hasOwnProperty.call(query, key) ? [].concat(query[key], value) : value
  }
  if (Object.keys(query).length) location.query = query
  if (hash) location.hash = hash

  return location
}

/**
 * Gets the URL of a menu item.
 *
 * Every menu source sets `attributes.url`. A menu item built by hand can
 * have only a Drupal link field. Then the URL comes from
 * `link.resolvable_uri` (Drupal 11.4 and later), or else from `link.uri`.
 *
 * @example @lang js
 * getMenuLinkUrl({ link: { uri: 'entity:node/1', resolvable_uri: '/about' } })
 * // '/about'
 *
 * @param {object} [attributes] - The menu item attributes.
 *
 * @returns {string} The URL, or an empty string if the menu item has no URL.
 */
const getMenuLinkUrl = (attributes) => {
  const { url, link } = attributes || {}
  if (typeof url === 'string') return url

  const { resolvable_uri: resolvableUri, uri } = link || {}
  if (typeof resolvableUri === 'string') return resolvableUri

  return uriToUrl(uri)
}

/**
 * Resolves how a menu item links to its URL.
 *
 * - A path, such as `/about`, uses the frontend router, even if Drupal has no
 *   route for it.
 * - An absolute URL on the Drupal host or the frontend host also uses the
 *   frontend router, with its path, query and hash, and `http:` and `https:`
 *   links to one host both match because the scheme is ignored.
 * - Drupal files, under `/sites/{site}/files/` or `/system/files/`, are plain
 *   links.
 * - Any other absolute URL is a plain link.
 * - An empty URL has no link. The menu item renders as text.
 *
 * @example @lang js
 * resolveMenuLink('https://cms.example.com/about?tab=1', { baseUrl: 'https://cms.example.com' })
 * // { to: { path: '/about', query: { tab: '1' } } }
 *
 * @param {string} url - The menu item URL.
 * @param {MenuLinkContext} [context] - The hosts that belong to this site.
 *
 * @returns {MenuLink} The resolved link.
 */
const resolveMenuLink = (url, context = {}) => {
  if (typeof url !== 'string' || !url) return {}

  const target = parse(url)
  if (!target || filePath.test(target.pathname)) return { href: url }

  if (absoluteUrl.test(url)) {
    const hosts = [context.baseUrl, context.frontendUrl].map(getHost).filter(Boolean)
    const isSite = /^https?:$/.test(target.protocol) && hosts.includes(target.host)
    return isSite ? { to: toLocation(target) } : { href: url }
  }

  return url.startsWith('/') ? { to: toLocation(target) } : { href: url }
}

export { getMenuLinkUrl, resolveMenuLink }

/**
 * The hosts that belong to this site.
 *
 * @typedef {object} MenuLinkContext
 *
 * @property {string} [baseUrl] - The Drupal base URL.
 * @property {string} [frontendUrl] - The frontend URL, such as `https://www.example.com` or `//www.example.com`.
 */

/**
 * A resolved menu link. It has `to` for the frontend router, `href` for a
 * plain link, or neither for a menu item that renders as text.
 *
 * @typedef {object} MenuLink
 *
 * @property {object} [to] - A Vue Router location, with `path`, and `query` and `hash` if the URL has them.
 * @property {string} [href] - The URL for a plain link.
 *
 * @example @lang js
 * { to: { path: '/search', query: { q: 'menu' }, hash: '#results' } }
 */
