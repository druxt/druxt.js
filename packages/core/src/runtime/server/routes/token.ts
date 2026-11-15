import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import { consola } from 'consola'
import { AUTH_STORAGE_KEYS } from '@druxt/client'
import { useRuntimeConfig } from '#imports'
import type { DruxtPrivateConfig, DruxtPublicConfig } from '../../types'
import { COOKIE_LIMIT, DRUXT_E_TOKEN_COOKIE, clearSession, holdsSession, requireSameOrigin, sessionCookie, setSession } from '../utils/session'
import type { DruxtOversizedCookie, DruxtSessionTokens } from '../utils/session'

const logger = consola.withTag('druxt')

/** The token an oversized cookie holds, as the message names it. */
const TOKEN_NAMES: Record<string, string> = {
  [AUTH_STORAGE_KEYS.accessToken]: 'access token',
  [AUTH_STORAGE_KEYS.refreshToken]: 'refresh token',
}

/**
 * Why a token response was refused: which token, its cookie's size and the limit, and what to change in Drupal. It
 * names no token's value.
 *
 * @param cookie - The cookie too large to set.
 * @param refresh - Whether the response was a refresh's, which ends the session.
 */
const oversizedMessage = ({ name, bytes }: DruxtOversizedCookie, refresh: boolean): string =>
  `${DRUXT_E_TOKEN_COOKIE}: Drupal's ${TOKEN_NAMES[name] || 'token response'} makes the ${name} cookie ${bytes} bytes, `
  + `past the ${COOKIE_LIMIT} bytes a browser keeps of one cookie, so ${refresh ? 'the refresh ended the session' : 'the sign-in was refused'}. `
  + 'In Drupal, make the Simple OAuth token smaller: give it fewer scopes or shorter-lived claims, or sign it with a smaller key.'

// The grants this route makes, and the fields each takes. It attaches a
// confidential Consumer's secret when one is set, so a grant it does not name
// would get that secret attached to whatever the caller asked for. A Map, so a caller cannot
// name an inherited key such as `constructor`. As druxt-auth 0.x's middleware.
const GRANTS = new Map<string, string[]>([
  ['password', ['username', 'password', 'scope']],
  ['refresh_token', ['refresh_token', 'scope']],
  ['authorization_code', ['code', 'code_verifier', 'redirect_uri']],
])

/**
 * POST /api/_druxt/auth/token: the password grant's token requests from the
 * browser. A confidential Consumer's secret is added here, where the browser
 * never sees it, from the private runtime config or `DRUXT_AUTH_CLIENT_SECRET`.
 * With no secret, as for a public Consumer, none is sent and Drupal decides.
 * A refused request answers with Drupal's status, and its error and message
 * only. With `auth.password: false` the password grant is refused with a 400.
 *
 * When the site's server holds the session, as behind the proxy with `exposeToken` off, the route also makes the
 * authorization code grant, keeps the tokens in httpOnly cookies on the site and answers none of them, and refreshes
 * with the refresh token and the Consumer its cookies hold. A refused refresh clears the session. A sign-in, by
 * password or code, ends the session the browser had as it asks Drupal, so one that fails leaves none. As its answer
 * sets the session, the route then takes requests from the site's own pages only: one whose `Origin`, or
 * `Sec-Fetch-Site` with no `Origin`, names another site answers 403, with Drupal not asked and no cookie changed.
 *
 * A token too large for a browser's cookie, past 4096 bytes, sets no cookie: the route answers 502 with
 * `DRUXT_E01007`, as the deployment's Drupal issued a token the site cannot keep, and a refresh ends the session.
 */
export default defineEventHandler(async (event) => {
  const session = holdsSession(event)
  if (session) requireSameOrigin(event)
  const body = ((await readBody(event)) || {}) as Record<string, string | undefined>
  const fields = GRANTS.get(String(body.grant_type))
  if (!fields) throw createError({ statusCode: 400, statusMessage: 'Unsupported grant type' })
  if (body.grant_type === 'password' && (!body.username || !body.password)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid username or password' })
  }

  const config = useRuntimeConfig(event)
  const { baseUrl, auth } = config.public.druxt as unknown as DruxtPublicConfig
  if (!auth) throw createError({ statusCode: 500, statusMessage: 'The password grant is not configured.' })
  // Off with `auth.password: false`, though the route stays for the session's code grant and refresh: refused before
  // any secret is attached.
  if (body.grant_type === 'password' && auth.password === false) throw createError({ statusCode: 400, statusMessage: 'Unsupported grant type' })
  const secret = (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.auth?.clientSecret || process.env.DRUXT_AUTH_CLIENT_SECRET
  // The code grant is the browser's own, which only a session the server holds sends here.
  if (body.grant_type === 'authorization_code' && !session) throw createError({ statusCode: 400, statusMessage: 'Unsupported grant type' })

  // A sign-in replaces the session the browser had, which ends as Drupal is asked, as druxt-auth 0.x forgot the
  // stored tokens first: one Drupal refuses, or the site cannot keep, never leaves the browser as the last user.
  if (session && body.grant_type !== 'refresh_token') clearSession(event)

  // The confidential Consumer, the one the secret belongs to.
  const confidential = auth.passwordClientId || auth.clientId
  const given: Record<string, string | undefined> = { ...body }
  let clientId = body.grant_type === 'authorization_code' ? auth.clientId : confidential
  if (session && body.grant_type === 'refresh_token') {
    // The session's own refresh token and Consumer, never the browser's word for them.
    given.refresh_token = sessionCookie(event, AUTH_STORAGE_KEYS.refreshToken)
    if (!given.refresh_token) throw createError({ statusCode: 401, statusMessage: 'No session to refresh' })
    const issuer = sessionCookie(event, AUTH_STORAGE_KEYS.clientId)
    if (issuer && [auth.clientId, auth.passwordClientId].includes(issuer)) clientId = issuer
  }

  const params = new URLSearchParams({
    ...Object.fromEntries(fields.filter((field) => given[field] !== undefined).map((field) => [field, String(given[field])])),
    grant_type: String(body.grant_type),
    // Last, so a caller cannot name another Consumer for this secret.
    client_id: clientId,
    ...(secret && clientId === confidential ? { client_secret: secret } : {}),
  })

  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  setResponseStatus(event, response.status)
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (response.ok && session && typeof data.access_token === 'string') {
    const oversized = setSession(event, data as unknown as DruxtSessionTokens, clientId)
    if (oversized) {
      const refresh = body.grant_type === 'refresh_token'
      // The session's old cookies would pair a spent refresh token with a stale access token: it ends.
      if (refresh) clearSession(event)
      const message = oversizedMessage(oversized, refresh)
      logger.error(message)
      setResponseStatus(event, 502)
      return { error: 'server_error', message }
    }
    // The browser learns the session's expiry, never a token.
    return Object.fromEntries(Object.entries({ token_type: data.token_type, expires_in: data.expires_in }).filter(([, value]) => value !== undefined))
  }
  if (response.ok) return data
  // A refresh token Drupal refused is spent: the session ends.
  if (session && body.grant_type === 'refresh_token' && (response.status === 400 || response.status === 401)) clearSession(event)
  // Drupal's error and its message, without a hint or any other detail.
  return Object.fromEntries(Object.entries({ error: data.error, message: data.error_description || data.message })
    .filter(([, value]) => typeof value === 'string'))
})
