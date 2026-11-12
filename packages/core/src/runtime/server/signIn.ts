import { DruxtClient } from '@druxt/client'
import type { DruxtClientOptions } from '@druxt/client'

// No #imports here: the build and the server routes both use this file.

/** The build credentials as a config holds them: a key nothing set is '' or undefined. */
export interface DruxtServerAuthConfig {
  clientId?: string
  clientSecret?: string
  username?: string
  password?: string
  scope?: string
}

/**
 * The credentials a client signs in with, or undefined for anonymous.
 * A client id, and a secret or a password.
 *
 * @param auth - The server's credentials from serverAuthConfig(), or the build's own.
 */
export const serverAuthOptions = (auth: DruxtServerAuthConfig): Required<Pick<DruxtServerAuthConfig, 'clientId'>> & DruxtServerAuthConfig | undefined => {
  const value = (key: keyof DruxtServerAuthConfig) => auth[key] || undefined
  const clientId = value('clientId')
  const clientSecret = value('clientSecret')
  const password = value('password')
  if (!clientId || !(clientSecret || password)) return undefined
  return { clientId, clientSecret, username: value('username'), password, scope: value('scope') }
}

const ENV: Record<keyof DruxtServerAuthConfig, string> = {
  clientId: 'DRUXT_BUILD_CLIENT_ID',
  clientSecret: 'DRUXT_BUILD_CLIENT_SECRET',
  username: 'DRUXT_BUILD_USERNAME',
  password: 'DRUXT_BUILD_PASSWORD',
  scope: 'DRUXT_BUILD_SCOPE',
}

/**
 * The server's credentials: each key from the runtime config, else from its
 * DRUXT_BUILD_* variable as the server sees it at request time. Nothing is
 * read at build time, so a secret given only to the build never reaches the
 * server bundle.
 *
 * @param runtime - `runtimeConfig.druxt.build.auth`.
 * @param env - The environment, `process.env` by default.
 */
export const serverAuthConfig = (runtime: DruxtServerAuthConfig, env: Record<string, string | undefined> = process.env): DruxtServerAuthConfig =>
  Object.fromEntries((Object.keys(ENV) as (keyof DruxtServerAuthConfig)[]).map((key) => [key, runtime[key] || env[ENV[key]] || undefined]))

type Credentials = NonNullable<ReturnType<typeof serverAuthOptions>>

const login = async (client: DruxtClient, auth: Credentials): Promise<void> => {
  if (!client.auth) return
  if (auth.username) await client.auth.loginWithPassword({ username: auth.username, password: auth.password || '' })
  else await client.auth.loginWithClientCredentials()
}

// The client credentials grant issues no refresh token, so an expired token needs a fresh login.
const needsLogin = (client: DruxtClient): boolean => !!client.auth && client.auth.expired && !client.auth.refreshToken

/**
 * One signed-in client per backend and credentials, kept in `clients`: direct
 * to Drupal, with no process cache. It signs in on first use, signs in again
 * once its token has expired without a refresh token to renew it, and forgets
 * a sign-in that failed so the next call tries again.
 *
 * @param clients - The map this caller keeps its clients in.
 * @param baseUrl - The Drupal backend.
 * @param options - The client options, which the build's credentials do not belong in.
 * @param config - The credentials, raw.
 */
export const signedInClient = (clients: Map<string, Promise<DruxtClient>>, baseUrl: string, options: Record<string, unknown>, config: DruxtServerAuthConfig): Promise<DruxtClient> => {
  const auth = serverAuthOptions(config)
  const key = JSON.stringify([baseUrl, auth?.clientId, auth?.username])
  const proxy = options.proxy as object | undefined
  const existing = clients.get(key)
  // Chained, so callers arriving together share one sign-in.
  const next = existing
    ? existing.then(async (client) => {
        if (auth && needsLogin(client)) await login(client, auth)
        return client
      })
    : (async () => {
        const client = new DruxtClient(baseUrl, {
          ...options,
          proxy: { ...proxy, api: false },
          cache: false,
          auth: auth
            ? { clientId: auth.clientId, clientSecret: auth.clientSecret, scope: auth.scope, tokenUrl: `${baseUrl}/oauth/token`, userInfoUrl: `${baseUrl}/oauth/userinfo` }
            : undefined,
        } as DruxtClientOptions)
        if (auth) await login(client, auth)
        return client
      })()
  clients.set(key, next)
  next.catch(() => {
    if (clients.get(key) === next) clients.delete(key)
  })
  return next
}

/** The server routes' signed-in clients, one per backend and credentials. */
export const serverClients = new Map<string, Promise<DruxtClient>>()

/**
 * Empties every server client's cache, the JSON:API index included, so the
 * next request after a Druxt cache clear sees resource types Drupal added.
 * A client whose sign-in failed has nothing to clear.
 *
 * @param clients - The map the clients are kept in.
 */
export const clearServerClients = async (clients: Map<string, Promise<DruxtClient>> = serverClients): Promise<void> => {
  const settled = await Promise.allSettled(clients.values())
  for (const result of settled) {
    if (result.status === 'fulfilled') result.value.clearCache()
  }
}
