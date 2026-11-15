import { addImports, addPlugin, addServerHandler, addServerImports, addServerPlugin, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, hasNuxtModule, installModule, resolvePath, tryUseNuxt, useLogger } from '@nuxt/kit'
import { clientOptions } from '@druxt/client'
import type { DruxtClient, DruxtConfig, DruxtConnectionConfig } from '@druxt/client'
import { defu } from 'defu'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { splitDruxtConfig } from './utils/config'
import { addDruxtProxy, addPrebundle, corePrebundle, DRUXT_DEFAULTS_IMPORT, druxtDefaults, druxtProxyRoutes } from './kit'
import type { DruxtAnchorsSetting } from './anchors'
import { serverAuthOptions, signedInClient } from './runtime/server/signIn'
import { DRUXT_API_BASE, trimEndSlashes } from './routes'
import { druxtApiConflict } from './utils/routes'

/** Credentials for build-time requests; see createBuildClient. */
export interface DruxtBuildAuthOptions {
  clientId?: string
  clientSecret?: string
  username?: string
  password?: string
  scope?: string
}

/** `druxt.auth` in nuxt.config: druxt-auth 0.x's option names. */
export interface DruxtAuthModuleOptions {
  clientId: string
  passwordClientId?: string
  /** Prefer NUXT_DRUXT_AUTH_CLIENT_SECRET at runtime: a secret here is in the config. */
  clientSecret?: string
  scope?: string
  authorizeUrl?: string
  /**
   * The login page Druxt adds, `/user/login` by default, where the `druxt-auth` middleware sends a signed-out visitor.
   * `false` adds none, and the middleware sends the visitor to `/login`, as druxt-auth 0.x did, for the site's own page.
   */
  login?: string | false
  callback?: string
  /**
   * Keeps the access and refresh tokens in cookies the browser's scripts can read, as 0.x did, for a module that
   * calls Drupal directly from the browser, outside the proxy. A weaker setting: any script on the page can read the
   * tokens. Off by default, when the proxy is on: the site's server keeps them in httpOnly cookies, and the proxy adds
   * the Authorization header.
   */
  exposeToken?: boolean
  /**
   * Whether the password grant, and its `/api/_druxt/auth/token` route, are offered. Unset, they are when `clientSecret`
   * or `passwordClientId` is set at build. Set `true` for a secret that arrives only at runtime, or for a public
   * Consumer, which signs in with no secret. `false` offers neither: the browser gets no password route, and the route,
   * which a session the server holds keeps for its code grant and refresh, refuses the password grant.
   */
  password?: boolean
}

/**
 * The `druxt` options in nuxt.config. Each Druxt module reads its own key, such as `menu`.
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
  /** The Base URL of the Drupal JSON:API backend. */
  baseUrl: string
  /** The site's own origin, for links a page emits about itself, such as the canonical. Unset, the request's origin is used. Set it in production, in nuxt.config or as NUXT_PUBLIC_DRUXT_SITE_URL: the request origin, with forwarded headers, is the fallback for development and for a proxy the site trusts. An empty string counts as unset. */
  siteUrl?: string
  /** The JSON:API endpoint path, `/jsonapi` by default. */
  endpoint: string
  /**
   * Proxy settings: `api` proxies the JSON:API, and `files` Drupal's site
   * files directory, given as a string to name a multi-site's directory.
   * `trustForwarded` passes on the forwarding headers a front proxy sets,
   * which is safe only behind a proxy that sets them. It is server only, and
   * NUXT_DRUXT_PROXY_TRUST_FORWARDED sets it at runtime.
   */
  proxy?: { api?: boolean, files?: boolean | string, trustForwarded?: boolean }
  /**
   * The origin Drupal's files are served from, such as a CDN's, when not Drupal's own. A file URL the default output
   * makes absolute, with `proxy.files` off or on a static build, is made absolute on it, else on `baseUrl`.
   */
  filesUrl?: string
  /**
   * The process cache, on in production unless false. It keeps the JSON:API
   * index between server requests made without credentials, for as long as
   * Drupal's `Cache-Control` allows and at most `ttl` seconds, and with
   * `content` every other response too: entities, collections, views and route
   * lookups, each area bounded by `maxSize` bytes across its consumers, 50 MB by
   * default. A `secret` turns on `POST /api/_druxt/cache/clear`. Prefer
   * NUXT_DRUXT_CACHE_SECRET at runtime.
   */
  cache?: false | { content?: boolean, maxSize?: number, ttl?: number, sessionCookie?: string, secret?: string }
  auth?: DruxtAuthModuleOptions
  /**
   * Whether the default output names its entities and fields with `data-druxt-*` attributes, for an editor, a diff view
   * or the site's tests to find: `'dev'`, in development only, when not set. A module that needs them in production
   * turns them on, unless this is `false`. Read at build.
   */
  anchors?: DruxtAnchorsSetting
  /** Where development tells you a module has no wrapper: the Druxt tab in Nuxt DevTools and Vue DevTools, with a console summary (the default), or 1.x's inline messages. */
  develMessages?: 'devtools' | 'inline'
  /** Build credentials, read at build only. The server's own routes read theirs at runtime, from NUXT_DRUXT_BUILD_AUTH_* or DRUXT_BUILD_*, and the browser never does. */
  build?: { auth?: DruxtBuildAuthOptions }
  /** Reserved for a later release: other Drupal sites by name. 2.0 uses the flat keys, the `default` connection, and warns about any other name. */
  connections?: Record<string, DruxtConnectionConfig>
  [module: string]: unknown
}

// One signed-in build client per backend and credentials, so a build signs in once.
const buildClients = new Map<string, Promise<DruxtClient>>()

/**
 * The client for build-time requests: schemas, languages. With build
 * credentials it signs in first, so a build can read what anonymous cannot,
 * such as restricted display configuration.
 *
 * `druxt.build.auth` takes `clientId` and `clientSecret` for Simple OAuth's
 * client credentials grant, or adds `username` and `password` for the password
 * grant. Each falls back to DRUXT_BUILD_CLIENT_ID, DRUXT_BUILD_CLIENT_SECRET,
 * DRUXT_BUILD_USERNAME and DRUXT_BUILD_PASSWORD. They stay in the build: the
 * server's own routes read theirs at runtime, from the private runtime config
 * or the same variables.
 *
 * @param options - The druxt options.
 */
export const createBuildClient = (options: DruxtOptions): Promise<DruxtClient> =>
  signedInClient(buildClients, options.baseUrl, clientOptions(options as unknown as DruxtConfig) as Record<string, unknown>, buildAuth(options))

/**
 * The build's credentials: `druxt.build.auth`, each key falling back to its
 * `DRUXT_BUILD_*` variable at build.
 *
 * @param options - The druxt options.
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
 * What to tell a site whose build read too little from Drupal, from the
 * build's credentials and the error, if any. Drupal omits what the build may
 * not read, and names the permissions it needs, which the error's message
 * keeps.
 *
 * - With no credentials, it names them, the scope among them.
 * - With credentials and no scope, it names the scope: a Simple OAuth token
 *   carries no roles unless a scope is requested.
 * - With credentials and a scope, and Drupal omitting resources, it names the
 *   scope's roles.
 * - Otherwise it is empty.
 *
 * @param auth - The build's credentials, from `buildAuth()`.
 * @param error - The build's error, when it failed.
 *
 * @example @lang ts
 * logger.error(`Druxt schemas could not be generated: ${error.message} ${buildCredentialsHint(buildAuth(options), error)}`)
 */
export const buildCredentialsHint = (auth: DruxtBuildAuthOptions, error?: Error): string => {
  // DruxtPermissionsError (@druxt/client) puts Drupal's omission in its message as "Required permissions:" and a list,
  // and DruxtClient.error() keeps it as the message's detail. Matching that text detects the omission either way.
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

/** A Drupal language and the URL prefix Drupal serves it under, empty for none. */
export interface DruxtLanguage {
  langcode: string
  prefix: string
  /** Set on the default language: the one Drupal answers in at the unprefixed endpoint. */
  default?: true
  /**
   * The language's label, as Drupal names it in its own language, such as `Spanish`. Drupal's configurable language
   * holds no native name, such as `Español`, so a switcher that wants one maps it from the langcode.
   */
  label?: string
}

// One read per build, shared by core, the router and the entity module, by backend and endpoint. Outside a build,
// such as in a test, one read per process.
const buildLanguageReads = new WeakMap<object, Map<string, Promise<DruxtLanguage[]>>>()
const processLanguageReads = new Map<string, Promise<DruxtLanguage[]>>()
// Warned once per process, though core, the router and the entity module each read the languages.
const warned = new Set<string>()
const warnOnce = (message: string): void => {
  if (warned.has(message)) return
  warned.add(message)
  useLogger('@druxt/core').warn(message)
}

/**
 * Drupal's languages and their URL prefixes, read at build through the build
 * client. Drupal keeps the prefixes in `language.negotiation`, which no
 * JSON:API resource holds, so they are read from Drupal's own answers, asked
 * for without credentials, so no negotiator by user or session takes part:
 *
 * - An unprefixed request is answered in the default language, which Drupal
 *   names in its `Content-Language` header, and the index's `self` link
 *   carries that language's prefix, empty when it has none.
 * - Each other language is asked for under its langcode, and Drupal answers
 *   in it, with its index at that prefix, when the langcode is its prefix.
 *
 * - A language's configured prefix comes from decoupled settings when Drupal
 *   publishes `language.negotiation` to a visitor, which reads a prefix that is
 *   neither the langcode nor the default language's.
 *
 * A language whose prefix cannot be read, from an answer that does not match
 * or a failed request, keeps its langcode as its prefix, with a build warning,
 * as 1.x assumed for every language. One build reads once, for every module.
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
  const key = `${trimEndSlashes(options.baseUrl)} ${options.endpoint || '/jsonapi'}`
  let read = reads.get(key)
  if (!read) {
    read = readLanguages(options)
    reads.set(key, read)
    read.catch(() => reads.delete(key))
  }
  return read
}

const readLanguages = async (options: DruxtOptions): Promise<DruxtLanguage[]> => {
  const endpoint = options.endpoint || '/jsonapi'
  const type = 'configurable_language--configurable_language'
  // The probes ask as a visitor, through a client that never signs in.
  const anonymous = await signedInClient(buildClients, options.baseUrl, clientOptions(options as unknown as DruxtConfig) as Record<string, unknown>, {})

  // The language Drupal answers an anonymous request at `path` in, the path its index names itself at, and the resource
  // types it lists. Nothing, for a failed request.
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

  // The prefix of an index at `/<prefix><endpoint>`, or empty at the endpoint itself. Any other path is not trusted.
  const prefixOf = (self?: string): string | undefined => {
    if (!self?.endsWith(endpoint)) return undefined
    const prefix = self.slice(0, -endpoint.length)
    if (!prefix) return ''
    return /^\/[^/]+$/.test(prefix) ? prefix.slice(1) : undefined
  }
  // The unprefixed index first, as a visitor. Not listing the language type, the language module is not installed, so
  // the site has one language and no prefixes, and nothing more is read: no sign-in, no other request. The index lists
  // every resource type, whatever the reader may see.
  // A residual risk: core's JSON:API lists every resource type to every reader, but a contrib module could change the
  // entry point by role, and hide the language type from a visitor while the build's account may see it. That site
  // would read as having one language. None known does so.
  const unprefixed = await answer(endpoint)
  if (unprefixed.types && !unprefixed.types.includes(type)) return []

  // The languages, through the build's client, signed in when it has credentials.
  const druxt = await createBuildClient(options)
  if (!unprefixed.types) {
    // The anonymous index failed: the build's own says whether the language module is installed.
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

  // Drupal's configured prefixes, when the decoupled_settings module publishes `language.negotiation` to a visitor:
  // the one way to read a prefix that is neither the langcode nor the default language's. Nothing, otherwise.
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

  // Each other language's probe at once.
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
 * The URL prefixes Drupal serves its languages under, from `getLanguages()`:
 * Drupal's configured prefixes, such as `/english` for `en`. A language with
 * no prefix, usually the default, is served unprefixed and is left out.
 *
 * @param options - The module options.
 * @returns Prefixes such as `/en`.
 */
export const getLanguagePrefixes = async (options: DruxtOptions): Promise<string[]> =>
  (await getLanguages(options)).filter((language) => language.prefix).map((language) => `/${language.prefix}`)

/**
 * The Druxt core Nuxt module.
 *
 * Provides the `$druxt` client, the Pinia store the Druxt modules share, the
 * DruxtWrapper and DruxtDebug components, and global registration of every
 * `Druxt*` component so a site overrides rendering by naming a component.
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
    // Present, so NUXT_PUBLIC_DRUXT_SITE_URL can set it: Nuxt applies the environment only to keys that exist.
    siteUrl: '',
    // Present, so NUXT_PUBLIC_DRUXT_FILES_URL can set it.
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
    options.endpoint = options.endpoint.startsWith('/') ? options.endpoint : `/${options.endpoint}`
    // Drupal's paths on the site stay clear of Druxt's own routes. Each language's prefix is checked once it is read.
    const filesPath = options.proxy?.files ? `/sites/${typeof options.proxy.files === 'string' ? options.proxy.files : 'default'}/files` : undefined
    const conflict = druxtApiConflict({ endpoints: [options.endpoint], files: filesPath ? [filesPath] : [] })
    if (conflict) throw new Error(`[druxt] ${conflict}`)

    // Keep the JSON:API index between server requests that carry no credentials, in production only. The proxy still
    // reads the session cookie's pattern in development.
    const sessionCookie = (options.cache || undefined)?.sessionCookie
    if (options.cache !== false) {
      options.cache = nuxt.options.dev ? false : { ...options.cache }
    }

    // Auth, which druxt-auth 0.x added on @nuxtjs/auth-next.
    if (options.auth) {
      if (!options.auth.clientId) throw new Error('[druxt] `druxt.auth` requires a clientId.')
      options.auth = {
        login: '/user/login',
        callback: '/callback',
        ...options.auth,
        // Whether the password grant is offered. An explicit true or false wins, for a secret that arrives only at
        // runtime or a public Consumer with none. Unset, a build secret or a Consumer of its own offers it.
        password: options.auth.password ?? !!(options.auth.clientSecret || options.auth.passwordClientId),
        // The site's server holds the session, with the tokens out of the browser's reach, wherever the proxy carries
        // the browser's requests to Drupal.
        session: !!options.proxy?.api && !options.auth.exposeToken,
      } as typeof options.auth
      // On Simple OAuth 6 a token holds the roles its scopes name, and none without one.
      if (!options.auth.scope) {
        logger.warn('DRUXT_E01004: druxt.auth signs visitors in with no druxt.auth.scope. On Simple OAuth 6 a token holds only the roles its scopes name, so a signed-in editor reads less than an anonymous visitor, and Drupal refuses what anonymous may read. Set druxt.auth.scope to the scopes of the roles your editors need, separated by spaces.')
      }
    }

    // The options, split once: the secrets into the private runtime config,
    // on the server only, and everything else into the public one, which
    // reaches the browser. Each private key exists, empty unless set, so
    // NUXT_DRUXT_AUTH_CLIENT_SECRET, NUXT_DRUXT_CACHE_SECRET and
    // NUXT_DRUXT_BUILD_AUTH_* set them at runtime. A secret is never read from
    // the build's environment, which would bake it into the output.
    const split = splitDruxtConfig(options, sessionCookie)
    // Out of the options other modules and the devtools read too. The build's
    // own credentials stay, for modules that read Drupal at build time.
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
    // The ignored connections carry credentials too: they are not read, and not left in the options either.
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
    // Through a plain record: Nuxt types the public config from whichever app was prepared.
    const publicConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    publicConfig.druxt = defu(publicConfig.druxt as object | undefined, split.public)

    // The modules' default settings, written into the build, so the app and the server resolve them below Drupal's
    // settings and the site's config. Not the public runtime config, which outranks Drupal and which environment
    // variables change. Read when written, after every module has registered its own.
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

    // The site's languages, read once for the app's map and the proxy's prefixes, so the two agree. A read that fails
    // stops a production build, which would otherwise be a site with one language and only a warning to say so. In
    // development it warns once and reads as none, so the site still starts while Drupal is away: no default language
    // is known, and the proxy serves only the unprefixed endpoint.
    let siteLanguages: Promise<DruxtLanguage[]> | undefined
    const readSiteLanguages = () => siteLanguages ||= getLanguages(options).catch((error: unknown) => {
      const proxied = options.proxy?.api ? `, and the proxy serves only the unprefixed ${options.endpoint}, not its language-prefixed paths, until a build reads them` : ''
      const reason = (error as Error)?.message || error
      if (!nuxt.options.dev) throw new Error(`[druxt] DRUXT_E01008: The site's languages could not be read, so the build stops: it would route and proxy no language prefix. Check that Drupal answers at ${options.baseUrl}, and the build's credentials if they are set: ${reason}`, { cause: error })
      useLogger('@druxt/core').warn(`The site's languages could not be read, so no default language is known${proxied}: ${reason}`)
      return []
    })

    // The site's languages and their prefixes, read at build, for the app and the server: the language served
    // unprefixed is the default, the language of every unprefixed page.
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

    // Where Druxt's server routes keep what they hold between requests. Memory
    // by default: a site shares it across instances by mounting a driver of its own.
    nuxt.options.nitro.storage = defu(nuxt.options.nitro.storage, { druxt: { driver: 'memory' } })
    // Settings from Drupal, as a decoupled-settings fetcher stores them: read once per request, on demand.
    addServerPlugin(await resolvePath(resolve('./runtime/server/plugins/druxt')))
    addServerImports([
      { name: 'useDruxtServerSettings', from: resolve('./runtime/server/settings') },
      { name: 'storeDrupalSettings', from: resolve('./runtime/server/storage') },
    ])

    // Proxy Drupal through Nitro, which replaces @nuxtjs/proxy: the JSON:API under each language's configured prefix,
    // and the files directory, `sites/default/files` unless a site is named.
    // Druxt's own routes, under DRUXT_API_BASE, answer before the proxy, so a JSON:API at `/api` leaves them in place.
    if (options.proxy?.api) {
      const read = nuxt.options._prepare ? [] : await readSiteLanguages()
      const prefixes = ['', ...read.filter((language) => language.prefix).map((language) => `/${language.prefix}`)]
      const prefixed = druxtApiConflict({ endpoints: prefixes.map((prefix) => `${prefix}${options.endpoint}`) })
      if (prefixed) throw new Error(`[druxt] ${prefixed}`)
      for (const prefix of prefixes) addDruxtProxy(nuxt, `${prefix}${options.endpoint}/**`)
    }
    if (filesPath) addDruxtProxy(nuxt, `${filesPath}/**`)
    // One handler for every proxied path, which reads the base URL at request time, so a runtime
    // NUXT_PUBLIC_DRUXT_BASE_URL moves the browser's requests with the server's. Registered once every module is in,
    // as the router adds its own path.
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
    nuxt.hook('modules:done', () => {
      // A route ending in `/**` matches below its path, so the path itself, such as the JSON:API index, is added too.
      const routes = druxtProxyRoutes(nuxt).flatMap((route) => route.endsWith('/**') ? [route.slice(0, -3), route] : [route])
      for (const route of new Set(routes)) addServerHandler({ route, handler: proxyHandler })
    })

    await addPrebundle(nuxt, corePrebundle())

    if (!hasNuxtModule('@pinia/nuxt')) {
      await installModule('@pinia/nuxt')
    }

    addPlugin(resolve('./runtime/plugins/druxt'))
    addImports({ name: 'useDruxtClient', from: resolve('./runtime/composables') })
    addImports({ name: 'useDruxtStore', from: resolve('./runtime/store') })
    for (const name of ['useDruxtSettings', 'setDrupalSettings']) {
      addImports({ name, from: resolve('./runtime/settings') })
    }
    addPlugin(resolve('./runtime/plugins/pinia'))

    const auth = options.auth
    if (auth) {
      // The browser's token requests and userinfo, on this origin.
      if (options.proxy?.api) {
        for (const path of ['/oauth/token', '/oauth/userinfo']) addDruxtProxy(nuxt, path)
      }
      // Registered whenever the password grant is offered, or the server holds the session, whose sign-in, refresh and
      // sign-out run through it. The secret, if any, is read at runtime.
      const session = (auth as { session?: boolean }).session
      if (auth.password || session) {
        addServerHandler({ route: `${DRUXT_API_BASE}/auth/token`, method: 'post', handler: resolve('./runtime/server/routes/token') })
      }
      if (session) addServerHandler({ route: `${DRUXT_API_BASE}/auth/logout`, method: 'post', handler: resolve('./runtime/server/routes/logout') })
    }
  },
})
