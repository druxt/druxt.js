import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import { consola } from 'consola'
import { AUTH_STORAGE_KEYS } from '@druxt/client'
import { useRuntimeConfig } from '#imports'
import type { DruxtPrivateConfig, DruxtPublicConfig } from '../../types'
import { COOKIE_LIMIT, DRUXT_E_TOKEN_COOKIE, clearSession, holdsSession, requireSameOrigin, sessionCookie, setSession } from '../utils/session'
import type { DruxtOversizedCookie, DruxtSessionTokens } from '../utils/session'

const logger = consola.withTag('druxt')

/** The name the message gives the token an oversized cookie holds. */
const TOKEN_NAMES: Record<string, string> = {
  [AUTH_STORAGE_KEYS.accessToken]: 'access token',
  [AUTH_STORAGE_KEYS.refreshToken]: 'refresh token',
}

/**
 * The message that says why a token response was refused.
 *
 * It says which token, its cookie's size and the limit, and what to change in Drupal. It names no token's value.
 *
 * @param cookie - The cookie too large to set.
 * @param refresh - Whether the response was a refresh's. An oversized refresh ends the session.
 */
const oversizedMessage = ({ name, bytes }: DruxtOversizedCookie, refresh: boolean): string =>
  `${DRUXT_E_TOKEN_COOKIE}: Drupal's ${TOKEN_NAMES[name] || 'token response'} makes the ${name} cookie ${bytes} bytes, `
  + `past the ${COOKIE_LIMIT} bytes a browser keeps of one cookie, so ${refresh ? 'the refresh ended the session' : 'the sign-in was refused'}. `
  + 'In Drupal, make the Simple OAuth token smaller: give it fewer scopes or shorter-lived claims, or sign it with a smaller key.'

// The grants this route makes, and the fields each takes.
//
// The route attaches a confidential Consumer's secret when one is set. A grant it did not name would get that secret
// attached to whatever the caller asked for, so only these grants are made. druxt-auth 0.x's middleware did the same.
//
// It is a Map so a caller cannot name an inherited key, such as `constructor`.
const GRANTS = new Map<string, string[]>([
  ['password', ['username', 'password', 'scope']],
  ['refresh_token', ['refresh_token', 'scope']],
  ['authorization_code', ['code', 'code_verifier', 'redirect_uri']],
])

/**
 * POST /api/_druxt/auth/token: the token requests the browser makes for the password grant.
 *
 * A confidential Consumer's secret is added here, where the browser never sees it. It comes from the private runtime
 * config or `DRUXT_AUTH_CLIENT_SECRET`. With no secret, as for a public Consumer, none is sent and Drupal decides.
 *
 * A refused request answers with Drupal's status, and only its error and message. With `auth.password: false` the
 * password grant is refused with a 400.
 *
 * When the site's server holds the session, as behind the proxy with `exposeToken` off, the route does more:
 *
 * - It also makes the authorization code grant.
 * - It keeps the tokens in httpOnly cookies on the site, and answers none of them.
 * - It refreshes with the refresh token and the Consumer that its cookies hold. A refused refresh clears the
 *   session.
 * - A sign-in, by password or by code, ends the session the browser had as it asks Drupal. So a sign-in that fails
 *   leaves no session.
 * - Its answer sets the session, so it takes requests from the site's own pages only. A request whose `Origin` names
 *   another site answers 403. So does one with no `Origin` whose `Sec-Fetch-Site` names another site. Drupal is not
 *   asked, and no cookie is changed.
 *
 * A token too large for a browser's cookie, past 4096 bytes, sets no cookie. The route answers 502 with
 * `DRUXT_E01007`, because the deployment's Drupal issued a token the site cannot keep. An oversized refresh ends
 * the session.
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
  // `auth.password: false` turns the password grant off. The route stays, for the session's code grant and refresh.
  // The grant is refused here, before any secret is attached.
  if (body.grant_type === 'password' && auth.password === false) throw createError({ statusCode: 400, statusMessage: 'Unsupported grant type' })
  const secret = (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.auth?.clientSecret || process.env.DRUXT_AUTH_CLIENT_SECRET
  // The code grant is made in the browser. It is sent here only for a session the server holds.
  if (body.grant_type === 'authorization_code' && !session) throw createError({ statusCode: 400, statusMessage: 'Unsupported grant type' })

  // A sign-in replaces the session the browser had. That session ends here, as Drupal is asked, just as druxt-auth
  // 0.x forgot the stored tokens first. A sign-in that Drupal refuses, or whose tokens the site cannot keep, then
  // never leaves the browser signed in as the last user.
  if (session && body.grant_type !== 'refresh_token') clearSession(event)

  // The confidential Consumer. The secret belongs to this one.
  const confidential = auth.passwordClientId || auth.clientId
  const given: Record<string, string | undefined> = { ...body }
  let clientId = body.grant_type === 'authorization_code' ? auth.clientId : confidential
  if (session && body.grant_type === 'refresh_token') {
    // The refresh token and the Consumer come from the session's own cookies, never from what the browser says.
    given.refresh_token = sessionCookie(event, AUTH_STORAGE_KEYS.refreshToken)
    if (!given.refresh_token) throw createError({ statusCode: 401, statusMessage: 'No session to refresh' })
    const issuer = sessionCookie(event, AUTH_STORAGE_KEYS.clientId)
    if (issuer && [auth.clientId, auth.passwordClientId].includes(issuer)) clientId = issuer
  }

  const params = new URLSearchParams({
    ...Object.fromEntries(fields.filter((field) => given[field] !== undefined).map((field) => [field, String(given[field])])),
    grant_type: String(body.grant_type),
    // `client_id` is set last, so a caller cannot name another Consumer for this secret.
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
      // The session ends. Its old cookies would pair a spent refresh token with a stale access token.
      if (refresh) clearSession(event)
      const message = oversizedMessage(oversized, refresh)
      logger.error(message)
      setResponseStatus(event, 502)
      return { error: 'server_error', message }
    }
    // The browser learns when the session expires. It never gets a token.
    return Object.fromEntries(Object.entries({ token_type: data.token_type, expires_in: data.expires_in }).filter(([, value]) => value !== undefined))
  }
  if (response.ok) return data
  // A refresh token that Drupal refused is spent, so the session ends.
  if (session && body.grant_type === 'refresh_token' && (response.status === 400 || response.status === 401)) clearSession(event)
  // Only Drupal's error and its message are returned, without a hint or any other detail.
  return Object.fromEntries(Object.entries({ error: data.error, message: data.error_description || data.message })
    .filter(([, value]) => typeof value === 'string'))
})
