import type { DruxtClient } from '@druxt/client'
import type { DruxtDevtoolsRequest } from '@druxt/devtools'
import { DRUXT_API_BASE } from '@druxt/core/routes'

/** A request as the store or a client reports it: the recorder adds the id, the side and the time. */
export type DruxtRequestRecord = Pick<DruxtDevtoolsRequest, 'kind' | 'path' | 'source'> & Partial<Pick<DruxtDevtoolsRequest, 'status' | 'start' | 'duration' | 'partial'>>

type Recorder = (request: DruxtRequestRecord) => void

// The recorder for each client, so the store's hits on the server render go to that render's list. Created on first
// use, so a production build, which never records, has none of it.
let recorders: WeakMap<object, Recorder> | undefined

/**
 * Sets where a client's requests are recorded, for the development tools. Development only.
 *
 * @param client - The client, such as `nuxtApp.$druxt`.
 * @param recorder - The recorder.
 */
export const setRequestRecorder = (client: object, recorder: Recorder): void => {
  (recorders ||= new WeakMap()).set(client, recorder)
}

/**
 * Records a request for the development tools, when its client has a recorder. Development only: callers guard it
 * with `import.meta.dev`.
 *
 * @param client - The client the request was made through, or would have been.
 * @param request - What was asked for, and whether the store answered it.
 */
export const recordRequest = (client: object, request: DruxtRequestRecord): void => {
  recorders?.get(client)?.(request)
}

/**
 * Records a client's requests as they end, through its request hook: each one's kind, path, status and timing. No
 * headers, bodies or credentials reach the hook.
 *
 * @param client - The client.
 * @param origin - The page's start on this side's clock, read when each request ends.
 * @returns The function that stops recording.
 */
export const captureRequests = (client: DruxtClient, origin: () => number): () => void =>
  client.onRequest((event) => {
    if (event.type !== 'end') return
    const start = (globalThis.performance?.now() ?? Date.now()) - event.duration - origin()
    recordRequest(client, { kind: requestKind(event.url, client.options.endpoint), path: requestPath(event.url), source: 'network', start, duration: event.duration, ...(event.status ? { status: event.status } : {}), ...(event.omitted !== undefined ? { partial: event.omitted } : {}) })
  })

/**
 * What a request was for, from its URL.
 *
 * @param url - The request's URL or path.
 * @param endpoint - The JSON:API endpoint's path.
 */
export const requestKind = (url: string, endpoint = '/jsonapi'): DruxtDevtoolsRequest['kind'] => {
  if (url.includes(`${DRUXT_API_BASE}/schema/`) || /\/entity_(?:view|form)_display\/|\/field_config\//.test(url)) return 'schema'
  if (url.includes(`${DRUXT_API_BASE}/date-formats/`) || /\/date_format\//.test(url)) return 'date-formats'
  const path = requestPath(url).split('?')[0]!
  // Druxt's other routes, even when JSON:API is at a path they sit under, such as `/api`.
  if (path === DRUXT_API_BASE || path.startsWith(`${DRUXT_API_BASE}/`)) return 'other'
  return path.includes(endpoint) ? 'jsonapi' : 'other'
}

/**
 * A URL's path and query, without the origin, decoded for reading.
 *
 * @param url - The URL.
 */
export const requestPath = (url: string): string => {
  try {
    const parsed = new URL(url, 'http://druxt.invalid')
    return decodeURIComponent(parsed.pathname + parsed.search)
  } catch {
    return url
  }
}

/**
 * The page a route is on: its path and query, as the router gives them, without a hash, which is a place in the same
 * page. A server render's requests are labelled with it, and the browser shows them on the page it names.
 *
 * @param fullPath - A route's `fullPath`.
 * @returns The page, such as `/articles/oatmeal?page=2`.
 */
export const pageOf = (fullPath: string): string => fullPath.split('#')[0]!

/**
 * Tells a navigation to another page from one within the page shown. A page is a route's path and query, as the
 * router gives it, without the app's base URL: a hash is a place in the same page.
 *
 * @param initial - The route shown first, such as `router.currentRoute.value.fullPath`.
 * @returns A function that takes a navigation's `to.fullPath`, and returns the new page's path, or `undefined` for
 *   the page already shown.
 */
export const createPageGuard = (initial: string): (fullPath: string) => string | undefined => {
  let shown = pageOf(initial)
  return (fullPath) => {
    const page = pageOf(fullPath)
    if (page === shown) return undefined
    shown = page
    return page
  }
}
