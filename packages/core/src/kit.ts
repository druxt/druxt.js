// Build-time helpers for Druxt modules, from `@druxt/core/kit`. They are for the Druxt modules that build on core, not
// for a site's own nuxt.config.

import { addPlugin, directoryToURL, tryResolveModule, useLogger } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import { defu } from 'defu'
import { resolveDruxtAnchors } from './anchors'
import type { DruxtAnchorsState } from './anchors'

export { DRUXT_API_BASE } from './routes'

declare module '@nuxt/schema' {
  interface NuxtHooks {
    /**
     * Called with Druxt's anchors state, once it is final at `modules:done`.
     *
     * The state says whether the default output carries the anchors, and which modules required them. It has
     * `disabledBy: 'site'` when the site turned the anchors off although a module required them.
     *
     * It is called again for a module that requires anchors later.
     */
    'druxt:anchors': (state: DruxtAnchorsState) => void | Promise<void>
    /**
     * Called with the paths a static build prerenders, before Nitro gets them.
     *
     * The set holds Drupal's published pages under each language's prefix when `druxt.static.routes` is on. Otherwise
     * it is empty. A module or the site adds paths to the set, or removes them.
     *
     * Nitro's own `prerender.routes`, and the links it crawls, are added as usual.
     */
    'druxt:prerender': (routes: Set<string>) => void | Promise<void>
  }
}

// The CommonJS packages that core's browser runtime imports. Vite's development server pre-bundles a dependency its
// scan finds. pnpm does not hoist a dependency that only @druxt/core depends on, so the scan never finds it.
const coreCommonJs = ['drupal-jsonapi-params']

/**
 * Adds entries to Vite's development pre-bundle, `vite.optimizeDeps.include`, once each.
 *
 * Vite resolves a nested entry from the app's root, starting with its first package. It warns on every start about an
 * entry it cannot resolve. So an entry whose first package the app cannot resolve is left out. `@druxt/core` is such a
 * package in a pnpm app that lists only `@druxt/router`.
 *
 * This is for Druxt modules, not for a site.
 *
 * @param nuxt - The Nuxt instance.
 * @param entries - Package names, or nested names such as `@druxt/core > drupal-jsonapi-params`.
 *
 * @example @lang ts
 * await addPrebundle(nuxt, ['@druxt/schema > drupal-jsonapi-params'])
 */
export const addPrebundle = async (nuxt: Nuxt, entries: string[]): Promise<void> => {
  const optimizeDeps = nuxt.options.vite.optimizeDeps ||= {}
  const include = optimizeDeps.include ||= []
  for (const entry of entries) {
    if (include.includes(entry)) continue
    const first = entry.split('>')[0]!.trim()
    if (await tryResolveModule(first, directoryToURL(nuxt.options.rootDir))) include.push(entry)
  }
}

/**
 * Gets the pre-bundle entries for core's CommonJS browser dependencies, reached through `parent`.
 *
 * Under pnpm, an app that lists only a module which installs core, such as `@druxt/router`, cannot resolve
 * `@druxt/core` from its root. That module adds the chain through itself, such as `@druxt/router > @druxt/core >
 * drupal-jsonapi-params`. That chain resolves.
 *
 * This is for Druxt modules, not for a site.
 *
 * @param parent - The module that depends on core, or none for core itself.
 * @returns The entries, for `addPrebundle()`.
 *
 * @example @lang ts
 * await addPrebundle(nuxt, corePrebundle('@druxt/router'))
 */
export const corePrebundle = (parent?: string): string[] =>
  coreCommonJs.map((dependency) => [parent, '@druxt/core', dependency].filter(Boolean).join(' > '))

/** The import the app and the server read the modules' default settings from. */
export const DRUXT_DEFAULTS_IMPORT = '#druxt/defaults'

/** Where a build keeps the modules' default settings until core writes them out. */
interface WithDefaults {
  _druxtDefaults?: Record<string, unknown>
}

/**
 * Registers a Druxt module's development tools plugin.
 *
 * The plugin is a client plugin. It adds the module's sections, timeline events and actions with `useDruxtDevtools()`.
 * It is registered in development only, so a production build has none of it. It runs after core's own.
 *
 * This is for Druxt modules, not for a site.
 *
 * @param nuxt - The Nuxt instance.
 * @param src - The plugin's path.
 *
 * @example @lang ts
 * addDruxtDevtoolsPlugin(nuxt, resolve('./runtime/devtools'))
 */
export const addDruxtDevtoolsPlugin = (nuxt: Nuxt, src: string): void => {
  if (nuxt.options.dev) addPlugin({ src, mode: 'client' }, { append: true })
}

/**
 * Registers a Druxt module's default settings, such as `{ entity: { label: true } }`.
 *
 * The defaults are written into the build, and read through `#druxt/defaults`. They are resolved after core's own
 * defaults. They are resolved before the settings Drupal publishes and the site's `druxt` config, so both can change
 * them.
 *
 * They never go into the public runtime config, where they would outrank Drupal. No environment variable changes them.
 * A module still copies the site's own options into the public config.
 *
 * This is for Druxt modules, not for a site.
 *
 * @param nuxt - The Nuxt instance.
 * @param defaults - The defaults, by settings key. A later call fills only what an earlier one left unset.
 *
 * @example @lang ts
 * addDruxtDefaults(nuxt, { entity: { label: true, query: {}, formatters: {} } })
 */
export const addDruxtDefaults = (nuxt: Nuxt, defaults: Record<string, unknown>): void => {
  const options = nuxt.options as unknown as WithDefaults
  options._druxtDefaults = defu(options._druxtDefaults || {}, defaults)
}

/**
 * Gets the default settings the modules registered with `addDruxtDefaults()`.
 *
 * @param nuxt - The Nuxt instance.
 * @returns The defaults, by settings key.
 * @internal
 */
export const druxtDefaults = (nuxt: Nuxt): Record<string, unknown> => (nuxt.options as unknown as WithDefaults)._druxtDefaults || {}

/** Where a build keeps the Drupal paths core proxies until it registers them. */
interface WithProxy {
  _druxtProxy?: string[]
}

/**
 * Proxies a Drupal path through the site's own origin, for the browser, when the site sets `druxt.proxy.api`.
 *
 * Core serves every path from one Nitro handler. The handler reads `runtimeConfig.public.druxt.baseUrl` at request
 * time, so a runtime `NUXT_PUBLIC_DRUXT_BASE_URL` moves the browser's requests along with the server's.
 *
 * What the proxy passes on:
 *
 * - The method, the streamed body, the headers and the cookies pass through, except `Host`, `Accept` and
 *   `Accept-Encoding`.
 * - Forwarding headers are set from the site's own view of the request, never from the browser's.
 * - A redirect passes to the browser. A location on Drupal's base URL is moved to this site.
 * - A cookie for Drupal's host is set for this site's host.
 * - The response's encoding and length headers are recomputed.
 *
 * Call it before every module is installed, because core registers the paths then.
 *
 * This is for Druxt modules, not for a site.
 *
 * @param nuxt - The Nuxt instance.
 * @param path - The path on both sides, such as `/router/translate-path`. A path ending in `/**` proxies everything
 * below it.
 *
 * @example @lang ts
 * if (options.proxy?.api) addDruxtProxy(nuxt, '/router/translate-path')
 */
export const addDruxtProxy = (nuxt: Nuxt, path: string): void => {
  const routes = (nuxt.options as unknown as WithProxy)._druxtProxy ||= []
  if (!routes.includes(path)) routes.push(path)
}

/**
 * Gets the paths the modules proxy with `addDruxtProxy()`.
 *
 * @param nuxt - The Nuxt instance.
 * @returns A copy of the paths.
 * @internal
 */
export const druxtProxyRoutes = (nuxt: Nuxt): string[] => [...((nuxt.options as unknown as WithProxy)._druxtProxy || [])]

/** What a module that requires Druxt's anchors says about itself. */
export interface DruxtAnchorsRequirement {
  /** The module's name, such as `@druxt-contrib/fae`. The build's warning and the development tools show it. */
  module: string
  /** Why it needs them, such as `it finds the fields an editor edits`. */
  reason: string
}

/**
 * A build's anchors: what the site set, the modules that required them, and the state.
 *
 * It is one object, kept up to date.
 */
interface DruxtAnchorsRecord {
  setting?: unknown
  requirements: DruxtAnchorsRequirement[]
  warned: string[]
  state: DruxtAnchorsState
  final: boolean
}

/**
 * Where a build keeps its anchors record.
 *
 * It is on the options, as the defaults are, so every copy of core shares it.
 */
interface WithAnchors {
  _druxtAnchors?: DruxtAnchorsRecord
}

/** Works the anchors state out again. It changes the state object in place, so every holder of it sees the change. */
const updateAnchors = (nuxt: Nuxt, record: DruxtAnchorsRecord): void => {
  const setting = record.setting ?? (nuxt.options as unknown as { druxt?: { anchors?: unknown } }).druxt?.anchors
  const next = resolveDruxtAnchors({ setting, dev: nuxt.options.dev, requiredBy: record.requirements.map((requirement) => requirement.module) })
  record.state.enabled = next.enabled
  record.state.requiredBy = next.requiredBy
  if (next.disabledBy) record.state.disabledBy = next.disabledBy
  else delete record.state.disabledBy
}

/**
 * Tells the build the anchors state, through the `druxt:anchors` hook.
 *
 * First, when the site's `false` overrules the modules, it warns once for each module that required anchors.
 */
const announceAnchors = async (nuxt: Nuxt, record: DruxtAnchorsRecord): Promise<void> => {
  updateAnchors(nuxt, record)
  if (record.state.disabledBy) {
    for (const { module, reason } of record.requirements) {
      if (record.warned.includes(module)) continue
      record.warned.push(module)
      useLogger('@druxt/core').warn(`${module} requires Druxt anchors, as ${reason}, but \`druxt.anchors\` is false, so the page carries none. Remove the setting to let ${module} work.`)
    }
  }
  await nuxt.callHook('druxt:anchors', { ...record.state, requiredBy: [...record.state.requiredBy] })
}

/**
 * Gets a build's anchors record. It is made on first use, and settles at `modules:done`.
 *
 * @param nuxt - The Nuxt instance.
 * @returns The record.
 * @internal
 */
export const druxtAnchors = (nuxt: Nuxt): DruxtAnchorsRecord => {
  const options = nuxt.options as unknown as WithAnchors
  let record = options._druxtAnchors
  if (!record) {
    const made: DruxtAnchorsRecord = { requirements: [], warned: [], state: { enabled: false, requiredBy: [] }, final: false }
    options._druxtAnchors = record = made
    updateAnchors(nuxt, made)
    nuxt.hook('modules:done', async () => {
      made.final = true
      await announceAnchors(nuxt, made)
    })
  }
  return record
}

/**
 * Turns Druxt's anchors on for a module that needs them, such as an inline editor or a diff view, in production too.
 *
 * The anchors are the `data-druxt-*` attributes the default output names its entities and fields with. `findAnchor()`
 * from `@druxt/core/anchors` finds them again.
 *
 * A site that sets `druxt.anchors: false` keeps them off, because explicit config beats a module. The build then warns
 * once for each requiring module, naming it and its reason.
 *
 * The state returned is the build's own. It is kept up to date until every module is installed, so the order modules
 * run in does not matter. Read it in a `modules:done` hook, or listen for the `druxt:anchors` hook. In the app,
 * `useDruxtAnchors()` gives the same state.
 *
 * This is for Druxt modules, not for a site.
 *
 * @param nuxt - The Nuxt instance.
 * @param requirement - The module's name, and why it needs anchors.
 * @returns The anchors state: `enabled`, the modules that required them, and `disabledBy: 'site'` when the site's
 * `false` overruled them.
 *
 * @example @lang ts
 * const anchors = requireDruxtAnchors(nuxt, { module: '@druxt-contrib/fae', reason: 'it finds the fields an editor edits' })
 * nuxt.hook('modules:done', () => {
 *   if (!anchors.enabled) logger.warn('Front-end editing is off: the site turned Druxt anchors off.')
 * })
 */
export const requireDruxtAnchors = (nuxt: Nuxt, requirement: DruxtAnchorsRequirement): Readonly<DruxtAnchorsState> => {
  const record = druxtAnchors(nuxt)
  if (!record.requirements.some((known) => known.module === requirement.module)) record.requirements.push({ ...requirement })
  updateAnchors(nuxt, record)
  // A module may require anchors after every module is installed. The state changes then, so the build is told again.
  if (record.final) void announceAnchors(nuxt, record)
  return record.state
}
