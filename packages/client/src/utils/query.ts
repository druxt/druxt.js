// Query strings in the bracket form Drupal's JSON:API reads, and their joining onto a URL.

// Nested values in qs's bracket form, as drupal-jsonapi-params writes them; a top-level array repeats its key, as 1.x did.
// A nested null or undefined is left out, as an `IS NULL` condition must have no value.
const pairs = (key: string, value: unknown, nested = false): string[] => {
  if (nested && (value === null || value === undefined)) return []
  if (Array.isArray(value)) return value.flatMap((item: unknown, i) => pairs(nested ? `${key}[${i}]` : key, item, nested))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([name, item]) => pairs(`${key}[${name}]`, item, true))
  return [`${encodeURIComponent(key)}=${encodeURIComponent(['string', 'number', 'boolean'].includes(typeof value) ? String(value) : '')}`]
}

export const stringify = (query: Record<string, unknown>): string => Object.entries(query).flatMap(([key, value]) => pairs(key, value)).join('&')

// After `&` when the URL already has a query.
export const withQuery = (url: string, query: string): string => (query ? `${url}${url.includes('?') ? '&' : '?'}${query}` : url)
