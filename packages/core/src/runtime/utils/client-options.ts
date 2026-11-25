import { clientOptions } from '@druxt/client'
import type { DruxtAuthOptions, DruxtClientOptions, DruxtConfig } from '@druxt/client'
import { DRUXT_API_BASE } from '@druxt/core/routes'
import type { DruxtPublicConfig } from '../types'

// This file imports nothing from `#imports`, because the plugin and the unit tests both use it.

/** Which side the client is for, and what that side adds. */
export type DruxtClientSide =
  | { server: true, clientSecret?: string }
  | { server: false, origin: string }

/**
 * The client's options for one side, from the public config.
 *
 * - The browser goes through the proxy when `proxy.api` is on. The server talks to Drupal directly.
 * - On the server, auth gets the secret from the private config.
 * - In the browser, the password grant goes through the server route that holds the secret.
 * - Module settings never reach the client.
 *
 * @param config - The public `druxt` config.
 * @param side - The side, and its secret or origin.
 * @internal
 */
export const druxtClientOptions = (config: DruxtPublicConfig, side: DruxtClientSide): DruxtClientOptions & { baseUrl: string } => {
  const options = clientOptions(config as unknown as DruxtConfig)
  if (side.server && options.proxy?.api) options.proxy = { ...options.proxy, api: false }
  const auth = config.auth
  if (auth && options.auth) {
    options.auth = {
      ...options.auth,
      // To sign in at Drupal, the browser leaves for Drupal's own origin.
      authorizeUrl: auth.authorizeUrl || `${options.baseUrl}/oauth/authorize`,
      ...(side.server
        // The server goes straight to Drupal with the secret. The secret stays on the server, which holds the
        // tokens.
        ? { clientSecret: side.clientSecret, session: false }
        // The server holds the session. Every grant and the sign-out go through its routes, which keep the tokens.
        // The password grant goes through them only when it is offered.
        : auth.session
          ? {
              session: true,
              tokenUrl: `${side.origin}${DRUXT_API_BASE}/auth/token`,
              ...(auth.password === false ? {} : { passwordTokenUrl: `${side.origin}${DRUXT_API_BASE}/auth/token` }),
              logoutUrl: `${side.origin}${DRUXT_API_BASE}/auth/logout`,
            }
          // The confidential Consumer's requests go through the server route that holds the secret.
          : auth.password ? { passwordTokenUrl: `${side.origin}${DRUXT_API_BASE}/auth/token` } : {}),
    } as DruxtAuthOptions
  }
  return options
}
