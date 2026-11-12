// Headers and JSON:API URLs: trimming slashes, a header by any spelling of its name, an index link under the base
// URL, and the resource type and id a URL names.

/** The value without the run of `char` at its end. Linear, where `/x+$/` is quadratic on a long run. */
export const trimEnd = (value: string, char = '/'): string => {
  let end = value.length
  while (end > 0 && value[end - 1] === char) end--
  return value.slice(0, end)
}

/** The value without the run of `char` at its start. */
export const trimStart = (value: string, char = '/'): string => {
  let start = 0
  while (start < value.length && value[start] === char) start++
  return value.slice(start)
}

/** Sets a header over any other spelling of its name, or removes it when the value is undefined. */
export const setHeader = (headers: Record<string, string>, name: string, value?: string): void => {
  for (const key of Object.keys(headers)) if (key.toLowerCase() === name.toLowerCase()) delete headers[key]
  if (value !== undefined) headers[name] = value
}

/**
 * An index link as a path under the base URL, whatever host Drupal put in it,
 * so no request goes to an internal host Drupal reports from behind a proxy.
 *
 * @param href - The link Drupal sent.
 * @param baseUrl - The base URL, without a trailing slash.
 */
export const indexPath = (href: string, baseUrl: string): string => {
  // A path is already on the base URL.
  if (!/^(?:https?:)?\/\//.test(href)) return href
  const base = new URL(`${baseUrl}/`, 'http://localhost')
  const link = new URL(href, base)
  const root = base.pathname
  if (link.pathname.startsWith(root) || `${link.pathname}/` === root) return `/${link.pathname.slice(root.length)}${link.search}`
  // Outside the base URL's path: the same path on the base URL's host.
  return `${/^https?:\/\//.test(baseUrl) ? base.origin : ''}${link.pathname}${link.search}`
}

/** The parts of a JSON:API URL: the resource type it reads and the id it names, or nothing. */
export const resourceOf = (href: string, endpoint = '/jsonapi'): { type?: string, id?: string } => {
  const path = new URL(href, 'http://druxt.invalid').pathname
  const at = path.indexOf(`${endpoint}/`)
  const [entityType, bundle, id] = at === -1 ? [] : path.slice(at + endpoint.length + 1).split('/')
  return entityType && bundle ? { type: `${entityType}--${bundle}`, ...(id ? { id } : {}) } : {}
}

/**
 * The resource type a JSON:API URL reads, such as `view--view` for `/jsonapi/view/view`, or its path when it reads none.
 *
 * @param href - The URL.
 * @param endpoint - The JSON:API endpoint's path.
 */
export const resourceTypeOf = (href: string, endpoint = '/jsonapi'): string => resourceOf(href, endpoint).type || new URL(href, 'http://druxt.invalid').pathname
