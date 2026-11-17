// Headers and JSON:API URLs: a header by any spelling of its name, an index link under the base URL, and the resource
// type and id a URL names.

/** Sets a header, replacing any other spelling of its name. An undefined value removes the header. */
export const setHeader = (headers: Record<string, string>, name: string, value?: string): void => {
  for (const key of Object.keys(headers)) if (key.toLowerCase() === name.toLowerCase()) delete headers[key]
  if (value !== undefined) headers[name] = value
}

/**
 * Turns an index link into a path under the base URL, whatever host Drupal put in it.
 *
 * Behind a proxy, Drupal can report an internal host in its links. Using the path alone means no request goes to
 * that host.
 *
 * @param href - The link Drupal sent.
 * @param baseUrl - The base URL, without a trailing slash.
 * @returns The link's path and query.
 */
export const indexPath = (href: string, baseUrl: string): string => {
  // A link that is already a path is already under the base URL.
  if (!/^(?:https?:)?\/\//.test(href)) return href

  const base = new URL(`${baseUrl}/`, 'http://localhost')
  const link = new URL(href, base)
  const root = base.pathname
  if (link.pathname.startsWith(root) || `${link.pathname}/` === root) {
    return `/${link.pathname.slice(root.length)}${link.search}`
  }

  // The link is outside the base URL's path, so it keeps its own path on the base URL's host.
  return `${/^https?:\/\//.test(baseUrl) ? base.origin : ''}${link.pathname}${link.search}`
}

/**
 * Reads the resource a JSON:API URL names.
 *
 * @param href - The URL.
 * @param endpoint - The JSON:API endpoint's path.
 * @returns The resource type the URL reads, and the id when it names one. Empty when it reads no resource type.
 */
export const resourceOf = (href: string, endpoint = '/jsonapi'): { type?: string, id?: string } => {
  const path = new URL(href, 'http://druxt.invalid').pathname
  const at = path.indexOf(`${endpoint}/`)
  const [entityType, bundle, id] = at === -1 ? [] : path.slice(at + endpoint.length + 1).split('/')
  return entityType && bundle ? { type: `${entityType}--${bundle}`, ...(id ? { id } : {}) } : {}
}

/**
 * Reads the resource type a JSON:API URL reads, such as `view--view` for `/jsonapi/view/view`.
 *
 * @param href - The URL.
 * @param endpoint - The JSON:API endpoint's path.
 * @returns The resource type, or the URL's path when it reads none.
 */
export const resourceTypeOf = (href: string, endpoint = '/jsonapi'): string => (
  resourceOf(href, endpoint).type || new URL(href, 'http://druxt.invalid').pathname
)
