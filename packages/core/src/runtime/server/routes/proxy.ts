import { createError, defineEventHandler, getProxyRequestHeaders, getRequestHeader, getRequestHost, getRequestIP, getRequestProtocol, getRequestWebStream, getResponseHeader, sendProxy, setResponseHeader } from 'h3'
import routes from '#druxt/proxy-routes'
import { useRuntimeConfig } from '#imports'
import type { DruxtPrivateConfig } from '../../types'
import { forgetProcessCache } from '@druxt/client'
import { forwardedHeaders, hostname, isDruxtRoute, proxyCookie, proxyLocation, proxyTarget, sessionHeaders, writtenResource } from '../utils/proxy'
import { holdsSession } from '../utils/session'

/** The methods that send a body. Their body is streamed to Drupal. */
const payloadMethods = new Set(['PATCH', 'POST', 'PUT', 'DELETE'])

/**
 * The proxy to Drupal, for the paths the modules register with `addDruxtProxy()`.
 *
 * Those paths are the JSON:API under each language prefix, the files directory, the token and userinfo routes, and
 * the router's translate-path.
 *
 * The base URL is read from the runtime config for each request. So a build pointed at another Drupal with
 * `NUXT_PUBLIC_DRUXT_BASE_URL` sends the browser's requests to the same Drupal as the server's.
 *
 * The request:
 *
 * - The method and the headers pass through. The body streams through unbuffered.
 * - `Host`, `Accept` and `Accept-Encoding` are not passed, as with Nitro's proxy route rules. So Drupal sees its own
 *   host.
 * - A header for the hop to the site stops at the site. That is `Connection`, each header it names, and the
 *   hop-by-hop headers such as `TE` and `Proxy-Authorization`.
 * - Forwarding headers the browser sent are dropped. `X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Proto`
 *   are set from the site's own view of the request.
 * - The private `druxt.proxy.trustForwarded` is for a front proxy that sets the forwarding headers. With it, the
 *   client is added to the inbound `X-Forwarded-For` chain, and the inbound host and protocol pass on.
 * - A path below Druxt's own routes, `/api/_druxt`, answers 404 and never reaches Drupal. Without this, a request
 *   with a method its route does not take would fall through to a proxy at `/api/**`.
 *
 * Credentials:
 *
 * - Of the browser's cookies, only Drupal's session cookie goes to Drupal. It is found by the cache's pattern for
 *   its name, or by the site's `cache.sessionCookie`. No `Cookie` header goes when there is none.
 * - When the site's server holds the session, its access token goes as the `Authorization` header. It does not when
 *   the request sent its own, or asked for none with `X-Druxt-Auth: none`.
 *
 * The response:
 *
 * - A redirect reaches the browser and is never followed here. A `Location` on Drupal's base URL is moved to this
 *   site.
 * - A cookie for Drupal's host is set for this site's host.
 * - The response's encoding and length headers are recomputed. The rest come back as Drupal sent them.
 * - A write that Drupal accepts, a `POST`, `PATCH` or `DELETE` to a JSON:API resource, drops entries from the
 *   content cache: those for that resource, its type's collections, every Views result and the route lookups. An
 *   anonymous render after an editor's save then reads the saved entity, in a listing too. Other processes' caches
 *   are Purge's job.
 */
export default defineEventHandler((event) => {
  const baseUrl = String((useRuntimeConfig(event).public.druxt as { baseUrl?: string } | undefined)?.baseUrl || '')
  // A base URL that does not parse is the deployment's fault, not the request's, so the answer is a 502.
  let backend: string
  try {
    backend = new URL(baseUrl).hostname
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', message: 'The Drupal base URL is not a valid URL.' })
  }
  // Druxt's own routes belong to the site, whatever the method. None of their paths reaches Drupal.
  if (isDruxtRoute(event.path)) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  const target = proxyTarget(event.path, baseUrl, routes)
  if (!target) throw createError({ statusCode: 400, statusMessage: 'Bad Request' })

  // A front proxy's forwarding headers are trusted only when the deployment says so. A browser can send them too.
  const proxy = (useRuntimeConfig(event).druxt as Partial<DruxtPrivateConfig> | undefined)?.proxy
  const trust = proxy?.trustForwarded === true
  // The public host. It is the cookie domain too.
  const host = getRequestHost(event, { xForwardedHost: trust })
  // The session's access token is read from its httpOnly cookie and sent as the `Authorization` header, so the
  // browser never holds it. A token request gets none, as it carries no user's token.
  const headers = sessionHeaders(forwardedHeaders(getProxyRequestHeaders(event), {
    ip: getRequestIP(event),
    host,
    protocol: getRequestProtocol(event, { xForwardedProto: trust }),
  }, trust, getRequestHeader(event, 'connection')), holdsSession(event) && !event.path.startsWith('/oauth/token'), proxy?.sessionCookie)
  const stream = payloadMethods.has(event.method)
  const site = hostname(host)
  return sendProxy(event, target, {
    fetchOptions: {
      method: event.method,
      headers,
      redirect: 'manual',
      ...(stream ? { body: getRequestWebStream(event), duplex: 'half' } : {}),
    } as RequestInit,
    onResponse: (event, response) => {
      if (stream && response.ok) {
        const stale = writtenResource(event.path, String((useRuntimeConfig(event).public.druxt as { endpoint?: string } | undefined)?.endpoint || '/jsonapi'))
        if (stale) forgetProcessCache('content', stale)
      }
      const location = response.headers.get('location')
      if (location) setResponseHeader(event, 'location', proxyLocation(location, baseUrl))
      const cookies = getResponseHeader(event, 'set-cookie')
      if (cookies) setResponseHeader(event, 'set-cookie', (Array.isArray(cookies) ? cookies : [String(cookies)]).map((cookie) => proxyCookie(cookie, backend, site)))
    },
  })
})
