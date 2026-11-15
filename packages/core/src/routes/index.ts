// @druxt/core/routes: where Druxt's own server routes sit on the site. Framework free: nothing here imports Vue, Nuxt
// or h3, so the build, the server and the browser read the same path.

/**
 * The path every Druxt server route sits under, such as `/api/_druxt/cache/clear`: in Nitro's `/api` namespace, under
 * `_druxt`, so it stays clear of a site's own `/api` routes. When Drupal's JSON:API is proxied at `/api`, Druxt's routes
 * answer first, and the proxy takes the rest. A JSON:API endpoint at or under this path fails the build.
 *
 * @example @lang ts
 * $fetch(`${DRUXT_API_BASE}/date-formats/-`)
 */
export const DRUXT_API_BASE = '/api/_druxt'

/**
 * A URL or path without the slashes at its end, such as a base URL before a path is joined to it. Linear, where a
 * regular expression that ends in `/+$` backtracks on a long run of slashes.
 *
 * @example @lang ts
 * trimEndSlashes('https://example.com//') // 'https://example.com'
 */
export const trimEndSlashes = (value: string): string => {
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end--
  return value.slice(0, end)
}

/** A path without the slashes at its start. */
export const trimStartSlashes = (value: string): string => {
  let start = 0
  while (start < value.length && value[start] === '/') start++
  return value.slice(start)
}
