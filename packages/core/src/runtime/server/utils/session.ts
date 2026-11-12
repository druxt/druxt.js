import { deleteCookie, getRequestHeader, getRequestProtocol, setCookie } from 'h3'
import type { H3Event } from 'h3'
import { parse, serialize } from 'cookie-es'
import { AUTH_STORAGE_KEYS, byteSize } from '@druxt/client'
import { useRuntimeConfig } from '#imports'
import { decodeCookie, secureSite } from '../../utils/session'
import type { DruxtPrivateConfig, DruxtPublicConfig } from '../../types'

/** The cookies that hold a session's tokens, readable by the site's server alone. */
export const TOKEN_COOKIES = [AUTH_STORAGE_KEYS.accessToken, AUTH_STORAGE_KEYS.refreshToken, AUTH_STORAGE_KEYS.clientId, AUTH_STORAGE_KEYS.expiresAt] as const

/** How long a session's cookies last, as the browser's did: 30 days. Drupal decides how long its tokens do. */
const MAX_AGE = 60 * 60 * 24 * 30

/**
 * Whether the site's server holds the browser's session: `druxt.auth` with the proxy on and `exposeToken` off.
 *
 * @param event - The request.
 */
export const holdsSession = (event: H3Event): boolean =>
  !!((useRuntimeConfig(event).public.druxt as unknown as DruxtPublicConfig | undefined)?.auth as { session?: boolean } | undefined)?.session

/**
 * A session cookie's options: on the site's own host, under the app's base URL, `SameSite=Lax`, and `Secure` when
 * the site is https, by `siteUrl` or by the request's protocol, which a front proxy names with `trustForwarded`.
 *
 * @param event - The request.
 * @param httpOnly - Whether script may not read it: true for a token.
 */
export const sessionCookieOptions = (event: H3Event, httpOnly: boolean) => {
  const config = useRuntimeConfig(event)
  const druxt = config.public.druxt as unknown as DruxtPublicConfig
  const trust = (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.proxy?.trustForwarded === true
  const secure = secureSite(druxt.siteUrl, getRequestProtocol(event, { xForwardedProto: trust }))
  return { path: (config.app as { baseURL?: string } | undefined)?.baseURL || '/', sameSite: 'lax' as const, secure, httpOnly, maxAge: MAX_AGE }
}

/** A token response, as Simple OAuth answers it. */
export interface DruxtSessionTokens {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

/** The most a browser keeps of one cookie: its name, value and attributes, in bytes. A larger one is dropped. */
export const COOKIE_LIMIT = 4096

/** The code a session too large for the browser's cookies is refused with. */
export const DRUXT_E_TOKEN_COOKIE = 'DRUXT_E01007'

/** A cookie of the session past `COOKIE_LIMIT`: its name and its size in bytes, never its value. */
export interface DruxtOversizedCookie {
  name: string
  bytes: number
}

/**
 * The size of a `Set-Cookie` header as a browser counts it against `COOKIE_LIMIT`: the name, the value and the
 * attributes, serialized as h3 serializes them, in UTF-8 bytes, so a character outside ASCII in an attribute, such as
 * a `Path` from the app's `baseURL`, counts for each of its bytes.
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
 * Keeps a token response in the session's cookies: the tokens httpOnly, and the marker the browser reads, the
 * access token's expiry, with no token in it. When any one cookie would be past `COOKIE_LIMIT`, which a browser
 * drops, none is set, and the first such cookie is returned, for the caller to refuse the sign-in.
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
 * A cookie of the session, such as its refresh token, or undefined for none, or for one that does not decode, such as
 * a bare `%`: the browser writes its own `Cookie` header.
 *
 * @param event - The request.
 * @param name - The cookie.
 */
export const sessionCookie = (event: H3Event, name: string): string | undefined => {
  // Read as sent: h3's getCookie() keeps a value that does not decode as it came.
  const value = parse(getRequestHeader(event, 'cookie') || '', { decode: (raw) => raw })[name]
  return (value && decodeCookie(value)) || undefined
}
