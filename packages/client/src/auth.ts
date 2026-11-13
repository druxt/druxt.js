// OAuth 2 against Drupal's Simple OAuth, for DruxtClient: the authorization
// code grant with PKCE, the password and client credentials grants, refresh,
// and recovery from tokens Drupal revoked. No framework: storage is
// pluggable, so it runs in Node, a browser or a Nuxt app alike. Ports
// druxt-auth 0.x's behaviour from its @nuxtjs/auth-next schemes and its
// refresh plugin.
import type { DruxtClient } from './client'
import type { AuthStorage, DruxtAuthOptions } from './types'
import { supersededError } from './utils/superseded'

/** The storage keys, exported so a framework can prepare storage for them up front. */
export const KEYS = {
  accessToken: 'druxt.auth.access_token',
  refreshToken: 'druxt.auth.refresh_token',
  expiresAt: 'druxt.auth.expires_at',
  clientId: 'druxt.auth.client_id',
  /**
   * Whether a session is signed in, readable by the browser: the access token's expiry in milliseconds, or `on` for a
   * token with none. It holds no token. With `session` on, the browser's client reads only this key.
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

/** Token storage held in memory, the default. */
export const memoryStorage = (): AuthStorage => {
  const values = new Map<string, string | number | undefined>()
  return {
    get: (key) => values.get(key),
    set: (key, value) => { values.set(key, value) },
    remove: (key) => { values.delete(key) },
  }
}

const base64Url = (bytes: ArrayBuffer | Uint8Array): string => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const randomString = (length = 64): string => base64Url(globalThis.crypto.getRandomValues(new Uint8Array(length))).slice(0, length)

/** A PKCE verifier and its S256 challenge. */
export const createPkce = async (): Promise<{ verifier: string, challenge: string }> => {
  const verifier = randomString(64)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return { verifier, challenge: base64Url(digest) }
}

/**
 * Whether a refresh failed because Drupal refused the refresh token, with a 400 or a 401: the session is over. A
 * timeout, a 5xx or the refresh limit says nothing about the token, so the session is kept for those.
 *
 * @param error - What the refresh rejected with.
 */
export const refreshRefused = (error: unknown): boolean => {
  const status = (error as { response?: { status?: number } } | undefined)?.response?.status
  return status === 400 || status === 401
}

type Options = DruxtAuthOptions & Required<Pick<DruxtAuthOptions, 'tokenUrl' | 'authorizeUrl' | 'userInfoUrl' | 'storage'>> & {
  refresh: { grace: number, limit: number, window: number, share?: NonNullable<DruxtAuthOptions['refresh']>['share'] }
}

/**
 * The OAuth side of a DruxtClient.
 *
 * One session at a time, and {@link DruxtAuth.epoch} names it. It moves when the session held ends, by a sign-out,
 * a refresh Drupal refused, or a sign-in starting, which ends the session held then rather than when its own tokens
 * arrive, and it moves again when a sign-in stores its tokens. A refresh keeps the session and the number. Whatever
 * is done for a session belongs to the number it was done for: a refresh's answer, its grace and the refresh in flight
 * that callers join, a request's refresh and retry after a 401, and a sign-in's tokens. Once the number has moved,
 * that work stores nothing and is not done again as the session now held. {@link DruxtAuth.held} does the same for
 * another client writing the same storage, which the number cannot see.
 */
export class DruxtAuth {
  client: DruxtClient
  options: Options
  storage: AuthStorage
  /** The session's refresh in flight, its last one, and recent attempts: druxt-auth's limits. */
  refreshing: Promise<TokenResponse> | null
  refreshedAt: number
  attempts: number[]
  /** The session's number, {@link DruxtAuth.epoch}. */
  private generation = 0

  /**
   * @param client - The DruxtClient.
   * @param options - Auth options; see {@link DruxtAuthOptions}.
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
   * Which session this client is on: it moves when the session ends, by a sign-out, a refused refresh or a sign-in
   * starting, and when a sign-in stores its tokens, and never on a refresh. A request is refreshed, sent and retried
   * only while it is the number the request was made in.
   */
  get epoch(): number {
    return this.generation
  }

  /** Whether the site's server holds the tokens, and this client only the session marker. */
  get session(): boolean {
    return !!this.options.session
  }

  /** The access token. None with `session` on: the site's server holds it. */
  get accessToken(): string | undefined {
    if (this.session) return undefined
    const value = this.storage.get(KEYS.accessToken)
    return value ? String(value) : undefined
  }

  /** The refresh token. None with `session` on: the site's server holds it. */
  get refreshToken(): string | undefined {
    if (this.session) return undefined
    const value = this.storage.get(KEYS.refreshToken)
    return value ? String(value) : undefined
  }

  /** Whether a token is held, or with `session` on, whether the session marker says one is. Drupal may still reject it. */
  get loggedIn(): boolean {
    if (this.session) return !!this.storage.get(KEYS.session)
    return !!(this.accessToken || this.refreshToken)
  }

  /** Whether the session can be refreshed: a refresh token is held, or the site's server holds the session. */
  get canRefresh(): boolean {
    return this.session ? this.loggedIn : !!this.refreshToken
  }

  /** Whether the access token is past its expiry. */
  get expired(): boolean {
    const at = Number(this.storage.get(this.session ? KEYS.session : KEYS.expiresAt) || 0)
    return !!at && Date.now() >= at
  }

  /**
   * Stores a token response.
   *
   * @param data - Simple OAuth's token response.
   * @param clientId - The Consumer that issued it, for refresh.
   * @param refreshed - Whether it answers a refresh, which keeps the refresh token when it issues no new one.
   */
  setTokens(data: TokenResponse, clientId?: string, refreshed = false): void {
    // The site's server set the token cookies: the browser keeps the marker alone.
    if (this.session) {
      this.storage.set(KEYS.session, data.expires_in ? String(Date.now() + data.expires_in * 1000) : 'on')
      return
    }
    this.storage.set(KEYS.accessToken, data.access_token)
    if (clientId) this.storage.set(KEYS.clientId, clientId)
    // RFC 6749 section 6: a refresh that issues no new refresh token keeps the old one; a sign-in that issues none
    // has none, so the last user's is not kept.
    if (data.refresh_token) this.storage.set(KEYS.refreshToken, data.refresh_token)
    else if (!refreshed) this.storage.remove(KEYS.refreshToken)
    // A token without expires_in does not expire, whatever the last one did.
    if (data.expires_in) this.storage.set(KEYS.expiresAt, String(Date.now() + data.expires_in * 1000))
    else this.storage.remove(KEYS.expiresAt)
  }

  /** What the storage holds for the session now, to tell it from a session stored later. */
  held(): string {
    return JSON.stringify([KEYS.accessToken, KEYS.refreshToken, KEYS.session].map((key) => this.storage.get(key) ?? null))
  }

  /**
   * Forgets a session Drupal refused a request for, with no refresh token to try. Only that session ends: one stored
   * since the request was sent is another, and kept.
   *
   * @param sent - What the storage held as the request was sent, from {@link DruxtAuth.held}.
   */
  drop(sent: string): void {
    if (this.held() === sent) this.clearTokens()
  }

  /** Ends the session: forgets the tokens, and the refresh in flight and the grace that were the session's. */
  clearTokens(): void {
    this.generation++
    this.refreshing = null
    this.refreshedAt = 0
    for (const key of Object.values(KEYS)) this.storage.remove(key)
  }

  /**
   * Posts a sign-in grant to the token endpoint and stores its tokens. It ends the session held as it starts, so a
   * sign-in that fails leaves none, as druxt-auth 0.x did. A client that stores its own tokens sends nothing as the
   * last user while it runs. With `session` on, that session is in the site's cookies, which the site's proxy adds
   * until the sign-in at `tokenUrl` answers; Druxt's Nuxt module doesn't start a sign-in while a session is held. A
   * sign-in started later, or a sign-out, while it runs replaces it: it then stores nothing. Once Drupal has issued
   * its tokens, it rejects with an error whose `superseded` is true, which `isSuperseded()` tells; one that failed
   * rejects with its own error.
   *
   * @param fields - The grant's fields.
   * @param clientId - The Consumer, `clientId` by default.
   */
  async requestToken(fields: Record<string, string | undefined>, clientId: string = this.options.clientId): Promise<TokenResponse> {
    // A visitor signing in as someone else is no longer the user before, whatever Drupal answers.
    this.clearTokens()
    const mine = this.generation
    const data = await this.postToken(fields, clientId)
    if (this.generation !== mine) throw supersededError()
    // A new session, so nothing begun while none was held is done again as it.
    this.generation++
    this.setTokens(data, clientId)
    return data
  }

  /**
   * Posts a grant to the token endpoint, storing nothing.
   *
   * @param fields - The grant's fields.
   * @param clientId - The Consumer.
   */
  private async postToken(fields: Record<string, string | undefined>, clientId: string): Promise<TokenResponse> {
    // The secret belongs to the confidential Consumer alone: the password
    // grant's when one is set, otherwise the only one.
    const confidential = clientId === (this.options.passwordClientId || this.options.clientId)
    const body = new URLSearchParams({
      ...Object.fromEntries(Object.entries(fields).filter((entry): entry is [string, string] => entry[1] !== undefined)),
      client_id: clientId,
      ...(confidential && this.options.clientSecret ? { client_secret: this.options.clientSecret } : {}),
    })
    const url = confidential && this.options.passwordTokenUrl ? this.options.passwordTokenUrl : this.options.tokenUrl
    // Without the user's token, which a token request must not carry.
    const { data } = await this.client.request<TokenResponse>(url, { method: 'POST', body, auth: false })
    return data
  }

  /**
   * Signs in with a username and password, Simple OAuth's password grant.
   *
   * Needs the simple_oauth_password_grant module, and usually a confidential
   * Consumer, so in a browser `passwordTokenUrl` points at a server route holding the secret.
   *
   * @param credentials - The user's credentials, and an optional scope.
   *
   * @example @lang js
   * await this.$druxt.auth.loginWithPassword({ username: 'editor', password })
   */
  loginWithPassword({ username, password, scope = this.options.scope }: { username: string, password: string, scope?: string }): Promise<TokenResponse> {
    return this.requestToken({ grant_type: 'password', username, password, scope }, this.options.passwordClientId || this.options.clientId)
  }

  /**
   * Signs in as a Consumer's own user, Simple OAuth's client credentials
   * grant: machine to machine, such as a build. Needs a confidential Consumer
   * with a user set, its secret, and a scope.
   *
   * @param options - An optional scope.
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
   * Starts the authorization code grant: the URL to send the visitor to, and
   * the state and PKCE verifier to keep until they come back.
   *
   * @param options - Where Drupal sends the visitor back, and an optional scope and state.
   *
   * @example @lang js
   * const { url, state, verifier } = await this.$druxt.auth.authorize({
   *   redirectUri: `${window.location.origin}/callback`,
   * })
   * // Keep state and verifier until Drupal sends the visitor back, then:
   * window.location.assign(url)
   */
  async authorize({ redirectUri, scope = this.options.scope, state = randomString(32) }: { redirectUri: string, scope?: string, state?: string }): Promise<{ url: string, state: string, verifier: string }> {
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
   * Finishes the authorization code grant.
   *
   * @param options - The code Drupal returned, the PKCE verifier, and the same redirect URI.
   *
   * @example @lang js
   * await this.$druxt.auth.exchangeCode({ code, verifier, redirectUri: `${window.location.origin}/callback` })
   */
  exchangeCode({ code, verifier, redirectUri }: { code: string, verifier: string, redirectUri: string }): Promise<TokenResponse> {
    return this.requestToken({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: redirectUri })
  }

  /**
   * Refreshes the tokens. Concurrent callers share one request; one that
   * succeeded within `grace` is reused; at most `limit` run per `window`.
   * With `refresh.share`, clients holding the same refresh token share it too.
   * The refresh in flight and the grace belong to the session they were for,
   * so a session signed in since starts its own.
   */
  refresh(): Promise<TokenResponse | undefined> {
    if (!this.refreshing && this.refreshedAt && Date.now() - this.refreshedAt < this.options.refresh.grace) {
      return Promise.resolve(undefined)
    }
    if (!this.refreshing) {
      const now = Date.now()
      this.attempts = this.attempts.filter((at) => now - at < this.options.refresh.window)
      if (this.attempts.length >= this.options.refresh.limit) return Promise.reject(new Error('DruxtAuth refresh limit reached.'))
      if (!this.canRefresh) return Promise.reject(new Error('DruxtAuth holds no refresh token.'))
      this.attempts.push(now)

      // With the Consumer that issued the tokens, which may be the password grant's.
      const issuer = String(this.storage.get(KEYS.clientId) || this.options.clientId)
      // The session this refresh is for, taken before it runs.
      const before = this.held()
      const started = this.generation
      const current = () => this.held() === before && this.generation === started
      // With `session` on, the site's server adds the refresh token it holds.
      const refreshToken = this.refreshToken
      // No scope: RFC 6749 section 6 keeps the one granted, which a sign-in may have narrowed. A scope beyond it is
      // refused with a 400, which would end the session.
      const start = () => this.postToken({ grant_type: 'refresh_token', refresh_token: refreshToken }, issuer)
      // Shared only for a refresh token of this client's own, and keyed on the access token and the Consumer too, so
      // only clients of one session share.
      const { share, grace } = this.options.refresh
      const pending = share && refreshToken ? share(JSON.stringify([issuer, refreshToken, this.accessToken ?? null]), start, grace) : start()
      const refreshing: Promise<TokenResponse> = pending
        .then((data) => {
          // The answer is the session's it was for: a sign-in or sign-out made while it ran is newer, and kept. A
          // request waiting on it must not be sent again as that session, so it rejects.
          if (!current()) throw supersededError()
          this.setTokens(data, issuer, true)
          this.refreshedAt = Date.now()
          return data
        }, (error: unknown) => {
          // A refresh token Drupal refused is spent; signing in again is the only way back. Only the session it was
          // for ends: a sign-in that stored another while it ran is kept.
          if (refreshRefused(error) && current()) this.clearTokens()
          throw error
        })
        // A newer session's refresh may be the one in flight by now, and stays. The session's own callers keep this
        // one, and its superseded rejection.
        .finally(() => { if (this.refreshing === refreshing) this.refreshing = null })
      this.refreshing = refreshing
    }
    return this.refreshing
  }

  /**
   * The signed-in user, from OpenID Connect userinfo.
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
   * Signs out. Simple OAuth has no revocation endpoint to call, so the tokens are forgotten at once. With `session`
   * on and a `logoutUrl`, the site's server first clears the cookies it set, which the browser cannot, through that
   * route. When it answers with a 2xx, the session is forgotten and the promise resolves: no session is left, even
   * one a sign-in stored while the route ran, and a sign-in or refresh still waiting rejects with `superseded` and
   * stores nothing. A sign-in after that starts a new session. When the route answers with anything else, the
   * session is kept and the promise rejects with the request's error, so a sign-out the server did not make is never
   * reported, and calling `logout()` again retries it.
   */
  async logout(): Promise<void> {
    if (this.session && this.options.logoutUrl) await this.client.request(this.options.logoutUrl, { method: 'POST', auth: false })
    this.clearTokens()
  }
}
