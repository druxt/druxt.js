import { connectionsFrom } from '@druxt/client'
import type { DruxtConfig } from '@druxt/client'
import type { DruxtOptions } from '../module'
import type { DruxtPrivateConfig, DruxtPublicConfig } from '../runtime/types'

/**
 * Whether the pages can leave Drupal's address out: nothing in the browser uses it. That needs all three of these.
 *
 * - No request goes from the browser to Drupal: a static build that is not `hybrid`, or `proxy.api`.
 * - No file URL is made on it: `filesUrl` is set, a static build copies the files with `static.files`, or a server
 *   proxies them with `proxy.files`.
 * - No visitor is sent to it to sign in: no `auth`, or an `auth.authorizeUrl` of the site's own choosing. A static
 *   build's sign-in goes from the browser to Drupal, so it keeps the address whatever `authorizeUrl` says.
 *
 * @param options - The module's options, normalised.
 * @param staticBuild - The static mode, resolved.
 * @internal
 */
export const hidesBaseUrl = (options: Pick<DruxtOptions, 'proxy' | 'filesUrl' | 'auth'>, staticBuild: { enabled: boolean, files: boolean, hybrid: boolean }): boolean => {
  const quiet = staticBuild.enabled ? !staticBuild.hybrid && !options.auth : !!options.proxy?.api
  const files = !!options.filesUrl || (staticBuild.enabled ? staticBuild.files : !!options.proxy?.files)
  const signIn = !options.auth || !!(options.auth as { authorizeUrl?: string }).authorizeUrl
  return quiet && files && signIn
}

/**
 * Splits the site's `druxt` options once: every secret, and the server's
 * `proxy.trustForwarded`, into the private runtime config, and everything
 * else into the public one. The proxy's pattern for Drupal's session cookie,
 * `cache.sessionCookie`, goes to the private config too, as the proxy reads it
 * with the cache off, as in development.
 *
 * The private keys all exist, empty unless set, so Nuxt can set each from its
 * environment variable at runtime. The build's credentials stay in the build:
 * only `build.auth.scope` reaches the private config, and the server's own
 * come from `NUXT_DRUXT_BUILD_AUTH_*` or `DRUXT_BUILD_*` at runtime.
 *
 * @param options - The module's options, normalised.
 * @param sessionCookie - The site's `cache.sessionCookie`, read before development turns the cache off.
 * @returns The public and private config, and the connection names that 2.0 ignores.
 * @internal
 */
export const splitDruxtConfig = (options: DruxtOptions, sessionCookie = (options.cache || undefined)?.sessionCookie): { public: DruxtPublicConfig, private: DruxtPrivateConfig, ignored: string[] } => {
  const { build, connections, auth, cache, ...rest } = options
  void connections
  const out: Record<string, unknown> = { ...rest }
  // A deployment's trust in its front proxy is the server's alone: it never reaches the browser.
  let trustForwarded = false
  if (options.proxy) {
    const { trustForwarded: trust, ...publicProxy } = options.proxy
    trustForwarded = trust === true
    out.proxy = publicProxy
  }
  let clientSecret = ''
  if (auth) {
    const { clientSecret: secret, ...publicAuth } = auth
    clientSecret = secret || ''
    out.auth = publicAuth
  }
  let cacheSecret = ''
  if (cache === false) out.cache = false
  else if (cache) {
    const { secret, ...publicCache } = cache
    cacheSecret = secret || ''
    out.cache = publicCache
  }
  return {
    public: out as unknown as DruxtPublicConfig,
    private: {
      auth: { clientSecret },
      cache: { secret: cacheSecret },
      proxy: { trustForwarded, sessionCookie: sessionCookie || '' },
      build: { auth: { clientId: '', clientSecret: '', username: '', password: '', scope: build?.auth?.scope || '' } },
    },
    ignored: connectionsFrom(options as unknown as DruxtConfig).ignored,
  }
}
