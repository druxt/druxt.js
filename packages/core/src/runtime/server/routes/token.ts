import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import { consola } from 'consola'
import { digest } from 'ohash'
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
/** Drupal's answer to a token request. */
interface Redeemed {
  status: number
  ok: boolean
  data: Record<string, unknown>
}

// How long a redeemed refresh token's answer is kept, from when Drupal gave it, for a refresh that was sent before
// the browser had the new one.
const REDEEMED_FOR = 10_000

// The refresh tokens being redeemed or just redeemed, by a digest, with Drupal's answer. `settled` is when Drupal
// answered, and is unset until it does. Kept in this process only: with several processes, two refreshes that reach
// different ones are not joined.
const redeeming = new Map<string, { settled?: number, answer: Promise<Redeemed> }>()

/**
 * Redeems a refresh token once, for every request that asks within a short time.
 *
 * Drupal takes a refresh token once. Two requests with one token would otherwise get one new session and one refusal,
 * and the refusal would clear the cookies the other had set.
 *
 * A request joins one that Drupal has not answered yet, however long that takes. The answer is then kept for ten
 * seconds when it decided the token: a new session, or a refusal with a 400 or a 401. Any other answer redeemed
 * nothing, such as a 503, and so does a request that never reached Drupal. Neither is kept, and the next request asks
 * again.
 *
 * @param key - A digest that names the Drupal, the Consumer and the refresh token.
 * @param redeem - Asks Drupal.
 */
const redeemOnce = (key: string, redeem: () => Promise<Redeemed>): Promise<Redeemed> => {
  const now = Date.now()
  for (const [held, { settled }] of redeeming) {
    if (settled !== undefined && now - settled > REDEEMED_FOR) redeeming.delete(held)
  }
  const held = redeeming.get(key)
  if (held) return held.answer
  const answer = redeem()
  const entry: { settled?: number, answer: Promise<Redeemed> } = { answer }
  redeeming.set(key, entry)
  const forget = () => {
    if (redeeming.get(key) === entry) redeeming.delete(key)
  }
  answer.then((redeemed) => {
    if (redeemed.ok || redeemed.status === 400 || redeemed.status === 401) entry.settled = Date.now()
    else forget()
  }, forget)
  return answer
}

export default defineEventHandler(async (event) => {
  const session = holdsSession(event)
  if (session) requireSameOrigin(event)
  const body = ((await readBody(event)) || {}) as Record<string, string | undefined>
  // The grant is a string. A list of one would read as its item here, and then match none of the checks below.
  const fields = typeof body.grant_type === 'string' ? GRANTS.get(body.grant_type) : undefined
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

  const redeem = async (): Promise<Redeemed> => {
    const answer = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      // A redirect that keeps the method would send the body, with its secret, password or refresh token, on to its
      // target. None is followed.
      redirect: 'manual',
    })
    if (answer.status >= 300 && answer.status < 400) {
      return { status: 502, ok: false, data: { error: 'server_error', error_description: 'The token endpoint answered with a redirect, which is not followed.' } }
    }
    return { status: answer.status, ok: answer.ok, data: (await answer.json().catch(() => ({}))) as Record<string, unknown> }
  }
  // A session's refresh token is redeemed once. Refreshes that overlap, as two tabs send, share Drupal's one answer.
  const response = await (session && body.grant_type === 'refresh_token' ? redeemOnce(digest(JSON.stringify([baseUrl, clientId, given.refresh_token])), redeem) : redeem())
  setResponseStatus(event, response.status)
  const { data } = response
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
  // A 200 with no token, such as an HTML page, signed nobody in.
  if (response.ok && session) {
    setResponseStatus(event, 502)
    return { error: 'server_error', message: 'The token endpoint answered with no access token.' }
  }
  if (response.ok) return data
  // A refresh token that Drupal refused is spent, so the session ends.
  if (session && body.grant_type === 'refresh_token' && (response.status === 400 || response.status === 401)) clearSession(event)
  // Only Drupal's error and its message are returned, without a hint or any other detail.
  return Object.fromEntries(Object.entries({ error: data.error, message: data.error_description || data.message })
    .filter(([, value]) => typeof value === 'string'))
})
