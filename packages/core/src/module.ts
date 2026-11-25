import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { addComponent, addDevServerHandler, addImports, addPlugin, addRouteMiddleware, addServerHandler, addServerImports, addServerPlugin, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, hasNuxtModule, installModule, resolvePath, tryUseNuxt, useLogger } from '@nuxt/kit'
import { defineEventHandler, setResponseHeader } from 'h3'
import type { NuxtPage } from '@nuxt/schema'
import { clientOptions } from '@druxt/client'
import type { DruxtClient, DruxtConfig, DruxtConnectionConfig } from '@druxt/client'
import { defu } from 'defu'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { hidesBaseUrl, splitDruxtConfig } from './utils/config'
import { addDruxtDefaults, addDruxtProxy, addPrebundle, corePrebundle, DRUXT_DEFAULTS_IMPORT, druxtAnchors, druxtDefaults, druxtProxyRoutes } from './kit'
import type { DruxtAnchorsSetting } from './anchors'
import type { DruxtClassPolicy } from './classes'
import { serverAuthOptions, signedInClient } from './runtime/server/signIn'
import { DRUXT_API_BASE, normalEndpoint, trimEndSlashes } from './routes'
import { druxtApiConflict } from './utils/routes'
import { templateRoute } from './utils/template-route'
import { DRUXT_PRERENDER_MANIFEST, copyFiles, fileCollector, prerenderCollector, prerenderPaths, readPrerenderPages, resolveStatic } from './utils/static'
import type { DruxtStaticState } from './utils/static'
import type { DruxtStaticOptions } from './runtime/types'

import { DRUXT_DEVTOOLS_ICON_ROUTE, DRUXT_DEVTOOLS_ROUTE, devtoolsPage, devtoolsTab, loadDruxtTools, missingToolsMessages } from './utils/devtools'

export type { DruxtPrerenderManifest, DruxtStaticOptions } from './runtime/types'

/**
 * Whether Drupal answered a request and refused it, with a 4xx.
 *
 * Drupal refuses the wrong credentials this way, and a role that may not read. A request with no answer, or a 5xx,
 * means Drupal is away. Another build may not meet that, so it is not a refusal.
 *
 * The status is read from the error, or from one of its causes, up to five errors deep.
 */
const refusedByDrupal = (error: unknown): boolean => {
  for (let at = error as { response?: { status?: number }, cause?: unknown } | undefined, depth = 0; at && depth < 5; at = at.cause as typeof at, depth++) {
    const status = at.response?.status
    if (typeof status === 'number') return status >= 400 && status < 500
  }
  return false
}

/** The credentials for build-time requests. See `createBuildClient()`. */
export interface DruxtBuildAuthOptions {
  clientId?: string
  clientSecret?: string
  username?: string
  password?: string
  scope?: string
}

/** The `druxt.auth` options in nuxt.config. The option names are those of druxt-auth 0.x. */
export interface DruxtAuthModuleOptions {
  clientId: string
  passwordClientId?: string
  /**
   * The Consumer's secret. Prefer NUXT_DRUXT_AUTH_CLIENT_SECRET at runtime, because a secret set here is in the config.
   */
  clientSecret?: string
  scope?: string
  authorizeUrl?: string
  /**
   * The path of the login page Druxt adds, `/user/login` by default.
   *
   * The `druxt-auth` middleware sends a signed-out visitor to it. With `false`, Druxt adds no page, and the middleware
   * sends the visitor to `/login`, as druxt-auth 0.x did. The site provides that page itself.
   */
  login?: string | false
  /** The path of the callback page Druxt adds, `/callback` by default. */
  callback?: string
  /**
   * Keeps the access and refresh tokens in cookies that the browser's scripts can read, as 0.x did.
   *
   * It is for a module that calls Drupal directly from the browser, outside the proxy. It is the weaker setting,
   * because any script on the page can read the tokens.
   *
   * Off by default. When it is off and the proxy is on, the site's server keeps the tokens in httpOnly cookies, and the
   * proxy adds the `Authorization` header.
   */
  exposeToken?: boolean
  /**
   * Whether the password grant, and its `/api/_druxt/auth/token` route, are offered.
   *
   * - Unset: they are offered when `clientSecret` or `passwordClientId` is set at build.
   * - `true`: they are offered. Use it for a secret that arrives only at runtime, or for a public Consumer, which signs
   *   in with no secret.
   * - `false`: neither is offered, and the browser gets no password route. A session the server holds keeps the route
   *   for its code grant and refresh, and the route then refuses the password grant.
   */
  password?: boolean
}

/**
 * The `druxt` options in nuxt.config.
 *
 * Each Druxt module reads its own key, such as `menu`.
 *
 * @example @lang js
 * export default defineNuxtConfig({
 *   modules: ['@druxt/core'],
 *   druxt: {
 *     baseUrl: 'https://api.umami.demo.druxtjs.org',
 *     endpoint: '/jsonapi',
 *     proxy: {
 *       api: true,
 *       files: 'default'
 *     }
 *   }
 * })
 */
export interface DruxtOptions {
  /** The base URL of the Drupal JSON:API backend. Required. */
  baseUrl: string
  /**
   * The site's own origin, for links a page emits about itself, such as the canonical.
   *
   * Unset, the request's origin is used. An empty string counts as unset.
   *
   * Set it in production, in nuxt.config or as NUXT_PUBLIC_DRUXT_SITE_URL. The request's origin, with forwarded
   * headers, is the fallback for development and for a proxy the site trusts.
   */
  siteUrl?: string
  /** The JSON:API endpoint path, `/jsonapi` by default. */
  endpoint: string
  /**
   * The proxy settings.
   *
   * - `api` proxies the JSON:API.
   * - `files` proxies Drupal's site files directory. A string names a multi-site's directory.
   * - `trustForwarded` passes on the forwarding headers a front proxy sets. That is safe only behind a proxy that sets
   *   them. It is read on the server only, and NUXT_DRUXT_PROXY_TRUST_FORWARDED sets it at runtime.
   */
  proxy?: { api?: boolean, files?: boolean | string, trustForwarded?: boolean }
  /**
   * The origin Drupal's files are served from, such as a CDN's, when it is not Drupal's own.
   *
   * The default output makes a file URL absolute when `proxy.files` is off, and on a static build. The URL is made
   * absolute on this origin, or on `baseUrl` when this is unset.
   */
  filesUrl?: string
  /**
   * The process cache. It is on in production unless this is `false`.
   *
   * It keeps the JSON:API index between server requests made without credentials. An entry is kept for as long as
   * Drupal's `Cache-Control` allows, and at most `ttl` seconds.
   *
   * - `content` also keeps every other response: entities, collections, views and route lookups.
   * - `maxSize` bounds each cache area, in bytes, across its consumers. It is 50 MB by default.
   * - `secret` turns on `POST /api/_druxt/cache/clear`. Prefer NUXT_DRUXT_CACHE_SECRET at runtime.
   */
  cache?: false | { content?: boolean, maxSize?: number, ttl?: number, sessionCookie?: string, secret?: string }
  /** Sign-in through Drupal's Simple OAuth. See `DruxtAuthModuleOptions`. */
  auth?: DruxtAuthModuleOptions
  /**
   * Which of Druxt's classes the default output carries.
   *
   * - `true`, the default, keeps every class.
   * - `false` keeps none.
   * - An object names the parts to keep, such as `{ items: false, modifiers: ['field'] }`.
   *
   * A plugin rewrites the classes with `defineDruxtClasses()`.
   */
  classes?: DruxtClassPolicy
  /**
   * Whether the default output names its entities and fields with `data-druxt-*` attributes.
   *
   * An editor, a diff view or the site's tests find the output by them. Unset, it is `'dev'`: on in development only. A
   * module that needs them in production turns them on, unless this is `false`.
   *
   * Read at build.
   */
  anchors?: DruxtAnchorsSetting
  /**
   * Where development tells you a module has no wrapper.
   *
   * - `'devtools'`, the default: the Druxt tab in Nuxt DevTools and Vue DevTools, with a console summary.
   * - `'inline'`: 1.x's inline messages.
   */
  develMessages?: 'devtools' | 'inline'
  /**
   * The static mode, for a site served with no Drupal at run time, as `nuxt generate` makes it.
   *
   * Unset, it follows `nitro.static`. It switches three things together:
   *
   * - File URLs are absolute on `filesUrl` or `baseUrl`, or on the site with `files`.
   * - The build writes the prerender manifest, `/api/_druxt/prerender.json`.
   * - The public config has the static flags, which `useDruxtStaticBuild()` reads.
   *
   * `@druxt/router` reads the manifest. Client navigation then never asks Drupal, and a page that was not built is a
   * 404. With `hybrid`, the router asks Drupal about such a page instead.
   *
   * - `routes`, on by default, prerenders Drupal's published pages, through the `druxt:prerender` hook.
   * - `files` keeps a public file's URL on the site, and copies the file into the output.
   */
  static?: boolean | DruxtStaticOptions
  /**
   * The build credentials, read at build only.
   *
   * The server's own routes read theirs at runtime, from NUXT_DRUXT_BUILD_AUTH_* or DRUXT_BUILD_*. The browser never
   * reads them.
   */
  build?: { auth?: DruxtBuildAuthOptions }
  /**
   * Reserved for a later release: other Drupal sites by name.
   *
   * 2.0 uses the flat keys, which are the `default` connection, and warns about any other name.
   */
  connections?: Record<string, DruxtConnectionConfig>
  [module: string]: unknown
}

// One signed-in build client for each backend, endpoint and set of credentials, so a build signs in once.
const buildClients = new Map<string, Promise<DruxtClient>>()

/**
 * Gets the client for build-time requests, such as the schemas and the languages.
 *
 * With build credentials it signs in first. A build can then read what an anonymous visitor cannot, such as restricted
 * display configuration.
 *
 * `druxt.build.auth` takes:
 *
 * - `clientId` and `clientSecret`, for Simple OAuth's client credentials grant.
 * - `username` and `password` as well, for the password grant.
 *
 * Each falls back to its variable: DRUXT_BUILD_CLIENT_ID, DRUXT_BUILD_CLIENT_SECRET, DRUXT_BUILD_USERNAME and
 * DRUXT_BUILD_PASSWORD.
 *
 * The credentials stay in the build. The server's own routes read theirs at runtime, from the private runtime config or
 * the same variables.
 *
 * @param options - The druxt options.
 * @returns The client. One client is shared for each backend, endpoint and set of credentials.
 */
export const createBuildClient = (options: DruxtOptions): Promise<DruxtClient> =>
  signedInClient(buildClients, options.baseUrl, clientOptions(options as unknown as DruxtConfig) as Record<string, unknown>, buildAuth(options))

/**
 * Gets the build's credentials.
 *
 * They come from `druxt.build.auth`. Each key falls back to its `DRUXT_BUILD_*` variable, read at build.
 *
 * @param options - The druxt options.
 * @returns The credentials. A key with no value is undefined.
 */
export const buildAuth = (options: DruxtOptions): DruxtBuildAuthOptions => {
  const env = process.env
  const given: DruxtBuildAuthOptions = options.build?.auth || {}
  return {
    clientId: given.clientId || env.DRUXT_BUILD_CLIENT_ID,
    clientSecret: given.clientSecret || env.DRUXT_BUILD_CLIENT_SECRET,
    username: given.username || env.DRUXT_BUILD_USERNAME,
    password: given.password || env.DRUXT_BUILD_PASSWORD,
    scope: given.scope || env.DRUXT_BUILD_SCOPE,
  }
}

/**
 * Writes the hint for a site whose build read too little from Drupal.
 *
 * Drupal omits what the build may not read, and names the permissions it needs. The error's message keeps those names.
 *
 * The hint depends on the build's credentials and on the error, if any:
 *
 * - With no credentials, it names them, the scope among them.
 * - With credentials and no scope, it names the scope. A Simple OAuth token carries no roles unless a scope is
 *   requested.
 * - With credentials and a scope, and Drupal omitting resources, it names the scope's roles.
 * - Otherwise it is empty.
 *
 * @param auth - The build's credentials, from `buildAuth()`.
 * @param error - The build's error, when it failed.
 * @returns The hint, or an empty string.
 *
 * @example @lang ts
 * logger.error(`Druxt schemas could not be generated: ${error.message} ${buildCredentialsHint(buildAuth(options), error)}`)
 */
export const buildCredentialsHint = (auth: DruxtBuildAuthOptions, error?: Error): string => {
  // `DruxtPermissionsError`, from @druxt/client, puts Drupal's omission in its message as "Required permissions:" and a
  // list. `DruxtClient.error()` keeps that as the detail of its own message. So matching the text detects the omission
  // in either error.
  const omitted = /Required permissions/.test(error?.message || '')
  if (!serverAuthOptions(auth)) {
    return 'If display configuration is restricted, set build credentials in druxt.build.auth, or DRUXT_BUILD_CLIENT_ID with DRUXT_BUILD_CLIENT_SECRET, or with DRUXT_BUILD_USERNAME and DRUXT_BUILD_PASSWORD. Set DRUXT_BUILD_SCOPE to a scope that grants a role with the permissions Drupal names.'
  }
  if (!auth.scope) {
    return `${omitted ? 'Drupal omitted resources from the build, likely for a missing scope. ' : ''}Build credentials are set with no scope, and a Simple OAuth token carries no roles unless a scope is requested. Set druxt.build.auth.scope or DRUXT_BUILD_SCOPE to a scope that grants a role with the permissions Drupal names.`
  }
  if (omitted) return `Drupal omitted resources from the build: check that the scope '${auth.scope}' grants a role with the permissions Drupal names.`
  return ''
}

/** A Drupal language, and the URL prefix Drupal serves it under. The prefix is empty when it has none. */
export interface DruxtLanguage {
  langcode: string
  prefix: string
  /** Set on the default language, the one Drupal answers in at the unprefixed endpoint. */
  default?: true
  /**
   * The language's label, as Drupal names it in its own language, such as `Spanish`.
   *
   * Drupal's configurable language holds no native name, such as `Español`. A switcher that wants one maps it from the
   * langcode.
   */
  label?: string
}

// The language reads, one for each backend and endpoint. In a build, core, the router and the entity module share one
// read. Outside a build, such as in a test, the process shares one.
const buildLanguageReads = new WeakMap<object, Map<string, Promise<DruxtLanguage[]>>>()
const processLanguageReads = new Map<string, Promise<DruxtLanguage[]>>()

// The messages already warned. Core, the router and the entity module each read the languages, so each message is
// warned once in a process.
const warned = new Set<string>()
const warnOnce = (message: string): void => {
  if (warned.has(message)) return
  warned.add(message)
  useLogger('@druxt/core').warn(message)
}

/**
 * Reads Drupal's languages and their URL prefixes, at build, through the build client.
 *
 * Drupal keeps the prefixes in `language.negotiation`, which no JSON:API resource holds. So they are read from Drupal's
 * own answers. The questions are asked without credentials, so no negotiator by user or session takes part:
 *
 * - An unprefixed request is answered in the default language, which Drupal names in its `Content-Language` header. The
 *   index's `self` link carries that language's prefix, which is empty when it has none.
 * - When Drupal publishes `language.negotiation` to a visitor, through decoupled settings, a language's configured
 *   prefix is read from it. Only this reads a prefix that is neither the langcode nor the default language's.
 * - Each other language is asked for under its langcode. When the langcode is its prefix, Drupal answers in that
 *   language, with its index at that prefix.
 *
 * A language whose prefix cannot be read keeps its langcode as its prefix, with a build warning. That happens when an
 * answer does not match, and when a request fails. 1.x assumed the langcode for every language.
 *
 * One build reads once, for every module. A read that fails is forgotten, so the next call reads again.
 *
 * @param options - The druxt options.
 * @returns The languages, without `und` and `zxx`.
 *
 * @example @lang ts
 * const languages = await getLanguages(options)
 * // [{ langcode: 'en', prefix: 'english' }, { langcode: 'es', prefix: 'es' }]
 */
export const getLanguages = (options: DruxtOptions): Promise<DruxtLanguage[]> => {
  const nuxt = tryUseNuxt()
  let reads = processLanguageReads
  if (nuxt) {
    reads = buildLanguageReads.get(nuxt) || new Map()
    buildLanguageReads.set(nuxt, reads)
  }
  const key = `${trimEndSlashes(options.baseUrl)} ${normalEndpoint(options.endpoint)}`
  let read = reads.get(key)
  if (!read) {
    read = readLanguages(options)
    reads.set(key, read)
    read.catch(() => reads.delete(key))
  }
  return read
}

/** Reads the languages from Drupal. `getLanguages()` shares one call of this between its callers. */
const readLanguages = async (options: DruxtOptions): Promise<DruxtLanguage[]> => {
  const endpoint = normalEndpoint(options.endpoint)
  const type = 'configurable_language--configurable_language'
  // The probes ask as a visitor, through a client that never signs in.
  const anonymous = await signedInClient(buildClients, options.baseUrl, clientOptions(options as unknown as DruxtConfig) as Record<string, unknown>, {})

  // Asks Drupal for `path` as a visitor. The answer has the language Drupal answered in, the path the index names
  // itself at, under the base URL, and the resource types the index lists. A failed request gives none of them.
  const answer = async (path: string): Promise<{ langcode?: string, self?: string, types?: string[] }> => {
    try {
      const response = await anonymous.request<{ links?: Record<string, { href?: string }> }>(path, { auth: false, validateStatus: () => true })
      if (response.status < 200 || response.status >= 300) return {}
      const href = response.data?.links?.self?.href
      let self: string | undefined
      if (href) {
        const root = `${trimEndSlashes(options.baseUrl)}/`
        const base = new URL(root).pathname
        const pathname = new URL(href, root).pathname
        self = pathname.startsWith(base) ? `/${pathname.slice(base.length)}` : pathname
      }
      return { langcode: response.headers.get('content-language') || undefined, self, types: Object.keys(response.data?.links || {}) }
    } catch {
      return {}
    }
  }

  // The prefix of an index at `/<prefix><endpoint>`. It is empty for the endpoint itself. Any other path is not
  // trusted, and gives undefined.
  const prefixOf = (self?: string): string | undefined => {
    if (!self?.endsWith(endpoint)) return undefined
    const prefix = self.slice(0, -endpoint.length)
    if (!prefix) return ''
    return /^\/[^/]+$/.test(prefix) ? prefix.slice(1) : undefined
  }

  // The unprefixed index is read first, as a visitor. The index lists every resource type, whatever the reader may see.
  //
  // When it does not list the language type, the language module is not installed. The site then has one language and
  // no prefixes, and nothing more is read: no sign-in, and no other request.
  //
  // A residual risk: core's JSON:API lists every resource type to every reader, but a contrib module could change the
  // entry point by role. It could hide the language type from a visitor while the build's account may see it. That site
  // would read as having one language. No known module does so.
  const unprefixed = await answer(endpoint)
  if (unprefixed.types && !unprefixed.types.includes(type)) return []

  // The languages are read through the build's client, which is signed in when it has credentials.
  const druxt = await createBuildClient(options)
  if (!unprefixed.types) {
    // The anonymous index failed, so the build's own index says whether the language module is installed.
    const entry = await druxt.getIndex(type)
    if (!entry || !entry.href) return []
  }
  const query = new DrupalJsonApiParams().addFields(type, ['drupal_internal__id', 'label'])
  const read = (await druxt.getCollectionAll(type, query)).flatMap((collection) => collection.data)
  // Each language's name, for a language switcher.
  const labels = new Map(read.map((language) => [String(language.attributes?.drupal_internal__id), language.attributes?.label]))
  const langcodes = read.map((language) => String(language.attributes?.drupal_internal__id))
    .filter((langcode) => !['und', 'zxx'].includes(langcode))
  if (!langcodes.length) {
    if (!serverAuthOptions(buildAuth(options))) {
      warnOnce(`Drupal at ${options.baseUrl} lists languages but shows none to an anonymous build, so no language prefixes are proxied or routed. Set build credentials in druxt.build.auth, or the DRUXT_BUILD_* variables, with a scope whose role may view configurable languages.`)
    }
    return []
  }
  const defaultPrefix = unprefixed.langcode ? prefixOf(unprefixed.self) : undefined

  // Drupal's configured prefixes, when the decoupled_settings module publishes `language.negotiation` to a visitor.
  // Only this reads a prefix that is neither the langcode nor the default language's. Undefined otherwise.
  const configured = await (async (): Promise<Record<string, string> | undefined> => {
    try {
      const response = await anonymous.request<{ data?: { attributes?: { settings?: Record<string, { url?: { prefixes?: unknown } } | undefined> } } }>(`${endpoint}/decoupled/settings`, { auth: false, validateStatus: () => true })
      if (response.status !== 200) return undefined
      const prefixes = response.data?.data?.attributes?.settings?.['language.negotiation']?.url?.prefixes
      if (!prefixes || typeof prefixes !== 'object') return undefined
      return Object.fromEntries(Object.entries(prefixes as Record<string, unknown>).filter(([, prefix]) => typeof prefix === 'string')) as Record<string, string>
    } catch {
      return undefined
    }
  })()

  // The other languages are probed at the same time.
  const prefixes = await Promise.all(langcodes.map(async (langcode): Promise<string> => {
    if (langcode === unprefixed.langcode && defaultPrefix !== undefined) return defaultPrefix
    if (configured && typeof configured[langcode] === 'string') return configured[langcode]
    const prefixed = await answer(`/${langcode}${endpoint}`)
    if (prefixed.langcode === langcode && prefixOf(prefixed.self) === langcode) return langcode
    warnOnce(`The URL prefix of the language '${langcode}' on Drupal at ${options.baseUrl} could not be read, so '/${langcode}' is assumed. Requests under its real prefix are neither proxied nor routed.`)
    return langcode
  }))
  return langcodes.map((langcode, index) => {
    const label = labels.get(langcode)
    const isDefault = langcode === unprefixed.langcode && defaultPrefix !== undefined
    return { langcode, prefix: prefixes[index]!, ...(isDefault ? { default: true as const } : {}), ...(typeof label === 'string' && label ? { label } : {}) }
  })
}

/**
 * Gets the URL prefixes Drupal serves its languages under, from `getLanguages()`.
 *
 * They are Drupal's configured prefixes, such as `/english` for `en`. A language with no prefix is served unprefixed,
 * and is left out. That is usually the default language.
 *
 * @param options - The module options.
 * @returns Prefixes such as `/en`.
 */
export const getLanguagePrefixes = async (options: DruxtOptions): Promise<string[]> =>
  (await getLanguages(options)).filter((language) => language.prefix).map((language) => `/${language.prefix}`)

/**
 * The Druxt core Nuxt module.
 *
 * It provides:
 *
 * - The `$druxt` client.
 * - The Pinia store the Druxt modules share.
 * - The DruxtWrapper and DruxtDebug components.
 * - Global registration of every `Druxt*` component, so a site overrides rendering by naming a component.
 *
 * @example <caption>Installing the Druxt module</caption> @lang js
 * // nuxt.config.ts
 * export default defineNuxtConfig({
 *   modules: ['@druxt/core'],
 *   druxt: {
 *     baseUrl: 'https://api.umami.demo.druxtjs.org'
 *   }
 * })
 *
 * @example <caption>Nuxt configuration with module options</caption> @lang js
 * // nuxt.config.ts
 * export default defineNuxtConfig({
 *   modules: [
 *     ['@druxt/core', { baseUrl: 'https://api.umami.demo.druxtjs.org' }]
 *   ]
 * })
 */
export default defineNuxtModule<DruxtOptions>({
  meta: {
    name: '@druxt/core',
    configKey: 'druxt',
  },

  defaults: {
    baseUrl: '',
    // The key is present so NUXT_PUBLIC_DRUXT_SITE_URL can set it. Nuxt applies the environment only to keys that
    // exist.
    siteUrl: '',
    // The key is present so NUXT_PUBLIC_DRUXT_FILES_URL can set it.
    filesUrl: '',
    endpoint: '/jsonapi',
    proxy: { api: false },
  },

  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const logger = useLogger('@druxt/core')

    if (!options.baseUrl) {
      throw new Error('[druxt] The `druxt.baseUrl` option is required.')
    }
    options.baseUrl = options.baseUrl.replace(/\/$/, '')
    if (options.siteUrl) options.siteUrl = trimEndSlashes(options.siteUrl)

    // One spelling of the endpoint, for the proxy's paths, the language read and the app's runtime config.
    options.endpoint = normalEndpoint(options.endpoint)

    // Drupal's paths on the site must stay clear of Druxt's own routes. Each language's prefix is checked later, once
    // it is read.
    const filesPath = options.proxy?.files ? `/sites/${typeof options.proxy.files === 'string' ? options.proxy.files : 'default'}/files` : undefined
    const conflict = druxtApiConflict({ endpoints: [options.endpoint], files: filesPath ? [filesPath] : [] })
    if (conflict) throw new Error(`[druxt] ${conflict}`)

    // An unknown value, such as 1.x's removed 'indicator', falls back to the development tools. The warning names it
    // once.
    const develMessages: unknown = options.develMessages
    if (develMessages !== undefined && develMessages !== 'devtools' && develMessages !== 'inline') {
      logger.warn(`\`druxt.develMessages\` is ${JSON.stringify(develMessages)}, which is not a valid value: use 'devtools' or 'inline'. The development tools are used.`)
    }

    // The site's anchors setting. Modules that require anchors are settled against it once every module is installed.
    const anchorsSetting: unknown = options.anchors
    if (anchorsSetting !== undefined && anchorsSetting !== true && anchorsSetting !== false && anchorsSetting !== 'dev') {
      logger.warn(`\`druxt.anchors\` is ${JSON.stringify(anchorsSetting)}, which is not a valid value: use true, false or 'dev'. 'dev' is used.`)
    }
    const anchors = druxtAnchors(nuxt)
    const siteAnchors = anchorsSetting === true || anchorsSetting === false || anchorsSetting === 'dev'
    anchors.setting = siteAnchors ? anchorsSetting : 'dev'

    // The process cache keeps the JSON:API index between server requests that carry no credentials. It is on in
    // production only. The session cookie's pattern is read first, because the proxy still reads it in development.
    const sessionCookie = (options.cache || undefined)?.sessionCookie
    if (options.cache !== false) {
      options.cache = nuxt.options.dev ? false : { ...options.cache }
    }

    // Auth, which druxt-auth 0.x built on @nuxtjs/auth-next.
    if (options.auth) {
      if (!options.auth.clientId) throw new Error('[druxt] `druxt.auth` requires a clientId.')
      options.auth = {
        login: '/user/login',
        callback: '/callback',
        ...options.auth,
        // Whether the password grant is offered. An explicit `true` or `false` wins. `true` is for a secret that
        // arrives only at runtime, or for a public Consumer with no secret. Unset, the grant is offered when the build
        // has a secret, or the grant has a Consumer of its own.
        password: options.auth.password ?? !!(options.auth.clientSecret || options.auth.passwordClientId),
        // The site's server holds the session wherever the proxy carries the browser's requests to Drupal. The tokens
        // are then out of the browser's reach.
        session: !!options.proxy?.api && !options.auth.exposeToken,
      } as typeof options.auth

      // On Simple OAuth 6, a token holds the roles its scopes name. With no scope it holds none.
      if (!options.auth.scope) {
        logger.warn('DRUXT_E01004: druxt.auth signs visitors in with no druxt.auth.scope. On Simple OAuth 6 a token holds only the roles its scopes name, so a signed-in editor reads less than an anonymous visitor, and Drupal refuses what anonymous may read. Set druxt.auth.scope to the scopes of the roles your editors need, separated by spaces.')
      }
    }

    // The options are split once. The secrets go into the private runtime config, on the server only. Everything else
    // goes into the public one, which reaches the browser.
    //
    // Each private key exists, and is empty unless set. So NUXT_DRUXT_AUTH_CLIENT_SECRET, NUXT_DRUXT_CACHE_SECRET and
    // NUXT_DRUXT_BUILD_AUTH_* set them at runtime. A secret is never read from the build's environment, because that
    // would bake it into the output.
    const split = splitDruxtConfig(options, sessionCookie)

    // The secrets are also taken out of the options, which other modules and the devtools read. The build's own
    // credentials stay, for modules that read Drupal at build time.
    const given = (nuxt.options as unknown as { druxt?: DruxtOptions }).druxt
    if (given?.auth?.clientSecret) {
      const { clientSecret, ...auth } = given.auth
      void clientSecret
      given.auth = auth
    }
    if (given?.cache && given.cache.secret) {
      const { secret, ...cache } = given.cache
      void secret
      given.cache = cache
    }

    // The ignored connections carry credentials too. They are not read, and they are not left in the options either.
    const connections = (given as { connections?: Record<string, Record<string, Record<string, unknown> | undefined>> } | undefined)?.connections
    // `connections.default` is the flat keys, so an entry for it is not read either.
    const stripped = [...split.ignored, ...(connections && 'default' in connections ? ['default'] : [])]
    for (const name of stripped) {
      const { consumer, browser } = connections?.[name] || {}
      if (consumer) {
        delete consumer.secret
        if (typeof consumer.password === 'string') delete consumer.password
      }
      if (browser) delete browser.secret
    }
    if (stripped.includes('default')) logger.warn('`druxt.connections.default` is ignored: use the flat `druxt` keys for the default connection.')
    for (const name of split.ignored) {
      logger.warn(`\`druxt.connections.${name}\` is ignored: named connections are reserved for a later release, and the flat \`druxt\` keys are the default connection.`)
    }
    nuxt.options.runtimeConfig.druxt = defu(nuxt.options.runtimeConfig.druxt as object | undefined, split.private)

    // The public config is written through a plain record, because Nuxt types it from whichever app was prepared.
    const publicConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    publicConfig.druxt = defu(publicConfig.druxt as object | undefined, split.public)

    // The modules' default settings are written into the build. The app and the server resolve them below Drupal's
    // settings and the site's config.
    //
    // They are not put in the public runtime config, because that outranks Drupal, and environment variables change it.
    //
    // The template reads the defaults when it is written, after every module has registered its own.
    const defaults = addTemplate({
      filename: 'druxt/defaults.mjs',
      write: true,
      getContents: () => `export default ${JSON.stringify(druxtDefaults(nuxt))}\n`,
    })
    nuxt.options.alias[DRUXT_DEFAULTS_IMPORT] = defaults.dst
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = { ...nitroConfig.alias, [DRUXT_DEFAULTS_IMPORT]: defaults.dst }
    })
    addTypeTemplate({
      filename: 'types/druxt-defaults.d.ts',
      getContents: () => [
        `declare module '${DRUXT_DEFAULTS_IMPORT}' {`,
        '  const defaults: Record<string, unknown>',
        '  export default defaults',
        '}',
        '',
      ].join('\n'),
    }, { nuxt: true, nitro: true })

    // The site's languages are read once, for the app's map and the proxy's prefixes, so the two agree.
    //
    // - A read that Drupal refuses, as with the wrong build credentials, stops a production build. Otherwise the site
    //   would be built with one language and only a warning to say so, from a mistake a rebuild does not mend.
    // - A read with no answer, as when the build cannot reach Drupal, warns once and reads as no languages.
    // - Any failure in development does the same.
    //
    // With no languages read, no default language is known, and the proxy serves only the unprefixed endpoint.
    let siteLanguages: Promise<DruxtLanguage[]> | undefined
    const readSiteLanguages = () => siteLanguages ||= getLanguages(options).catch((error: unknown) => {
      const proxied = options.proxy?.api ? `, and the proxy serves only the unprefixed ${options.endpoint}, not its language-prefixed paths, until a build reads them` : ''
      const reason = (error as Error)?.message || error
      if (!nuxt.options.dev && refusedByDrupal(error)) throw new Error(`[druxt] DRUXT_E01008: Drupal at ${options.baseUrl} refused the read of the site's languages, so the build stops: it would route and proxy no language prefix. Check the build's credentials and what their role may read: ${reason}`, { cause: error })
      useLogger('@druxt/core').warn(`The site's languages could not be read, so no default language is known${proxied}: ${reason}`)
      return []
    })

    // A production build reads now. A refusal then stops the build here, with its own message, and not as a template
    // that could not be written.
    if (!nuxt.options._prepare && !nuxt.options.dev) await readSiteLanguages()

    // The site's languages and their prefixes, as read at build, for the app and the server. The language served
    // unprefixed is the default: the language of every unprefixed page.
    const languages = addTemplate({
      filename: 'druxt/languages.mjs',
      write: true,
      getContents: async () => {
        const read = nuxt.options._prepare ? [] : await readSiteLanguages()
        return `export const languages = ${JSON.stringify(read.map(({ langcode, prefix, label }) => ({ langcode, prefix, ...(label ? { label } : {}) })))}\n`
      },
    })
    nuxt.options.alias['#druxt/languages'] = languages.dst
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = { ...nitroConfig.alias, '#druxt/languages': languages.dst }
    })
    addTypeTemplate({
      filename: 'types/druxt-languages.d.ts',
      getContents: () => [
        `declare module '#druxt/languages' {`,
        '  export const languages: Array<{ langcode: string, prefix: string, label?: string }>',
        '}',
        '',
      ].join('\n'),
    }, { nuxt: true, nitro: true })

    if (options.cache) {
      addServerHandler({ route: `${DRUXT_API_BASE}/cache/clear`, handler: resolve('./runtime/server/routes/cacheClear') })
    }

    // Where Druxt's server routes keep what they hold between requests. It is memory by default. A site shares it
    // across instances by mounting a driver of its own.
    nuxt.options.nitro.storage = defu(nuxt.options.nitro.storage, { druxt: { driver: 'memory' } })

    // Settings from Drupal, as a decoupled-settings fetcher stores them. They are read once for each request, on
    // demand.
    addServerPlugin(await resolvePath(resolve('./runtime/server/plugins/druxt')))
    addServerPlugin(await resolvePath(resolve('./runtime/server/plugins/origin')))
    addServerImports([
      { name: 'useDruxtServerSettings', from: resolve('./runtime/server/settings') },
      { name: 'storeDrupalSettings', from: resolve('./runtime/server/storage') },
    ])

    // Drupal is proxied through Nitro, which replaces @nuxtjs/proxy. The JSON:API is proxied under each language's
    // configured prefix. The files directory is `sites/default/files` unless a site is named.
    //
    // Druxt's own routes, under DRUXT_API_BASE, answer before the proxy. So a JSON:API at `/api` leaves them in place.
    if (options.proxy?.api) {
      const read = nuxt.options._prepare ? [] : await readSiteLanguages()
      const prefixes = ['', ...read.filter((language) => language.prefix).map((language) => `/${language.prefix}`)]
      const prefixed = druxtApiConflict({ endpoints: prefixes.map((prefix) => `${prefix}${options.endpoint}`) })
      if (prefixed) throw new Error(`[druxt] ${prefixed}`)
      for (const prefix of prefixes) addDruxtProxy(nuxt, `${prefix}${options.endpoint}/**`)
    }
    if (filesPath) addDruxtProxy(nuxt, `${filesPath}/**`)

    // One handler serves every proxied path. It reads the base URL at request time, so a runtime
    // NUXT_PUBLIC_DRUXT_BASE_URL moves the browser's requests along with the server's.
    //
    // The handler is registered once every module is installed, because the router adds a path of its own.
    const proxyRoutes = addTemplate({
      filename: 'druxt/proxy-routes.mjs',
      write: true,
      getContents: () => `export default ${JSON.stringify(druxtProxyRoutes(nuxt))}\n`,
    })
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = { ...nitroConfig.alias, '#druxt/proxy-routes': proxyRoutes.dst }
    })
    addTypeTemplate({
      filename: 'types/druxt-proxy-routes.d.ts',
      getContents: () => [
        `declare module '#druxt/proxy-routes' {`,
        '  const routes: string[]',
        '  export default routes',
        '}',
        '',
      ].join('\n'),
    }, { nuxt: true, nitro: true })
    const proxyHandler = resolve('./runtime/server/routes/proxy')

    // A static build, as `nuxt generate` makes it, has no server to proxy Drupal's files. So the default output makes
    // their URLs absolute. The browser reads the static flag from the public config, so hydration renders the same
    // URLs.
    let staticState: DruxtStaticState = { enabled: false, routes: false, files: false, hybrid: false }
    nuxt.hook('modules:done', () => {
      staticState = resolveStatic(options.static, !!((nuxt.options as { _generate?: boolean })._generate || nuxt.options.nitro?.static))
      // Drupal's address stays out of the pages when nothing in the browser uses it.
      if (hidesBaseUrl(options, staticState)) (publicConfig.druxt as Record<string, unknown>).baseUrlHidden = true
      if (!staticState.enabled) return
      ;(publicConfig.druxt as Record<string, unknown>).staticBuild = true
      // With `static.files`, a public file's URL stays on the site, where the build copies the file.
      if (staticState.files) (publicConfig.druxt as Record<string, unknown>).staticFiles = true
      // With `static.hybrid`, a page the build did not generate is still asked of Drupal.
      if (staticState.hybrid) (publicConfig.druxt as Record<string, unknown>).staticHybrid = true
      if (options.proxy?.files && !staticState.files) {
        logger.warn(`DRUXT_E01002: druxt.proxy.files applies only to a server deployment. A static build has no proxy, so Drupal's file URLs are absolute on ${options.filesUrl || options.baseUrl}. Set druxt.static.files to copy the files into the build.`)
      }
    })

    // The pages a static build prerenders. They are Drupal's published pages under each language's prefix, and then
    // whatever the `druxt:prerender` hook adds or removes. Nitro's own routes, and the links it crawls, are added as
    // usual.
    nuxt.hook('nitro:config', async (nitroConfig) => {
      if (!staticState.enabled || nuxt.options._prepare) return
      const routes = new Set<string>()
      // A read of the pages that fails stops the build, and names what it could not list. A static site that is missing
      // those pages is worse. The languages are the ones the app and the proxy read, so the three agree.
      if (staticState.routes) {
        const languages = await readSiteLanguages()
        for (const path of prerenderPaths(languages, await readPrerenderPages(await createBuildClient(options), languages, staticState.types))) routes.add(path)
      }
      await nuxt.callHook('druxt:prerender', routes)
      if (!routes.size) return
      nitroConfig.prerender ||= {}
      nitroConfig.prerender.routes = [...new Set([...(nitroConfig.prerender.routes || []), ...routes])]
    })

    // The prerender manifest lists the pages the build generated and the redirect pages it wrote. It is for the
    // browser. There, @druxt/router follows a redirect page from it, and answers a page that was not built with a 404.
    //
    // With `static.files`, the files the pages name are found in each page's HTML and payload, as they are written.
    // They are copied into the output once the prerender is done.
    nuxt.hook('nitro:init', (nitro) => {
      if (!staticState.enabled) return
      const collect = prerenderCollector()
      const files = fileCollector(nuxt.options.app.baseURL)
      nitro.hooks.hook('prerender:generate', (route) => {
        collect.add(route)
        if (staticState.files && !route.error && /\.(?:html|json)$/.test(route.fileName || '')) {
          const contents = route.contents
          if (typeof contents === 'string') files.scan(contents)
        }
      })
      nitro.hooks.hook('prerender:done', async () => {
        if (staticState.files) {
          const copied = await copyFiles(files.files, { origin: options.filesUrl || options.baseUrl, publicDir: nitro.options.output.publicDir, warn: (message) => logger.warn(message) })
          logger.info(`Copied ${copied} of ${files.files.length} files the pages name from Drupal into the static build.`)
        }
        const file = join(nitro.options.output.publicDir, DRUXT_PRERENDER_MANIFEST)
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, `${JSON.stringify(collect.manifest())}\n`)
      })
    })
    nuxt.hook('modules:done', () => {
      // A route ending in `/**` matches the paths below it. So the path itself, such as the JSON:API index, is added as
      // a route too.
      const routes = druxtProxyRoutes(nuxt).flatMap((route) => route.endsWith('/**') ? [route.slice(0, -3), route] : [route])
      for (const route of new Set(routes)) addServerHandler({ route, handler: proxyHandler })
    })

    await addPrebundle(nuxt, corePrebundle())

    if (!hasNuxtModule('@pinia/nuxt')) {
      await installModule('@pinia/nuxt')
    }

    addPlugin(resolve('./runtime/plugins/druxt'))
    addPlugin({ src: resolve('./runtime/plugins/origin.server'), mode: 'server' })
    addImports({ name: 'useDruxtClient', from: resolve('./runtime/composables') })
    addImports({ name: 'useDruxtStore', from: resolve('./runtime/store') })

    // Editing: the drafts every editor shares, and whether the session may edit. It is on unless the site turns it off.
    addImports({ name: 'useDruxtEditStore', from: resolve('./runtime/edit-store') })
    addImports({ name: 'useDruxtEditing', from: resolve('./runtime/editing') })
    addDruxtDefaults(nuxt, { editing: { enabled: true, destination: 'jsonapi', persistDrafts: true } })
    for (const name of ['useDruxtSettings', 'setDrupalSettings']) {
      addImports({ name, from: resolve('./runtime/settings') })
    }

    // The class policy: every class, unless the site or Drupal says otherwise. A plugin rewrites the classes with a
    // hook.
    addDruxtDefaults(nuxt, { classes: true })
    for (const name of ['defineDruxtClasses', 'useDruxtClasses']) {
      addImports({ name, from: resolve('./runtime/classes') })
    }
    addImports({ name: 'useDruxtAnchors', from: resolve('./runtime/anchors') })
    addImports({ name: 'useDruxtFileUrl', from: resolve('./runtime/files') })

    // What a site's own modules and wrappers are built from, and the languages the build read.
    for (const name of ['useDruxtModule', 'useDruxtModuleContext', 'druxtModuleProps', 'druxtModuleEmits', 'useDruxtDevtools', 'useDruxtPageTitle', 'useDruxtLanguages']) {
      addImports({ name, from: resolve('./runtime/index') })
    }
    addPlugin(resolve('./runtime/plugins/pinia'))

    const auth = options.auth
    if (auth) {
      // The browser's token and userinfo requests, proxied on this origin.
      if (options.proxy?.api) {
        for (const path of ['/oauth/token', '/oauth/userinfo']) addDruxtProxy(nuxt, path)
      }

      // The token route is registered when the password grant is offered, or when the server holds the session. A
      // session's sign-in, refresh and sign-out run through it. The secret, if any, is read at runtime.
      const session = (auth as { session?: boolean }).session
      if (auth.password || session) {
        addServerHandler({ route: `${DRUXT_API_BASE}/auth/token`, method: 'post', handler: resolve('./runtime/server/routes/token') })
      }
      if (session) addServerHandler({ route: `${DRUXT_API_BASE}/auth/logout`, method: 'post', handler: resolve('./runtime/server/routes/logout') })

      // `DRUXT_AUTH_SIGNED_IN` is the name of the error a sign-in rejects with while signed in. A site tells that
      // refusal apart by it.
      for (const name of ['useDruxtAuth', 'DRUXT_AUTH_SIGNED_IN']) addImports({ name, from: resolve('./runtime/auth') })
      addRouteMiddleware({ name: 'druxt-auth', path: resolve('./runtime/middleware/auth') })
      addComponent({ name: 'DruxtAuthLogin', filePath: await resolvePath(resolve('./runtime/components/DruxtAuthLogin')), global: true })

      // The callback and login routes, unless the site has its own.
      nuxt.options.pages = true
      nuxt.hook('pages:extend', async (pages) => {
        const routes: NuxtPage[] = [
          { name: 'druxt-auth-callback', path: auth.callback || '/callback', file: await resolvePath(resolve('./runtime/pages/DruxtAuthCallback')) },
        ]
        if (auth.login) routes.push({ name: 'druxt-auth-login', path: auth.login, file: await resolvePath(resolve('./runtime/pages/DruxtAuthLoginPage')) })
        // A site's page may be a child, such as pages/user/login.vue beside pages/user.vue. A child's path is under
        // its parent's, unless it starts with a slash.
        const has = (path: string, among: NuxtPage[], parent = ''): boolean => among.some((page) => {
          const full = page.path.startsWith('/') ? page.path : `${parent}/${page.path}`
          const whole = trimEndSlashes(full).toLowerCase()
          return whole === path || has(path, page.children || [], whole)
        })
        for (const route of routes) {
          if (!has(trimEndSlashes(route.path).toLowerCase(), pages)) pages.unshift(route)
        }
      })
    }

    // DruxtWrapper is registered sync. It renders on nearly every page, so loading it lazily gains nothing, and wraps
    // each one in an async wrapper instance. DruxtDebug renders on few pages, so it stays lazy and out of the entry.
    addComponent({ name: 'DruxtWrapper', filePath: resolve('./runtime/components/DruxtWrapper.vue'), global: 'sync' })
    addComponent({ name: 'DruxtDebug', filePath: resolve('./runtime/components/DruxtDebug.vue'), global: true })

    // The development template tool creates a wrapper component file from the module a developer is looking at. It is
    // for development only, and only for this machine: the connection must come from this machine, and the Host must be loopback, which a tunnel's public host is not.
    if (nuxt.options.dev) {
      const componentsDir = join(nuxt.options.srcDir, 'components')
      addDevServerHandler({ route: `${DRUXT_API_BASE}/template`, handler: templateRoute(componentsDir) })
    }

    // A production build gets a DruxtDevelTemplate that renders nothing, so none of the tool's markup ships.
    addComponent({
      name: 'DruxtDevelTemplate',
      filePath: nuxt.options.dev ? resolve('./runtime/components/DruxtDevelTemplate.vue') : await resolvePath(resolve('./runtime/components/DruxtDevelTemplateProduction')),
      global: true,
    })

    // The development tools come from optional packages, in development only:
    //
    // - @druxt/devtools, for the model, the element and the console summary.
    // - @nuxt/devtools-kit, for the Nuxt DevTools tab.
    // - @vue/devtools-api, for Vue DevTools.
    //
    // Each is imported here, and never by a file a production build reads. A missing one is skipped.
    const tools = nuxt.options.dev ? await loadDruxtTools((name) => import(name), logger) : undefined
    const hasNuxtDevtools = () => hasNuxtModule('@nuxt/devtools', nuxt) || hasNuxtModule('@nuxt/devtools-nightly', nuxt)
    if (tools) nuxt.hook('modules:done', () => { for (const message of missingToolsMessages(tools, hasNuxtDevtools())) logger.info(message) })

    // What development may load: Nuxt DevTools in the app, Vue DevTools' API, and the Druxt tools. Whether the app has
    // Nuxt DevTools is read once every module is installed.
    addTemplate({
      filename: 'druxt/devtools.mjs',
      getContents: () => [
        `export const nuxtDevtools = ${!!tools?.kit && hasNuxtDevtools()}`,
        `export const vueDevtools = ${!!tools?.vue}`,
        `export const druxtDevtools = ${!!tools?.druxt}`,
        '',
      ].join('\n'),
    })

    // Whether the default output carries the anchors, and the modules that required them. Both are settled once every
    // module is installed.
    addTemplate({
      filename: 'druxt/anchors.mjs',
      // `site`, for the development tools: whether the site set `druxt.anchors` itself.
      getContents: () => `export default ${JSON.stringify(anchors.state)}\nexport const site = ${siteAnchors}\n`,
    })
    addTypeTemplate({
      filename: 'types/druxt-anchors.d.ts',
      getContents: () => [
        `declare module '#build/druxt/anchors.mjs' {`,
        '  const anchors: { enabled: boolean, requiredBy: string[], disabledBy?: \'site\' }',
        '  export default anchors',
        '  export const site: boolean',
        '}',
        '',
      ].join('\n'),
    }, { nuxt: true })
    addTypeTemplate({
      filename: 'types/druxt-devtools.d.ts',
      getContents: () => [
        `declare module '#build/druxt/devtools.mjs' {`,
        '  export const nuxtDevtools: boolean',
        '  export const vueDevtools: boolean',
        '  export const druxtDevtools: boolean',
        '}',
        '',
      ].join('\n'),
    }, { nuxt: true })
    if (nuxt.options.dev) {
      if (tools?.druxt) {
        // A Druxt tab in Nuxt DevTools, an inspector and a timeline in Vue DevTools, and a console summary. Nothing
        // floats over the page, and a production build has none of it.
        addPlugin({ src: resolve('./runtime/plugins/devel'), mode: 'client' })
        addPlugin({ src: resolve('./runtime/plugins/devel-requests'), mode: 'server' })
        if (tools.kit) tools.kit.addCustomTab(devtoolsTab(), nuxt as never)

        // The icon's route is registered first. A dev server handler's route is a prefix, so the page's handler would
        // answer for the icon too.
        const icon = tools.druxt.druxtTabIconSvg()
        addDevServerHandler({
          route: DRUXT_DEVTOOLS_ICON_ROUTE,
          handler: defineEventHandler((event) => {
            setResponseHeader(event, 'content-type', 'image/svg+xml')
            return icon
          }),
        })
        addDevServerHandler({
          route: DRUXT_DEVTOOLS_ROUTE,
          handler: defineEventHandler((event) => {
            setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
            return devtoolsPage()
          }),
        })
      }

      // The tokens and the tools' styles. They go through the app's CSS in development only, so a production build has
      // none.
      nuxt.options.css.push(resolve('./runtime/assets/druxt.css'))
    }

    for (const name of ['Druxt']) {
      addComponent({ name, filePath: await resolvePath(resolve(`./runtime/components/${name}`)), global: 'sync' })
    }

    // Where an editing module renders its controls, on entities and fields with `editing` set. It is lazy, because few
    // pages edit. Its priority is below a module's own: an editing module registers DruxtEditControls with a higher
    // priority to replace it.
    addComponent({ name: 'DruxtEditControls', filePath: await resolvePath(resolve('./runtime/components/DruxtEditControls')), global: true })

    // Wrapper resolution looks components up by name at runtime. So every `Druxt*` component, the site's own included,
    // must be registered globally.
    //
    // A site's own stay lazy, so each loads with the page that uses it. Druxt's own, registered sync, stay sync.
    nuxt.hook('components:extend', (components) => {
      for (const component of components) {
        if (component.pascalName.startsWith('Druxt') && component.global !== 'sync') component.global = true
      }
    })
  },
})
