import { AUTH_STORAGE_KEYS, DruxtClient } from '@druxt/client'
import { consola } from 'consola'
import { getRequestProtocol } from 'h3'
import type { Pinia } from 'pinia'
import type { AuthStorage } from '@druxt/client'
import { defineNuxtPlugin, useCookie, useRequestEvent, useRuntimeConfig, useState } from '#app'
import { languages } from '#druxt/languages'
import { druxtClientOptions } from '../utils/client-options'
import { browserBaseUrl } from '../utils/origin'
import { DRUXT_SETTINGS_DRUPAL_KEY } from '../utils/drupal-settings'
import { shareRefresh } from '../utils/refresh'
import { decodeStoredCookie, readDocumentCookie, secureSite } from '../utils/session'
import type { DruxtPrivateConfig, DruxtPublicConfig } from '../types'

/**
 * The keys that hold a token, or what a refresh needs.
 *
 * They are hidden from the browser's scripts when the server holds the session.
 */
const HIDDEN = new Set<string>([AUTH_STORAGE_KEYS.accessToken, AUTH_STORAGE_KEYS.refreshToken, AUTH_STORAGE_KEYS.clientId, AUTH_STORAGE_KEYS.expiresAt])

/**
 * Token storage in cookies.
 *
 * With cookies, the session authenticates the server render, and a refresh on the server reaches the browser.
 *
 * The cookies are set on the site's own host, under the app's base URL. They are `SameSite=Lax`, and `Secure` when
 * the site is https.
 *
 * With `session` on, the server holds the session:
 *
 * - The server's tokens are httpOnly.
 * - The server keeps the browser's marker, `druxt.auth.session`. It holds the access token's expiry, and no token.
 * - In the browser only the marker is read. It is read from the document's cookies as they stand, because the
 *   server's routes change them.
 * - In the browser nothing is written. The server owns every cookie.
 *
 * With `exposeToken`, the tokens are readable by script, as @nuxtjs/auth-next stored them for druxt-auth 0.x.
 *
 * @param options - Whether the server holds the session, whether this is the server, and the cookies' flags.
 * @param options.session - Whether the server holds the session.
 * @param options.server - Whether this is the server.
 * @param options.path - The app's base URL.
 * @param options.secure - Whether the cookies are `Secure`.
 */
const cookieStorage = ({ session, server, path, secure }: { session: boolean, server: boolean, path: string, secure: boolean }): AuthStorage => {
  if (session && !server) {
    return {
      get: (key) => (key === AUTH_STORAGE_KEYS.session ? readDocumentCookie(document.cookie, key) : undefined),
      set: () => {},
      remove: () => {},
    }
  }
  // The cookie refs are created now, in the plugin. A token is read later, in a request interceptor after an await,
  // where Nuxt's context is gone.
  const cookies = Object.fromEntries(Object.values(AUTH_STORAGE_KEYS)
    .map((key) => [key, useCookie<string | number | null | undefined>(key, {
      path, sameSite: 'lax', secure, httpOnly: session && HIDDEN.has(key), maxAge: 60 * 60 * 24 * 30,
      // A value that does not decode is no value. Nuxt would keep it as it came, and send it on as a token.
      decode: (value) => decodeStoredCookie(value) as string | number | null | undefined,
    })]))
  const cookie = (key: string) => cookies[key]!
  // The browser's marker follows the access token and its expiry. It is `on` for a token with no expiry.
  const mark = () => {
    const token = cookie(AUTH_STORAGE_KEYS.accessToken).value
    cookie(AUTH_STORAGE_KEYS.session).value = token ? String(cookie(AUTH_STORAGE_KEYS.expiresAt).value || 'on') : null
  }
  return {
    get: (key) => cookie(key).value ?? undefined,
    set: (key, value) => {
      cookie(key).value = value
      if (session && (key === AUTH_STORAGE_KEYS.accessToken || key === AUTH_STORAGE_KEYS.expiresAt)) mark()
    },
    remove: (key) => {
      cookie(key).value = null
      if (session && (key === AUTH_STORAGE_KEYS.accessToken || key === AUTH_STORAGE_KEYS.expiresAt)) mark()
    },
  }
}

/**
 * The core plugin: creates the Druxt client and provides it as `$druxt`.
 *
 * On the server it also seeds the public tier of settings from Drupal into state, and fetches the signed-in user.
 */
export default defineNuxtPlugin({
  name: 'druxt',
  enforce: 'pre',
  async setup() {
    const config = useRuntimeConfig()
    // A page written without Drupal's address gives the browser the site's own origin. Its requests go there.
    const published = config.public.druxt as unknown as DruxtPublicConfig
    const browser = import.meta.client && published.baseUrlHidden ? { ...published, baseUrl: browserBaseUrl(published.baseUrl, window.location.origin) } : published
    const options = druxtClientOptions(browser, import.meta.server
      ? { server: true, clientSecret: (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.auth?.clientSecret || process.env.DRUXT_AUTH_CLIENT_SECRET }
      : { server: false, origin: window.location.origin })
    if (options.auth && 'clientId' in options.auth) {
      const publicConfig = config.public.druxt as unknown as DruxtPublicConfig
      // The private config is read on the server only. The browser has no `druxt` key there, and Nuxt warns when
      // one is read.
      const trust = import.meta.server && (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.proxy?.trustForwarded === true
      const event = import.meta.server ? useRequestEvent() : undefined
      const protocol = event ? getRequestProtocol(event, { xForwardedProto: trust }) : window.location.protocol
      options.auth.storage = cookieStorage({
        session: !!(publicConfig.auth as { session?: boolean } | undefined)?.session,
        server: !!import.meta.server,
        path: config.app.baseURL || '/',
        secure: secureSite(publicConfig.siteUrl, protocol),
      })
      // Each server render has a client of its own. Renders for one browser share one refresh of its session.
      if (import.meta.server) options.auth.refresh = { ...options.auth.refresh, share: shareRefresh }
    }

    // The client logs through Nuxt's own logger, so its messages read like the rest of the app's.
    options.logger = consola.withTag('DruxtClient')
    // In development, a response that Drupal omitted resources from warns once per resource type.
    options.warnOmitted ??= import.meta.dev
    // Each langcode's URL prefix, as the build read them. A module's language then reaches Drupal under the prefix
    // it is served at, such as `spanish` for `es` on a site that configures one.
    options.prefixes ??= Object.fromEntries(languages.map((language) => [language.langcode, language.prefix]))
    const druxt = new DruxtClient(options.baseUrl, options)

    if (import.meta.server) {
      const event = useRequestEvent()
      // The public tier of settings from Drupal. It is the one set for this request, or else the one stored at
      // server start. It goes into the state `useDruxtSettings()` reads, which the payload carries.
      const fromDrupal = event?.context.druxtSettings?.default?.public ?? (await event?.context.druxtStoredSettings?.('default'))?.public
      if (fromDrupal) useState(DRUXT_SETTINGS_DRUPAL_KEY('default')).value = fromDrupal

      // The signed-in user, fetched once per server render, as auth-next did.
      if (druxt.auth?.loggedIn) {
        const user = useState<unknown>('druxt-auth-user', () => null)
        user.value = (await druxt.auth.getUser().catch(() => undefined)) ?? null
      }
    }

    return { provide: { druxt } }
  },
})

// The client and Pinia are declared here, because Nuxt does not always infer a module's plugin provides into the
// app's types.
declare module '#app' {
  interface NuxtApp {
    $druxt: DruxtClient
    $pinia: Pinia
  }
}
