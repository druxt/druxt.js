import { createError, deleteCookie, getRequestHeader, getRequestHost, getRequestProtocol, setCookie } from 'h3'
import type { H3Event } from 'h3'
import { parse, serialize } from 'cookie-es'
import { AUTH_STORAGE_KEYS, byteSize } from '@druxt/client'
import { useRuntimeConfig } from '#imports'
import { decodeCookie, secureSite } from '../../utils/session'
import type { DruxtPrivateConfig, DruxtPublicConfig } from '../../types'

/** The cookies that hold a session's tokens. Only the site's server can read them. */
export const TOKEN_COOKIES = [AUTH_STORAGE_KEYS.accessToken, AUTH_STORAGE_KEYS.refreshToken, AUTH_STORAGE_KEYS.clientId, AUTH_STORAGE_KEYS.expiresAt] as const

/** How long a session's cookies last: 30 days, as the browser's did. Drupal decides how long its tokens last. */
const MAX_AGE = 60 * 60 * 24 * 30

/**
 * Whether the site's server holds the browser's session.
 *
 * It does when `druxt.auth` is set with the proxy on and `exposeToken` off.
 *
 * @param event - The request.
 */
export const holdsSession = (event: H3Event): boolean =>
  !!((useRuntimeConfig(event).public.druxt as unknown as DruxtPublicConfig | undefined)?.auth as { session?: boolean } | undefined)?.session

/**
 * A session cookie's options.
 *
 * - The cookie is set on the site's own host, under the app's base URL.
 * - It is `SameSite=Lax`.
 * - It is `Secure` when the site is https. `siteUrl` says so, or the request's protocol does. Behind a front proxy,
 *   the forwarded protocol is read only with `trustForwarded`.
 *
 * @param event - The request.
 * @param httpOnly - Whether script may not read it. True for a token.
 */
export const sessionCookieOptions = (event: H3Event, httpOnly: boolean) => {
  const config = useRuntimeConfig(event)
  const druxt = config.public.druxt as unknown as DruxtPublicConfig
  const trust = (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.proxy?.trustForwarded === true
  const secure = secureSite(druxt.siteUrl, getRequestProtocol(event, { xForwardedProto: trust }))
  return { path: (config.app as { baseURL?: string } | undefined)?.baseURL || '/', sameSite: 'lax' as const, secure, httpOnly, maxAge: MAX_AGE }
}

/**
 * The host of a URL, in lower case, with its port.
 *
 * Undefined for no URL, or for one that does not parse, such as `null`.
 */
const hostOf = (url: string | undefined): string | undefined => {
  try {
    return (url && new URL(url).host.toLowerCase()) || undefined
  }
  catch {
    return undefined
  }
}

// The scheme of a URL with its colon, such as `https:`. Undefined for no URL, or for one that does not parse.
const schemeOf = (url: string | undefined): string | undefined => {
  try {
    return (url && new URL(url).protocol) || undefined
  }
  catch {
    return undefined
  }
}

/**
 * Whether the site's own pages sent the request.
 *
 * It is decided by headers that a browser sets and a page's script cannot.
 *
 * - A request with an `Origin` is the site's when that origin's host is one of: the request's own host, the forwarded
 *   host behind a front proxy named with `trustForwarded`, or the host of `siteUrl` when it is set.
 * - The origin's scheme must be the site's too, when the site's is known. `siteUrl` gives it for its own host. For
 *   the request's host, a request over https gives it. A request that reads as http may be https at a front proxy
 *   the site was not told to trust, so it decides nothing.
 * - A request with no `Origin` is the site's unless its `Sec-Fetch-Site` names another site.
 * - A request with neither header is no browser's cross-site request, so it passes.
 *
 * @param event - The request.
 */
export const sameOrigin = (event: H3Event): boolean => {
  const origin = getRequestHeader(event, 'origin')
  if (origin === undefined) {
    const site = getRequestHeader(event, 'sec-fetch-site')
    return site === undefined || site === 'same-origin' || site === 'none'
  }
  const host = hostOf(origin)
  if (!host) return false
  const config = useRuntimeConfig(event)
  const trust = (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.proxy?.trustForwarded === true
  const siteUrl = (config.public.druxt as unknown as DruxtPublicConfig | undefined)?.siteUrl
  const scheme = schemeOf(origin)
  if (host === hostOf(siteUrl)) return scheme === schemeOf(siteUrl)
  // A front proxy may forward the host with the scheme's default port, which an `Origin` never carries.
  const requested = getRequestHost(event, { xForwardedHost: trust }).toLowerCase()
  const port = scheme === 'https:' ? ':443' : scheme === 'http:' ? ':80' : undefined
  if (host !== (port && requested.endsWith(port) ? requested.slice(0, -port.length) : requested)) return false
  return getRequestProtocol(event, { xForwardedProto: trust }) !== 'https' || scheme === 'https:'
}

/**
 * Refuses a request that another site sent, with a 403.
 *
 * A route calls it before it sets or clears the session's cookies. `SameSite=Lax` limits when a cookie is sent. It
 * does not stop the answer to a cross-site form post from setting one.
 *
 * @param event - The request.
 * @throws A 403 when the request did not come from the site's own pages.
 */
export const requireSameOrigin = (event: H3Event): void => {
  if (!sameOrigin(event)) throw createError({ statusCode: 403, statusMessage: 'Cross-site request refused' })
}

/** A token response, as Simple OAuth answers it. */
export interface DruxtSessionTokens {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

/**
 * The most a browser keeps of one cookie, in bytes. The count covers its name, value and attributes.
 *
 * A browser drops a larger cookie.
 */
export const COOKIE_LIMIT = 4096

/** The code a session too large for the browser's cookies is refused with. */
export const DRUXT_E_TOKEN_COOKIE = 'DRUXT_E01007'

/** A session cookie larger than `COOKIE_LIMIT`. It has the name and the size in bytes, and never the value. */
export interface DruxtOversizedCookie {
  name: string
  bytes: number
}

/**
 * The size of a `Set-Cookie` header, as a browser counts it against `COOKIE_LIMIT`.
 *
 * The name, the value and the attributes are serialized as h3 serializes them, and counted in UTF-8 bytes. So a
 * character outside ASCII in an attribute counts for each of its bytes. A `Path` from the app's `baseURL` can hold
 * one.
 *
 * @param name - The cookie's name.
 * @param value - Its value, before encoding.
 * @param options - The options it is set with.
 *
 * @example @lang ts
 * cookieBytes('a', 'b', { path: '/' }) // 11, for 'a=b; Path=/'
 */
export const cookieBytes = (name: string, value: string, options: Parameters<typeof serialize>[2]): number =>
  byteSize(serialize(name, value, { path: '/', ...options }))

/**
 * Keeps a token response in the session's cookies.
 *
 * - The tokens are httpOnly.
 * - The marker is the one cookie the browser reads. It holds the access token's expiry, and no token.
 *
 * A browser drops a cookie past `COOKIE_LIMIT`. When any one cookie would be past it, none is set. The first such
 * cookie is returned, so the caller can refuse the sign-in.
 *
 * @param event - The request.
 * @param tokens - Simple OAuth's token response.
 * @param clientId - The Consumer that issued them, for a refresh.
 * @returns The first cookie too large to set, or undefined once every cookie is set.
 */
export const setSession = (event: H3Event, tokens: DruxtSessionTokens, clientId: string): DruxtOversizedCookie | undefined => {
  const hidden = sessionCookieOptions(event, true)
  const expiresAt = tokens.expires_in ? String(Date.now() + tokens.expires_in * 1000) : undefined
  const cookies: [string, string, ReturnType<typeof sessionCookieOptions>][] = [
    [AUTH_STORAGE_KEYS.accessToken, tokens.access_token, hidden],
    ...(tokens.refresh_token ? [[AUTH_STORAGE_KEYS.refreshToken, tokens.refresh_token, hidden] as [string, string, typeof hidden]] : []),
    [AUTH_STORAGE_KEYS.clientId, clientId, hidden],
    ...(expiresAt ? [[AUTH_STORAGE_KEYS.expiresAt, expiresAt, hidden] as [string, string, typeof hidden]] : []),
    [AUTH_STORAGE_KEYS.session, expiresAt || 'on', sessionCookieOptions(event, false)],
  ]
  for (const [name, value, options] of cookies) {
    const bytes = cookieBytes(name, value, options)
    if (bytes > COOKIE_LIMIT) return { name, bytes }
  }
  for (const [name, value, options] of cookies) setCookie(event, name, value, options)
  if (!expiresAt) deleteCookie(event, AUTH_STORAGE_KEYS.expiresAt, hidden)
  return undefined
}

/**
 * Clears every cookie of the session.
 *
 * @param event - The request.
 */
export const clearSession = (event: H3Event): void => {
  for (const name of TOKEN_COOKIES) deleteCookie(event, name, sessionCookieOptions(event, true))
  deleteCookie(event, AUTH_STORAGE_KEYS.session, sessionCookieOptions(event, false))
}

/**
 * Reads a cookie of the session, such as its refresh token.
 *
 * The browser writes its own `Cookie` header, so a value may not decode, such as a bare `%`.
 *
 * @param event - The request.
 * @param name - The cookie.
 * @returns The value, or undefined when the cookie is not set or does not decode.
 */
export const sessionCookie = (event: H3Event, name: string): string | undefined => {
  // The header is read as it was sent. h3's `getCookie()` would return a value that does not decode as it came.
  const value = parse(getRequestHeader(event, 'cookie') || '', { decode: (raw) => raw })[name]
  return (value && decodeCookie(value)) || undefined
}
