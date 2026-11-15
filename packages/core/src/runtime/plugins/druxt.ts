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

/** The keys that hold a token, or what a refresh needs: hidden from the browser's scripts when the server holds the session. */
const HIDDEN = new Set<string>([AUTH_STORAGE_KEYS.accessToken, AUTH_STORAGE_KEYS.refreshToken, AUTH_STORAGE_KEYS.clientId, AUTH_STORAGE_KEYS.expiresAt])

/**
 * Token storage in cookies, so the session authenticates the server render, and a refresh on the server reaches the
 * browser. On the site's own host, under the app's base URL, `SameSite=Lax`, and `Secure` when the site is https.
 *
 * - With `session` on, the server's tokens are httpOnly, and it keeps the browser's marker, `druxt.auth.session`, with
 *   the access token's expiry and no token. In the browser only the marker is read, from the document's cookies as they
 *   stand, as the server's routes change them, and nothing is written: the server owns every cookie.
 * - With `exposeToken`, they are readable by script, as @nuxtjs/auth-next stored them for druxt-auth 0.x.
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
  // Created now, in the plugin: a token is read later, in a request
  // interceptor after an await, where Nuxt's context is gone.
  const cookies = Object.fromEntries(Object.values(AUTH_STORAGE_KEYS)
    .map((key) => [key, useCookie<string | number | null | undefined>(key, {
      path, sameSite: 'lax', secure, httpOnly: session && HIDDEN.has(key), maxAge: 60 * 60 * 24 * 30,
      // A value that does not decode is none, where Nuxt would keep it as it came and send it on as a token.
      decode: (value) => decodeStoredCookie(value) as string | number | null | undefined,
    })]))
  const cookie = (key: string) => cookies[key]!
  // The browser's marker follows the access token and its expiry: `on` for a token with none.
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

export default defineNuxtPlugin({
  name: 'druxt',
  enforce: 'pre',
  async setup() {
    const config = useRuntimeConfig()
    // A page written without Drupal's address gives the browser the site's own origin, which its requests go to.
    const published = config.public.druxt as unknown as DruxtPublicConfig
    const browser = import.meta.client && published.baseUrlHidden ? { ...published, baseUrl: browserBaseUrl(published.baseUrl, window.location.origin) } : published
    const options = druxtClientOptions(browser, import.meta.server
      ? { server: true, clientSecret: (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.auth?.clientSecret || process.env.DRUXT_AUTH_CLIENT_SECRET }
      : { server: false, origin: window.location.origin })
    if (options.auth && 'clientId' in options.auth) {
      const publicConfig = config.public.druxt as unknown as DruxtPublicConfig
      // Private config, read on the server only: the browser has no `druxt` key, and Nuxt warns when one is read there.
      const trust = import.meta.server && (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.proxy?.trustForwarded === true
      const event = import.meta.server ? useRequestEvent() : undefined
      const protocol = event ? getRequestProtocol(event, { xForwardedProto: trust }) : window.location.protocol
      options.auth.storage = cookieStorage({
        session: !!(publicConfig.auth as { session?: boolean } | undefined)?.session,
        server: !!import.meta.server,
        path: config.app.baseURL || '/',
        secure: secureSite(publicConfig.siteUrl, protocol),
      })
      // Each server render has a client of its own: renders of one browser share one refresh of its session.
      if (import.meta.server) options.auth.refresh = { ...options.auth.refresh, share: shareRefresh }
    }

    // Nuxt's own logger, so the client's messages read like the rest of the app's.
    options.logger = consola.withTag('DruxtClient')
    // In development, a response Drupal omitted resources from warns once per resource type.
    options.warnOmitted ??= import.meta.dev
    // Each langcode's URL prefix, as the build read them, so a module's language reaches Drupal under the prefix it is
    // served at, `spanish` for `es` on a site that configures one.
    options.prefixes ??= Object.fromEntries(languages.map((language) => [language.langcode, language.prefix]))
    const druxt = new DruxtClient(options.baseUrl, options)

    if (import.meta.server) {
      const event = useRequestEvent()
      // The public tier of settings from Drupal, set for this request or else
      // stored at server start, into the state useDruxtSettings() reads and the payload carries.
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

// The client and Pinia, declared: Nuxt does not always infer a module's
// plugin provides into the app's types.
declare module '#app' {
  interface NuxtApp {
    $druxt: DruxtClient
    $pinia: Pinia
  }
}
