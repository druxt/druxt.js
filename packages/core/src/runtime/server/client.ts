import type { H3Event } from 'h3'
import { clientOptions } from '@druxt/client'
import type { DruxtClient, DruxtConfig } from '@druxt/client'
import { useRuntimeConfig } from '#imports'
import { languages } from '#druxt/languages'
import type { DruxtPrivateConfig } from '../types'
import { serverAuthConfig, serverClients, signedInClient } from './signIn'
import type { DruxtServerAuthConfig } from './signIn'

/**
 * The server clients' options, from the public config. In development, a read Drupal omits resources from warns once
 * per resource type, as the schema hold, the date format hold and config reads run here.
 *
 * @param config - The public `druxt` config.
 */
const serverOptions = (config: unknown) => {
  const options = clientOptions(config as DruxtConfig)
  options.warnOmitted ??= import.meta.dev
  // Each langcode's URL prefix, as the build read them, as the app's client has it.
  options.prefixes ??= Object.fromEntries(languages.map((language) => [language.langcode, language.prefix]))
  return options
}

/**
 * The client a server route talks to Drupal with: the build Consumer when
 * the `NUXT_DRUXT_BUILD_AUTH_*` variables, or the `DRUXT_BUILD_*` ones present
 * at runtime, name one, so the server can read what a visitor cannot, such as
 * restricted display configuration. Direct to Drupal, with no process cache:
 * a route that holds what it generates decides its own lifetime.
 *
 * @param event - The request, only for its runtime config. Without one, the process config.
 */
export const useDruxtServerClient = (event?: H3Event): Promise<DruxtClient> => {
  const config = useRuntimeConfig(event)
  const options = serverOptions(config.public.druxt)
  const auth: DruxtServerAuthConfig = (config.druxt as Partial<DruxtPrivateConfig> | undefined)?.build?.auth || {}
  return signedInClient(serverClients, options.baseUrl, options, serverAuthConfig(auth))
}

/**
 * The client a server route reads Drupal with as a visitor would, with no credentials, such as when the build's
 * sign-in has failed. Direct to Drupal, with no process cache, as `useDruxtServerClient()`.
 *
 * @param event - The request, only for its runtime config. Without one, the process config.
 */
export const useDruxtAnonymousClient = (event?: H3Event): Promise<DruxtClient> => {
  const options = serverOptions(useRuntimeConfig(event).public.druxt)
  return signedInClient(serverClients, options.baseUrl, options, {})
}
