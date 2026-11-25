// Query strings in the bracket form Drupal's JSON:API reads, and their joining onto a URL.

/**
 * Turns one key and its value into `key=value` pairs.
 *
 * - A nested value is written in qs's bracket form, as drupal-jsonapi-params writes it: `filter[status]=1`.
 * - A top-level array repeats its key, as 1.x did.
 * - A nested null or undefined is left out, because an `IS NULL` condition must have no value.
 */
const pairs = (key: string, value: unknown, nested = false): string[] => {
  if (nested && (value === null || value === undefined)) return []
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown, i) => pairs(nested ? `${key}[${i}]` : key, item, nested))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([name, item]) => pairs(`${key}[${name}]`, item, true))
  }
  return [
    `${encodeURIComponent(key)}=${encodeURIComponent(['string', 'number', 'boolean'].includes(typeof value) ? String(value) : '')}`,
  ]
}

/** Turns a plain object into a query string, with no leading `?`. */
export const stringify = (query: Record<string, unknown>): string => (
  Object.entries(query).flatMap(([key, value]) => pairs(key, value)).join('&')
)

/** Joins a query string onto a URL: after `&` when the URL already has a query, and after `?` otherwise. */
export const withQuery = (url: string, query: string): string => (
  query ? `${url}${url.includes('?') ? '&' : '?'}${query}` : url
)
