import { createError, defineEventHandler, getProxyRequestHeaders, getRequestHost, getRequestIP, getRequestProtocol, getRequestWebStream, getResponseHeader, sendProxy, setResponseHeader } from 'h3'
import routes from '#druxt/proxy-routes'
import { useRuntimeConfig } from '#imports'
import type { DruxtPrivateConfig } from '../../types'
import { forgetProcessCache } from '@druxt/client'
import { forwardedHeaders, hostname, isDruxtRoute, proxyCookie, proxyLocation, proxyTarget, sessionHeaders, writtenResource } from '../utils/proxy'
import { holdsSession } from '../utils/session'

const payloadMethods = new Set(['PATCH', 'POST', 'PUT', 'DELETE'])

/**
 * The proxy to Drupal, for the paths the modules register with `addDruxtProxy()`: the JSON:API under each language
 * prefix, the files directory, the token and userinfo routes and the router's translate-path. The base URL is read
 * from the runtime config for each request, so a build pointed at another Drupal with `NUXT_PUBLIC_DRUXT_BASE_URL`
 * sends the browser's requests to the same Drupal as the server's.
 *
 * - The method and the headers pass through, and the body streams through unbuffered. `Host`, `Accept`
 *   and `Accept-Encoding` are not passed, as with Nitro's proxy route rules, so Drupal sees its own host.
 * - Forwarding headers the browser sent are dropped, and `X-Forwarded-For`, `X-Forwarded-Host` and
 *   `X-Forwarded-Proto` are set from the site's own view of the request. With the private
 *   `druxt.proxy.trustForwarded`, for a front proxy that sets them, the client is added to the inbound
 *   `X-Forwarded-For` chain, and the inbound host and protocol pass on.
 * - A path below Druxt's own routes, `/api/_druxt`, answers 404, never Drupal, as a request with a method its route
 *   does not take falls through to a proxy at `/api/**`.
 * - A redirect reaches the browser, never followed here, with a `Location` on Drupal's base URL moved to this site.
 * - Of the browser's cookies, only Drupal's session cookie goes to Drupal, by the cache's pattern for its name or the
 *   site's `cache.sessionCookie`, and no `Cookie` header when there is none. When the site's server holds the session,
 *   its access token goes as the `Authorization` header, unless the request sent its own, or asked for none with
 *   `X-Druxt-Auth: none`.
 * - A cookie for Drupal's host is set for this site's host. The response's encoding and length headers are
 *   recomputed, and the rest come back as Drupal sent them.
 * - A write Drupal accepts, a `POST`, `PATCH` or `DELETE` to a JSON:API resource, drops the content cache's entries
 *   for that resource, its type's collections, every Views result and the route lookups, so an anonymous render after
 *   an editor's save reads the saved entity, in a listing too. Other processes' caches are Purge's job.
 */
export default defineEventHandler((event) => {
  const baseUrl = String((useRuntimeConfig(event).public.druxt as { baseUrl?: string } | undefined)?.baseUrl || '')
  // A base URL that is not one is the deployment's fault, not the request's.
  let backend: string
  try {
    backend = new URL(baseUrl).hostname
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', message: 'The Drupal base URL is not a valid URL.' })
  }
  // Druxt's own routes are the site's, whatever the method: none of their paths reaches Drupal.
  if (isDruxtRoute(event.path)) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  const target = proxyTarget(event.path, baseUrl, routes)
  if (!target) throw createError({ statusCode: 400, statusMessage: 'Bad Request' })

  // Behind a front proxy the deployment trusts, its forwarding headers stand: never otherwise, as a browser can send them.
  const proxy = (useRuntimeConfig(event).druxt as Partial<DruxtPrivateConfig> | undefined)?.proxy
  const trust = proxy?.trustForwarded === true
  // The public host: the cookie domain too.
  const host = getRequestHost(event, { xForwardedHost: trust })
  // The session's access token, from its httpOnly cookie, as the Authorization header: the browser never holds it.
  // Not on a token request, which carries no user's token.
  const headers = sessionHeaders(forwardedHeaders(getProxyRequestHeaders(event), {
    ip: getRequestIP(event),
    host,
    protocol: getRequestProtocol(event, { xForwardedProto: trust }),
  }, trust), holdsSession(event) && !event.path.startsWith('/oauth/token'), proxy?.sessionCookie)
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
