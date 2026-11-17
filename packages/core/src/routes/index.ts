// @druxt/core/routes: where Druxt's own server routes sit on the site.
//
// It is framework free. Nothing here imports Vue, Nuxt or h3, so the build, the server and the browser read the same
// path.

/**
 * The path every Druxt server route sits under, such as `/api/_druxt/cache/clear`.
 *
 * It is in Nitro's `/api` namespace, under `_druxt`, so it stays clear of a site's own `/api` routes. When Drupal's
 * JSON:API is proxied at `/api`, Druxt's routes answer first, and the proxy takes the rest.
 *
 * A JSON:API endpoint at or under this path fails the build.
 *
 * @example @lang ts
 * $fetch(`${DRUXT_API_BASE}/date-formats/-`)
 */
export const DRUXT_API_BASE = '/api/_druxt'

// The slash helpers, and the endpoint's one spelling. They live in @druxt/client, which stores its own `endpoint` with
// them. Core re-exports them, so its modules read an endpoint as the client does.
export { normalEndpoint, trimEndSlashes, trimStartSlashes } from '@druxt/client'
