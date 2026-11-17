import type { VNodeChild } from 'vue'
import type { DruxtClient, DruxtConfig, DruxtPublicAuthOptions, DruxtSettings } from '@druxt/client'
import type { DrupalSettingsTiers } from './utils/drupal-settings'

/** The name parts for wrapper components. There is one array per set, most specific first. */
export type DruxtComponentOptionSets = Array<Array<string | null | undefined | false> | undefined>

/** What a module's `druxt.settings()` returns. `query` is the usual key. */
export interface DruxtModuleSettings {
  query?: Record<string, unknown>
  [key: string]: unknown
}

/** A scoped slot a module renders its wrapper with. */
export type DruxtSlot = (attrs?: Record<string, unknown>) => VNodeChild
/** A module's slots, by name. */
export type DruxtSlots = Record<string, DruxtSlot>

/** A module's `template`: what a wrapper generated in development starts with. */
export interface DruxtTemplateConfig {
  /** The expression the wrapper's DruxtDebug shows, such as `{ entity, schema }`. */
  debug?: string
  /** The module the props object and composable are imported from, such as `@druxt/entity/runtime`. */
  from?: string
  /** The props object the wrapper declares, such as `druxtEntityProps`. */
  props?: string
  /** The composable, and the values the wrapper takes from it. */
  composable?: { name: string, use: string[] }
  /**
   * The `druxt` settings, by dotted path of names, such as `query.fields`.
   *
   * A last part that starts with `//` is written commented out. A path is a value or the parent of others, never
   * both.
   */
  druxt?: Record<string, unknown>
  /** Set to false to write none of the module's slots. */
  slots?: boolean
  /**
   * Slots named by a prefix and an index, one per value, such as DruxtField's `field-0`.
   *
   * They are written as one `<slot>` in a `v-for` over the composable's value `over`. So a wrapper renders every
   * value, however many there are.
   */
  repeat?: { prefix: string, over: string }
}

declare module 'vue' {
  interface ComponentCustomOptions {
    /** A wrapper's Druxt settings, such as `{ query: { fields: ['title'] } }`. Set them with `defineOptions`. */
    druxt?: DruxtModuleSettings
  }
}

/** `druxt.auth` as it reaches the browser, with no secret. */
export type { DruxtPublicAuthOptions }

/** A failed resource request, as the store's `getResource()` reports it on its result. */
export interface ResourceError {
  /** The HTTP status, or 500 when no response came back. */
  statusCode: number
  /** The HTTP status text, with no URL or detail. */
  message: string
  /** Set when no response came back, such as a network failure. */
  network?: boolean
}

/**
 * The `druxt` object in the public runtime config.
 *
 * It is the site's flat config with every secret taken out. Modules read it resolved, through
 * `useDruxtSettings()`.
 */
export interface DruxtPublicConfig extends DruxtSettings {
  baseUrl: string
  siteUrl?: string
  endpoint: string
  proxy?: { api?: boolean, files?: boolean | string }
  /** The origin Drupal's files are served from, when not Drupal's own. */
  filesUrl?: string
  /**
   * Set at build when nothing in the browser uses Drupal's address, so the pages are written without it.
   *
   * In the browser, `baseUrl` then holds only the path Drupal is served under. On the server it holds the whole
   * address.
   */
  baseUrlHidden?: boolean
  /** Set at build on a static build, as `nuxt generate` makes it. Such a build has no server to proxy Drupal's files. */
  staticBuild?: boolean
  /** Set at build with `druxt.static.files`. A public file's URL stays on the site, where the build copied the file. */
  staticFiles?: boolean
  /** Set at build with `druxt.static.hybrid`. `@druxt/router` asks Drupal about a page the build did not generate. */
  staticHybrid?: boolean
  cache?: false | { content?: boolean, maxSize?: number, ttl?: number, sessionCookie?: string }
  auth?: DruxtPublicAuthOptions
  develMessages?: 'devtools' | 'inline'
}

/**
 * The `druxt` object in the private runtime config, on the server only.
 *
 * Every key exists after the build, and is empty unless set. Nuxt can then set it from the environment:
 * `NUXT_DRUXT_AUTH_CLIENT_SECRET`, `NUXT_DRUXT_CACHE_SECRET` and `NUXT_DRUXT_BUILD_AUTH_*`.
 */
export interface DruxtPrivateConfig {
  /** The confidential Consumer's secret, for the password grant and the server's sign-in. */
  auth: { clientSecret: string }
  /** The secret `POST /api/_druxt/cache/clear` checks. */
  cache: { secret: string }
  /**
   * `trustForwarded`: whether the proxy trusts the forwarding headers a front proxy sets.
   *
   * `sessionCookie`: the site's pattern for Drupal's session cookie, from `cache.sessionCookie`. It is empty for
   * Drupal's own name. That cookie is the only one the proxy sends Drupal.
   */
  proxy: { trustForwarded: boolean, sessionCookie: string }
  /** The server's own credentials, for routes that regenerate what the build generated. */
  build: { auth: { clientId: string, clientSecret: string, username: string, password: string, scope: string } }
}

/** The build credentials as a config holds them. A key that nothing set is `''` or undefined. */
export interface DruxtServerAuthConfig {
  clientId?: string
  clientSecret?: string
  username?: string
  password?: string
  scope?: string
}

/** The settings modules read, and the flat config a site writes. Both come from `@druxt/client`. */
export type { DruxtConfig, DruxtSettings }

/** The two tiers of a connection's settings from Drupal. */
export type { DrupalSettingsTiers }

declare module 'h3' {
  interface H3EventContext {
    /** This request's own tiers of settings from Drupal, by connection, written during the request. */
    druxtSettings?: Record<string, DrupalSettingsTiers>
    /** Reads a connection's stored tiers from Nitro storage, once per request. Set by core's Nitro plugin. */
    druxtStoredSettings?: (connection: string) => Promise<DrupalSettingsTiers | null>
  }
}

// The client the core plugin provides, on component instances. Its `NuxtApp` declaration is in `plugins/druxt.ts`,
// because `#app` only resolves for runtime code.
declare module 'vue' {
  interface ComponentCustomProperties {
    $druxt: DruxtClient
  }
}

/** `druxt.static` given as an object. */
export interface DruxtStaticOptions {
  /**
   * Prerenders Drupal's published pages, each under its language's prefix, through the `druxt:prerender` hook.
   *
   * It is on by default, for every node and taxonomy term type. A list names the resource types to prerender, for a
   * site that renders only some of them. Each is a string such as `node--article`, or a RegExp such as `/^node--/`.
   */
  routes?: boolean | Array<string | RegExp>
  /**
   * Keeps a public file's URL on the site, under `app.baseURL`, and copies each file a page names into the output.
   * Off by default.
   */
  files?: boolean
  /**
   * Asks Drupal about a page the build did not generate, for a static site beside a live Drupal.
   *
   * Off by default. The prerender manifest then decides, and a page it does not list is a 404 with no request.
   * `@druxt/router` reads this option.
   */
  hybrid?: boolean
}

/**
 * What the build writes as `/api/_druxt/prerender.json`.
 *
 * It lists the pages the build generated, and the redirect pages, by source.
 */
export interface DruxtPrerenderManifest {
  routes: string[]
  redirects: Record<string, string>
}
