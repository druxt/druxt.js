import type { H3Event } from 'h3'
import { clientOptions } from '@druxt/client'
import type { DruxtClient, DruxtConfig } from '@druxt/client'
import { useRuntimeConfig } from '#imports'
import { languages } from '#druxt/languages'
import type { DruxtPrivateConfig, DruxtServerAuthConfig } from '../types'
import { serverAuthConfig, serverClients, signedInClient } from './signIn'

/**
 * The server clients' options, from the public config.
 *
 * In development, a read that Drupal omits resources from warns once per resource type. The schema hold, the date
 * format hold and config reads all run through these clients.
 *
 * @param config - The public `druxt` config.
 */
const serverOptions = (config: unknown) => {
  const options = clientOptions(config as DruxtConfig)
  options.warnOmitted ??= import.meta.dev
  // Each langcode's URL prefix, as the build read them. The app's client has the same.
  options.prefixes ??= Object.fromEntries(languages.map((language) => [language.langcode, language.prefix]))
  return options
}

/**
 * Gets the client a server route talks to Drupal with.
 *
 * It signs in as the build Consumer when one is named, by the `NUXT_DRUXT_BUILD_AUTH_*` variables or by the
 * `DRUXT_BUILD_*` variables present at runtime. The server can then read what a visitor cannot, such as restricted
 * display configuration.
 *
 * The client goes direct to Drupal, with no process cache. A route that holds what it generates decides its own
 * lifetime.
 *
 * @param event - The request, used only for its runtime config. Without one, the process config is used.
 */
export const useDruxtServerClient = (event?: H3Event): Promise<DruxtClient> => {
  const config = useRuntimeConfig(event)
  const options = serverOptions(config.public.druxt)
  const auth: DruxtServerAuthConfig = (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.build?.auth || {}
  return signedInClient(serverClients, options.baseUrl, options, serverAuthConfig(auth))
}

/**
 * Gets the client a server route reads Drupal with as a visitor would, with no credentials.
 *
 * It is used when the build's sign-in has failed, for example. Like `useDruxtServerClient()`, it goes direct to
 * Drupal, with no process cache.
 *
 * @param event - The request, used only for its runtime config. Without one, the process config is used.
 */
export const useDruxtAnonymousClient = (event?: H3Event): Promise<DruxtClient> => {
  const options = serverOptions(useRuntimeConfig(event).public.druxt)
  return signedInClient(serverClients, options.baseUrl, options, {})
}
