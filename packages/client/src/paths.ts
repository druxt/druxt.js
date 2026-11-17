// Slash trimming for URLs and paths, and the one spelling of the JSON:API endpoint.

/**
 * Removes every slash from the end of a URL or path.
 *
 * It runs in linear time. A regular expression ending in `/+$` backtracks on a long run of slashes.
 *
 * @param value - The URL or path.
 * @returns The value with no trailing slash.
 *
 * @example @lang ts
 * trimEndSlashes('https://example.com//') // 'https://example.com'
 */
export const trimEndSlashes = (value: string): string => {
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end--
  return value.slice(0, end)
}

/**
 * Removes every slash from the start of a path.
 *
 * @param value - The path.
 * @returns The value with no leading slash.
 *
 * @example @lang ts
 * trimStartSlashes('//node/1') // 'node/1'
 */
export const trimStartSlashes = (value: string): string => {
  let start = 0
  while (start < value.length && value[start] === '/') start++
  return value.slice(start)
}

/**
 * Gives the JSON:API endpoint one spelling: one leading slash and no trailing slash.
 *
 * The client stores its `endpoint` option in this form, and builds every URL from it. Use it wherever an endpoint is
 * compared or joined to a path, so `api`, `/api` and `/api/` are one endpoint.
 *
 * An endpoint with no path, such as `''` or `'/'`, gives `/jsonapi`. Drupal refuses a JSON:API base path of `/`, so
 * an empty endpoint names no real one.
 *
 * @param endpoint - The endpoint as the site wrote it, such as `api` or `/jsonapi/`.
 * @returns The endpoint's path, `/jsonapi` by default.
 *
 * @example @lang ts
 * normalEndpoint('api/') // '/api'
 * normalEndpoint() // '/jsonapi'
 */
export const normalEndpoint = (endpoint?: string): string => {
  const path = trimEndSlashes(trimStartSlashes(String(endpoint || '')))
  return path ? `/${path}` : '/jsonapi'
}
