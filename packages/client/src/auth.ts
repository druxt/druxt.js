// OAuth 2 against Drupal's Simple OAuth, for DruxtClient.
//
// It covers the authorization code grant with PKCE, the password grant, the client credentials grant, token refresh,
// and recovery from tokens that Drupal revoked. It has no framework dependency. Token storage is pluggable, so it
// runs in Node, a browser or a Nuxt app.
//
// The behaviour follows druxt-auth 0.x: its @nuxtjs/auth-next schemes and its refresh plugin.
import type { DruxtClient } from './client'
import type { AuthStorage, DruxtAuthOptions } from './types'
import { supersededError } from './utils/superseded'

/** The storage keys. They are exported so a framework can prepare its storage for them. */
export const KEYS = {
  accessToken: 'druxt.auth.access_token',
  refreshToken: 'druxt.auth.refresh_token',
  expiresAt: 'druxt.auth.expires_at',
  clientId: 'druxt.auth.client_id',
  /**
   * Whether a session is signed in, in a form the browser can read.
   *
   * Its value is the access token's expiry in milliseconds, or `on` for a token that does not expire. It holds no
   * token. In session mode, the browser's client reads only this key.
   */
  session: 'druxt.auth.session',
} as const

/** Simple OAuth's token response. */
export interface TokenResponse {
  token_type?: string
  access_token: string
  refresh_token?: string
  expires_in?: number
}

/** OpenID Connect userinfo, as Simple OAuth answers it. */
export interface UserInfo {
  sub: string
  name?: string
  preferred_username?: string
  email?: string
  [claim: string]: unknown
}

/** Creates token storage held in memory. This is the default storage. */
export const memoryStorage = (): AuthStorage => {
  const values = new Map<string, string | number | undefined>()
  return {
    get: (key) => values.get(key),
    set: (key, value) => { values.set(key, value) },
    remove: (key) => { values.delete(key) },
  }
}

/** Encodes bytes as base64url, with no padding. */
const base64Url = (bytes: ArrayBuffer | Uint8Array): string => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** Makes a random URL-safe string of `length` characters. */
const randomString = (length = 64): string => (
  base64Url(globalThis.crypto.getRandomValues(new Uint8Array(length))).slice(0, length)
)

/** Creates a PKCE verifier and its S256 challenge. */
export const createPkce = async (): Promise<{ verifier: string, challenge: string }> => {
  const verifier = randomString(64)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return { verifier, challenge: base64Url(digest) }
}

/**
 * Whether a refresh failed because Drupal refused the refresh token.
 *
 * Drupal refuses with a 400 or a 401, and the session is then over. A timeout, a 5xx or the refresh limit says
 * nothing about the token, so the session is kept for those.
 *
 * @param error - What the refresh rejected with.
 */
export const refreshRefused = (error: unknown): boolean => {
  const status = (error as { response?: { status?: number } } | undefined)?.response?.status
  return status === 400 || status === 401
}

/** The auth options, with the defaults applied. */
type Options = DruxtAuthOptions
  & Required<Pick<DruxtAuthOptions, 'tokenUrl' | 'authorizeUrl' | 'userInfoUrl' | 'storage'>>
  & {
    refresh: { grace: number, limit: number, window: number, share?: NonNullable<DruxtAuthOptions['refresh']>['share'] }
  }

/**
 * The OAuth side of a DruxtClient.
 *
 * It holds one session at a time. {@link DruxtAuth.epoch} is a number that names the session held.
 *
 * The epoch moves when a session ends: on a sign-out, on a refresh that Drupal refused, and when a sign-in starts. A
 * sign-in ends the session held as it starts, not when its own tokens arrive. The epoch moves again when a sign-in
 * stores its tokens. A refresh keeps the session, and the epoch.
 *
 * Work done for a session belongs to the epoch it started in. That covers a refresh's answer and its grace, the
 * refresh in flight that callers join, a request's refresh and retry after a 401, and a sign-in's tokens. Once the
 * epoch has moved, that work stores nothing, and is not done again as the session now held.
 *
 * Another client can write the same storage, which the epoch cannot see. {@link DruxtAuth.held} covers that case.
 */
export class DruxtAuth {
  /** The client this auth belongs to. */
  client: DruxtClient

  /** The options, with the defaults applied. */
  options: Options

  /** Where the tokens are kept. */
  storage: AuthStorage

  /** The session's refresh in flight, which concurrent callers join. Null when none runs. */
  refreshing: Promise<TokenResponse> | null

  /** When the session's last refresh succeeded, in milliseconds. 0 when it has not refreshed. */
  refreshedAt: number

  /**
   * When each recent refresh attempt started, in milliseconds.
   *
   * The attempts outlast a session, so a loop of sign-ins is held to the same limit as one session.
   */
  attempts: number[]

  /** The session's number, which {@link DruxtAuth.epoch} returns. */
  private generation = 0

  /**
   * Creates the auth for a client.
   *
   * @param client - The DruxtClient.
   * @param options - Auth options; see {@link DruxtAuthOptions}.
   * @throws When the options have no `clientId`.
   */
  constructor(client: DruxtClient, options: DruxtAuthOptions) {
    if (!options || !options.clientId) throw new Error('DruxtAuth requires a clientId.')

    this.client = client
    this.options = {
      scope: undefined,
      tokenUrl: '/oauth/token',
      authorizeUrl: '/oauth/authorize',
      userInfoUrl: '/oauth/userinfo',
      storage: memoryStorage(),
      ...options,
      refresh: { grace: 5000, limit: 3, window: 30000, ...options.refresh },
    } as Options
    this.storage = this.options.storage

    this.refreshing = null
    this.refreshedAt = 0
    this.attempts = []
  }

  /**
   * The number of the session this client holds.
   *
   * It moves when the session ends, and when a sign-in stores its tokens. It never moves on a refresh. A request is
   * refreshed, sent and retried only while the epoch is the one the request was made in.
   */
  get epoch(): number {
    return this.generation
  }

  /** Whether the client is in session mode: the site's server holds the tokens, and this client only a marker. */
  get session(): boolean {
    return !!this.options.session
  }

  /** The access token. Undefined in session mode, where the site's server holds it. */
  get accessToken(): string | undefined {
    if (this.session) return undefined
    const value = this.storage.get(KEYS.accessToken)
    return value ? String(value) : undefined
  }

  /** The refresh token. Undefined in session mode, where the site's server holds it. */
  get refreshToken(): string | undefined {
    if (this.session) return undefined
    const value = this.storage.get(KEYS.refreshToken)
    return value ? String(value) : undefined
  }

  /**
   * Whether a session is held.
   *
   * A session is a stored token, or in session mode, the session marker. Drupal may still reject it.
   */
  get loggedIn(): boolean {
    if (this.session) return !!this.storage.get(KEYS.session)
    return !!(this.accessToken || this.refreshToken)
  }

  /** Whether the session can be refreshed. It needs a refresh token, or in session mode, a session. */
  get canRefresh(): boolean {
    return this.session ? this.loggedIn : !!this.refreshToken
  }

  /** Whether the access token is past its expiry. A token with no expiry never is. */
  get expired(): boolean {
    const at = Number(this.storage.get(this.session ? KEYS.session : KEYS.expiresAt) || 0)
    return !!at && Date.now() >= at
  }

  /**
   * Stores a token response.
   *
   * @param data - Simple OAuth's token response.
   * @param clientId - The Consumer that issued it, kept for the refresh.
   * @param refreshed - Whether it answers a refresh. A refresh that issues no new refresh token keeps the old one.
   */
  setTokens(data: TokenResponse, clientId?: string, refreshed = false): void {
    // In session mode the site's server has set the token cookies. The browser keeps the marker alone.
    if (this.session) {
      this.storage.set(KEYS.session, data.expires_in ? String(Date.now() + data.expires_in * 1000) : 'on')
      return
    }

    this.storage.set(KEYS.accessToken, data.access_token)
    if (clientId) this.storage.set(KEYS.clientId, clientId)

    // RFC 6749 section 6: a refresh that issues no new refresh token keeps the old one. A sign-in that issues none
    // has none, so the last user's refresh token is removed.
    if (data.refresh_token) this.storage.set(KEYS.refreshToken, data.refresh_token)
    else if (!refreshed) this.storage.remove(KEYS.refreshToken)

    // A token without `expires_in` does not expire, whatever the last one did.
    if (data.expires_in) this.storage.set(KEYS.expiresAt, String(Date.now() + data.expires_in * 1000))
    else this.storage.remove(KEYS.expiresAt)
  }

  /**
   * Takes a snapshot of what the storage holds for the session.
   *
   * Two snapshots that differ are two sessions, so a later snapshot shows whether another session was stored since.
   * The snapshot holds the tokens. Never log it.
   *
   * @returns The snapshot.
   */
  held(): string {
    return JSON.stringify([KEYS.accessToken, KEYS.refreshToken, KEYS.session].map((key) => this.storage.get(key) ?? null))
  }

  /**
   * Ends a session that Drupal refused a request for, when it has no refresh token to try.
   *
   * Only that session ends. A session stored since the request was sent is another session, and is kept.
   *
   * @param sent - What the storage held as the request was sent, from {@link DruxtAuth.held}.
   */
  drop(sent: string): void {
    if (this.held() === sent) this.clearTokens()
  }

  /** Ends the session. It forgets the tokens, the refresh in flight and the refresh grace, and moves the epoch on. */
  clearTokens(): void {
    this.generation++
    this.refreshing = null
    this.refreshedAt = 0
    for (const key of Object.values(KEYS)) this.storage.remove(key)
  }

  /**
   * Signs in: posts a grant to the token endpoint, and stores its tokens.
   *
   * It ends the session held as it starts. So a sign-in that fails leaves no session, as in druxt-auth 0.x. A client
   * that stores its own tokens sends nothing as the last user while the sign-in runs.
   *
   * In session mode, the last session is in the site's cookies. The site's proxy adds it to requests until the
   * sign-in at `tokenUrl` answers. Druxt's Nuxt module does not start a sign-in while a session is held.
   *
   * A later sign-in, or a sign-out, replaces a sign-in that is still running. The replaced sign-in stores nothing.
   * When Drupal had issued its tokens, it rejects with an error that `isSuperseded()` identifies. When it failed, it
   * rejects with its own error.
   *
   * @param fields - The grant's fields.
   * @param clientId - The Consumer, `clientId` by default.
   * @returns Simple OAuth's token response.
   */
  async requestToken(
    fields: Record<string, string | undefined>,
    clientId: string = this.options.clientId,
  ): Promise<TokenResponse> {
    // A visitor who signs in as someone else is no longer the last user, whatever Drupal answers.
    this.clearTokens()
    const mine = this.generation

    const data = await this.postToken(fields, clientId)
    if (this.generation !== mine) throw supersededError()

    // The tokens start a new session. The epoch moves, so work begun while no session was held is not done again as
    // this one.
    this.generation++
    this.setTokens(data, clientId)
    return data
  }

  /**
   * Posts a grant to the token endpoint. It stores nothing.
   *
   * @param fields - The grant's fields.
   * @param clientId - The Consumer.
   * @returns Simple OAuth's token response.
   */
  private async postToken(fields: Record<string, string | undefined>, clientId: string): Promise<TokenResponse> {
    // The secret belongs to the confidential Consumer alone. That is the password grant's Consumer when one is set,
    // and the only Consumer otherwise.
    const confidential = clientId === (this.options.passwordClientId || this.options.clientId)
    const body = new URLSearchParams({
      ...Object.fromEntries(Object.entries(fields).filter((entry): entry is [string, string] => entry[1] !== undefined)),
      client_id: clientId,
      ...(confidential && this.options.clientSecret ? { client_secret: this.options.clientSecret } : {}),
    })
    const url = confidential && this.options.passwordTokenUrl ? this.options.passwordTokenUrl : this.options.tokenUrl

    // Sent with `auth: false`, because a token request must not carry the user's token.
    const { data } = await this.client.request<TokenResponse>(url, { method: 'POST', body, auth: false })
    return data
  }

  /**
   * Signs in with a username and password, through Simple OAuth's password grant.
   *
   * It needs the `simple_oauth_password_grant` module, and usually a confidential Consumer. In a browser, point
   * `passwordTokenUrl` at a server route that holds the secret.
   *
   * @param credentials - The user's credentials, and an optional scope.
   * @returns Simple OAuth's token response.
   *
   * @example @lang js
   * await this.$druxt.auth.loginWithPassword({ username: 'editor', password })
   */
  loginWithPassword(
    { username, password, scope = this.options.scope }: { username: string, password: string, scope?: string },
  ): Promise<TokenResponse> {
    return this.requestToken(
      { grant_type: 'password', username, password, scope },
      this.options.passwordClientId || this.options.clientId,
    )
  }

  /**
   * Signs in as a Consumer's own user, through Simple OAuth's client credentials grant.
   *
   * This is a machine to machine sign-in, such as a build's. It needs a confidential Consumer with a user set, the
   * Consumer's secret, and a scope.
   *
   * @param options - An optional scope.
   * @returns Simple OAuth's token response.
   *
   * @example @lang js
   * const druxt = new DruxtClient(baseUrl, {
   *   auth: { clientId: 'druxt-build', clientSecret: process.env.DRUXT_BUILD_CLIENT_SECRET },
   * })
   * await druxt.auth.loginWithClientCredentials({ scope: 'druxt_build' })
   */
  loginWithClientCredentials({ scope = this.options.scope }: { scope?: string } = {}): Promise<TokenResponse> {
    return this.requestToken({ grant_type: 'client_credentials', scope })
  }

  /**
   * Starts the authorization code grant.
   *
   * @param options - Where Drupal sends the visitor back, and an optional scope and state.
   * @returns The URL to send the visitor to, and the state and PKCE verifier to keep until Drupal sends them back.
   *
   * @example @lang js
   * const { url, state, verifier } = await this.$druxt.auth.authorize({
   *   redirectUri: `${window.location.origin}/callback`,
   * })
   * // Keep state and verifier until Drupal sends the visitor back, then:
   * window.location.assign(url)
   */
  async authorize({ redirectUri, scope = this.options.scope, state = randomString(32) }: {
    redirectUri: string
    scope?: string
    state?: string
  }): Promise<{ url: string, state: string, verifier: string }> {
    const { verifier, challenge } = await createPkce()
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.options.clientId,
      redirect_uri: redirectUri,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      ...(scope ? { scope } : {}),
    })
    return { url: `${this.client.url(this.options.authorizeUrl)}?${params}`, state, verifier }
  }

  /**
   * Finishes the authorization code grant, and signs in.
   *
   * @param options - The code Drupal returned, the PKCE verifier, and the same redirect URI.
   * @returns Simple OAuth's token response.
   *
   * @example @lang js
   * await this.$druxt.auth.exchangeCode({ code, verifier, redirectUri: `${window.location.origin}/callback` })
   */
  exchangeCode(
    { code, verifier, redirectUri }: { code: string, verifier: string, redirectUri: string },
  ): Promise<TokenResponse> {
    return this.requestToken({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
    })
  }

  /**
   * Refreshes the tokens.
   *
   * - Concurrent callers share one request.
   * - A refresh that succeeded within the last `refresh.grace` milliseconds is reused. The call then resolves with
   *   undefined.
   * - At most `refresh.limit` refreshes start in each `refresh.window` milliseconds. Past that, the call rejects.
   * - With `refresh.share`, clients that hold the same refresh token share one refresh too.
   *
   * The refresh in flight and the grace belong to the session they were made for. A session signed in since then
   * starts its own refresh.
   *
   * @returns The token response, or undefined when a recent refresh is reused.
   */
  refresh(): Promise<TokenResponse | undefined> {
    if (!this.refreshing && this.refreshedAt && Date.now() - this.refreshedAt < this.options.refresh.grace) {
      return Promise.resolve(undefined)
    }

    if (!this.refreshing) {
      const now = Date.now()
      this.attempts = this.attempts.filter((at) => now - at < this.options.refresh.window)
      if (this.attempts.length >= this.options.refresh.limit) {
        return Promise.reject(new Error('DruxtAuth refresh limit reached.'))
      }
      if (!this.canRefresh) return Promise.reject(new Error('DruxtAuth holds no refresh token.'))
      this.attempts.push(now)

      // The Consumer that issued the tokens refreshes them. It may be the password grant's Consumer.
      const issuer = String(this.storage.get(KEYS.clientId) || this.options.clientId)

      // The session this refresh is for, taken before it runs.
      const before = this.held()
      const started = this.generation
      const current = () => this.held() === before && this.generation === started

      // Undefined in session mode, where the site's server adds the refresh token it holds.
      const refreshToken = this.refreshToken

      // No scope is sent. RFC 6749 section 6 then keeps the scope that was granted, which a sign-in may have
      // narrowed. A scope beyond it is refused with a 400, which would end the session.
      const start = () => this.postToken({ grant_type: 'refresh_token', refresh_token: refreshToken }, issuer)

      // A refresh is shared only for a refresh token this client holds. The key also names the access token and the
      // Consumer, so only clients of one session share.
      const { share, grace } = this.options.refresh
      const pending = share && refreshToken
        ? share(JSON.stringify([issuer, refreshToken, this.accessToken ?? null]), start, grace)
        : start()

      const refreshing: Promise<TokenResponse> = pending
        .then((data) => {
          // The answer belongs to the session the refresh was for. A sign-in or a sign-out made while it ran is
          // newer, and is kept. A request waiting on this refresh must not be sent as the newer session, so the
          // refresh rejects.
          if (!current()) throw supersededError()
          this.setTokens(data, issuer, true)
          this.refreshedAt = Date.now()
          return data
        }, (error: unknown) => {
          // A refresh token that Drupal refused is spent, and signing in again is the only way back. Only the
          // session the refresh was for ends. A session that a sign-in stored while it ran is kept.
          if (refreshRefused(error) && current()) this.clearTokens()
          throw error
        })
        // A newer session's refresh may be the one in flight by now, and it stays. This session's own callers keep
        // this promise, and its superseded rejection.
        .finally(() => { if (this.refreshing === refreshing) this.refreshing = null })
      this.refreshing = refreshing
    }

    return this.refreshing
  }

  /**
   * Gets the signed-in user, from OpenID Connect userinfo.
   *
   * @returns The user, or undefined when no session is held.
   *
   * @example @lang js
   * const user = await this.$druxt.auth.getUser()
   */
  async getUser(): Promise<UserInfo | undefined> {
    if (!this.loggedIn) return undefined
    const { data } = await this.client.request<UserInfo>(this.options.userInfoUrl)
    return data
  }

  /**
   * Signs out.
   *
   * Simple OAuth has no revocation endpoint to call, so the tokens are forgotten at once.
   *
   * In session mode with a `logoutUrl`, the site's server first clears the cookies it set, through that route. The
   * browser cannot clear them itself.
   *
   * - When the route answers with a 2xx, the session is forgotten and the promise resolves. No session is left, not
   *   even one that a sign-in stored while the route ran. A sign-in or a refresh still waiting rejects as superseded,
   *   and stores nothing. A sign-in after that starts a new session.
   * - When the route fails, the session is kept and the promise rejects with the request's error. So a sign-out that
   *   the server did not make is never reported as made. Calling `logout()` again retries it.
   */
  async logout(): Promise<void> {
    if (this.session && this.options.logoutUrl) {
      await this.client.request(this.options.logoutUrl, { method: 'POST', auth: false })
    }
    this.clearTokens()
  }
}
