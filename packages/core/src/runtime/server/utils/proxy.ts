import { headersHaveCredentials } from '@druxt/client'
import { DRUXT_API_BASE } from '@druxt/core/routes'
import { decodeCookie } from '../../utils/session'

/** A request path as a URL resolves it, with encoded slashes and dot segments resolved, or undefined for none. */
const resolvedPath = (path: string): string | undefined => {
  if (!path.startsWith('/')) return undefined
  try {
    const raw = path.split('?')[0]!.replace(/%2f/gi, '/').replace(/%5c/gi, '\\')
    // After a host, so a leading `//` cannot be read as one.
    return new URL(`http://_${raw}`).pathname
  } catch {
    return undefined
  }
}

/** Whether a resolved path is at or below DRUXT_API_BASE. */
const inDruxtRoutes = (pathname: string): boolean => pathname === DRUXT_API_BASE || pathname.startsWith(`${DRUXT_API_BASE}/`)

/**
 * Whether a request is for a path below Druxt's own routes, under `DRUXT_API_BASE`, which the proxy never sends to
 * Drupal, though it proxies the namespace around them, such as `/api/**`. A Druxt route takes its own methods, and a
 * request with another method, or for a path no Druxt route has, would otherwise fall through to the proxy.
 *
 * @param path - The request's path and query.
 *
 * @example @lang ts
 * isDruxtRoute('/api/_druxt/auth/token') // true
 */
export const isDruxtRoute = (path: string): boolean => {
  const pathname = resolvedPath(path)
  return pathname !== undefined && inDruxtRoutes(pathname)
}

/**
 * Where the proxy sends a request: the same path and query on Drupal's base URL, when the path is one of the proxied
 * routes and not below Druxt's own, else undefined. A route is a path, or ends in `/**` for everything below it. The path is compared as a URL
 * would resolve it, with encoded slashes and dot segments resolved, so `/jsonapi/%2e%2e/user/login` is not below
 * `/jsonapi`, and a leading `//` is a path, never a host. As Nitro's proxy route rules did.
 *
 * @param path - The request's path and query.
 * @param baseUrl - Drupal's base URL, read at request time.
 * @param routes - The proxied routes.
 *
 * @example @lang ts
 * proxyTarget('/jsonapi/node/page?page[limit]=1', 'https://drupal.test', ['/jsonapi/**'])
 * // 'https://drupal.test/jsonapi/node/page?page[limit]=1'
 */
export const proxyTarget = (path: string, baseUrl: string, routes: readonly string[]): string | undefined => {
  const pathname = resolvedPath(path)
  if (pathname === undefined || inDruxtRoutes(pathname)) return undefined
  const matched = routes.some((route) => {
    if (!route.endsWith('/**')) return pathname === route
    const base = route.slice(0, -3)
    return pathname === base || pathname.startsWith(`${base}/`)
  })
  if (!matched) return undefined
  return `${baseUrl.replace(/\/+$/, '')}${path}`
}

/**
 * A redirect's `Location` as the browser should follow it: a URL on Drupal's base URL becomes the same path on this
 * site, which the proxy or the site answers. Any other location is left as Drupal sent it.
 *
 * @param location - The `Location` Drupal sent.
 * @param baseUrl - Drupal's base URL.
 *
 * @example @lang ts
 * proxyLocation('https://drupal.test/user/1?check_logged_in=1', 'https://drupal.test')
 * // '/user/1?check_logged_in=1'
 */
export const proxyLocation = (location: string, baseUrl: string): string => {
  let base: URL
  let url: URL
  try {
    base = new URL(`${baseUrl.replace(/\/+$/, '')}/`)
    url = new URL(location, base)
  } catch {
    return location
  }
  // A relative location resolves on Drupal's host, which is the case to rewrite only when it was written absolute.
  if (!/^[a-z][a-z\d+.-]*:|^\/\//i.test(location)) return location
  if (url.origin !== base.origin || !(`${url.pathname}/`.startsWith(base.pathname))) return location
  // One leading slash, so a path such as `//elsewhere.test/x` on Drupal stays on this site rather than naming a host.
  return `/${url.pathname.slice(base.pathname.length).replace(/^[/\\]+/, '')}${url.search}${url.hash}`
}

/** What the site knows about a request, from its own connection rather than from the request's headers. */
export interface ProxyClient {
  ip?: string
  host: string
  protocol: string
}

/**
 * The headers to send Drupal: the request's own, without any forwarding header the browser sent, which it could
 * forge, and with `X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Proto` from the site's own view of the
 * request. `X-Forwarded-Port`, `X-Forwarded-Server` and `X-Real-IP` are dropped too. Behind a front proxy the site
 * trusts, `trustForwarded` keeps the inbound `X-Forwarded-For` chain and adds the client to it, keeps those three, and
 * the caller passes the inbound host and protocol in `client`. `Forwarded` is dropped either way.
 *
 * @param headers - The request's headers, as h3 passes them on to a proxy.
 * @param client - The client's address, and the host and protocol the site was reached on.
 * @param trustForwarded - Whether a trusted front proxy set the inbound forwarding headers.
 *
 * @example @lang ts
 * forwardedHeaders({ 'x-forwarded-for': '1.2.3.4' }, { ip: '10.0.0.1', host: 'site.test', protocol: 'https' })
 * // { 'x-forwarded-for': '10.0.0.1', 'x-forwarded-host': 'site.test', 'x-forwarded-proto': 'https' }
 */
export const forwardedHeaders = (headers: Record<string, string | undefined>, client: ProxyClient, trustForwarded = false): Record<string, string> => {
  const sent: Record<string, string> = {}
  let chain: string | undefined
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) continue
    if (/^x-forwarded-for$/i.test(name)) chain = value
    if (/^(?:x-forwarded-(?:for|host|proto)|forwarded)$/i.test(name)) continue
    if (!trustForwarded && /^(?:x-forwarded-(?:port|server)|x-real-ip)$/i.test(name)) continue
    sent[name.toLowerCase()] = value
  }
  const chained = trustForwarded && chain?.trim() ? [chain.trim(), client.ip].filter(Boolean).join(', ') : client.ip
  if (chained) sent['x-forwarded-for'] = chained
  sent['x-forwarded-host'] = client.host
  sent['x-forwarded-proto'] = client.protocol
  return sent
}

/**
 * A host without its port: `site.test` for `site.test:3000`, `[::1]` for `[::1]:3000`, and a bare IPv6 address as it
 * is.
 *
 * @param host - A host, with or without a port.
 *
 * @example @lang ts
 * hostname('[::1]:3000') // '[::1]'
 */
export const hostname = (host: string): string => {
  if (host.startsWith('[')) return host.slice(0, host.indexOf(']') + 1) || host
  // More than one colon is an IPv6 address without brackets, which has no port.
  if (host.indexOf(':') !== host.lastIndexOf(':')) return host
  return host.replace(/:\d*$/, '')
}

/**
 * A `Set-Cookie` header with a `Domain` on Drupal's host, with or without a leading dot and in any case, set for the
 * site's host instead. Any other domain is left as it is.
 *
 * @param cookie - One `Set-Cookie` header.
 * @param backend - Drupal's host name.
 * @param site - The site's host name.
 *
 * @example @lang ts
 * proxyCookie('s=1; Domain=.Drupal.test; Path=/', 'drupal.test', 'site.test')
 * // 's=1; Domain=site.test; Path=/'
 */
export const proxyCookie = (cookie: string, backend: string, site: string): string =>
  cookie.replace(/(;\s*domain=)([^;]*)/gi, (match, prefix: string, domain: string) =>
    domain.trim().replace(/^\./, '').toLowerCase() === backend.toLowerCase() ? `${prefix}${site}` : match)

/** The prefix of the cookies Druxt keeps a session in, which only the site reads. */
const SESSION_COOKIE = /^druxt\.auth\./

/**
 * Whether one cookie of a `Cookie` header is Drupal's session cookie, by the cache's test for one: Drupal's
 * `S?SESS<hash>` name, or the site's `cache.sessionCookie` pattern in its place. The caller has already taken out
 * Druxt's own cookies, which that test counts too.
 */
const isDrupalSessionCookie = (part: string, sessionCookie?: string): boolean =>
  headersHaveCredentials({ cookie: part }, sessionCookie || undefined)

/**
 * The headers to send Drupal for the browser's session. Of the browser's cookies, only Drupal's own session cookie
 * goes, so the site's other cookies, such as nuxt-auth-utils' `nuxt-session`, and Druxt's session cookies, which are
 * the site's, never reach Drupal, and no `Cookie` header goes when none is Drupal's. When the site's server holds the
 * session, its access token goes as the `Authorization` header, so the browser never holds it. A request that sent
 * its own `Authorization` keeps it, and one sent with `X-Druxt-Auth: none`, as a request made without auth is, gets
 * no credentials. `X-Druxt-Auth` is not passed on. A token cookie that does not decode, such as a bare `%`, is no
 * token.
 *
 * @param headers - The headers to send, lower-cased, as `forwardedHeaders()` gives them.
 * @param session - Whether the site's server holds the session.
 * @param sessionCookie - The site's pattern for Drupal's session cookie name, `cache.sessionCookie`, if it set one.
 *
 * @example @lang ts
 * sessionHeaders({ cookie: 'druxt.auth.access_token=abc; SESS1=x; theme=dark' }, true)
 * // { cookie: 'SESS1=x', authorization: 'Bearer abc' }
 */
export const sessionHeaders = (headers: Record<string, string>, session: boolean, sessionCookie?: string): Record<string, string> => {
  const { cookie, 'x-druxt-auth': ask, ...rest } = headers
  let token: string | undefined
  const kept = (cookie || '').split(';').map((part) => part.trim()).filter((part) => {
    if (!part) return false
    const name = part.slice(0, part.indexOf('=') >>> 0).trim()
    if (SESSION_COOKIE.test(name)) {
      // A token that does not decode is none: the request goes on without one.
      if (name === 'druxt.auth.access_token') token = decodeCookie(part.slice(part.indexOf('=') + 1))
      return false
    }
    return isDrupalSessionCookie(part, sessionCookie)
  })
  const sent: Record<string, string> = { ...(kept.length ? { cookie: kept.join('; ') } : {}), ...rest }
  if (session && token && ask !== 'none' && !Object.keys(rest).includes('authorization')) sent.authorization = `Bearer ${token}`
  return sent
}

/**
 * What a write through the proxy makes stale in the content cache: a test of a content cache key, for a successful
 * `POST`, `PATCH` or `DELETE` to a JSON:API resource. The resource's own documents go, under every language prefix
 * and query, so do the collections of its type, which may list it, every JSON:API Views result, which names no entity
 * and may list it, and the route lookups, as a save can change an alias. Another resource's document stays. A write
 * elsewhere, such as the token route, makes nothing stale. Caches on other processes are Purge's job.
 *
 * @param path - The written path on the site, such as `/es/jsonapi/node/recipe/<uuid>`.
 * @param endpoint - The JSON:API endpoint, `/jsonapi`.
 * @returns The test, or undefined when the path is no JSON:API resource.
 *
 * @example @lang ts
 * const stale = writtenResource('/jsonapi/node/recipe/8aa2ce58-4b7f-4190-8c3d-e81b567efe85', '/jsonapi')
 * stale(JSON.stringify([indexKey, '/jsonapi/node/recipe?page[limit]=10'])) // true
 */
export const writtenResource = (path: string, endpoint: string): ((key: string) => boolean) | undefined => {
  const pathname = path.split(/[?#]/)[0] || ''
  const at = pathname.indexOf(`${endpoint}/`)
  if (at < 0) return undefined
  const [entity, bundle, id] = pathname.slice(at + endpoint.length + 1).split('/')
  if (!entity || !bundle) return undefined
  const collection = `${endpoint}/${entity}/${bundle}`
  return (key) => {
    let url: string
    try {
      url = String((JSON.parse(key) as unknown[])[1] ?? '')
    } catch {
      return false
    }
    const stored = url.split(/[?#]/)[0] || ''
    // A Views result names no entity, so any write may change any listing: every one goes.
    if (stored.includes('/router/translate-path') || stored.includes(`${endpoint}/views/`)) return true
    if (id && url.includes(id)) return true
    // The type's collections, under any prefix. Another resource's document stays.
    return stored.endsWith(collection)
  }
}
