// The static build, as `nuxt generate` makes it. This file has the `druxt.static` switch, the prerender manifest the
// build writes for the browser, the pages the build prerenders and the files it copies.
//
// Build time only.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import type { DruxtClient } from '@druxt/client'
import type { DruxtPrerenderManifest, DruxtStaticOptions } from '../runtime/types'
import { DRUXT_API_BASE, trimEndSlashes } from '../routes'

/** The `druxt.static` option, resolved. */
export interface DruxtStaticState {
  enabled: boolean
  routes: boolean
  /** The resource types `routes` names, when it is a list. Only their pages are prerendered. */
  types?: Array<string | RegExp>
  files: boolean
  hybrid: boolean
}

/**
 * Resolves the `druxt.static` option.
 *
 * - Unset, it follows `nitro.static`, which `nuxt generate` sets.
 * - `true` or an object turns the static mode on.
 * - `false` turns it off.
 *
 * The mode switches four things together: the file URL rule, the prerender manifest, the 404 for a page that was not
 * built, and the route middleware's rule.
 *
 * @param setting - `druxt.static`.
 * @param nitroStatic - Whether the build is static by Nitro's own reckoning.
 * @returns The resolved state. `routes`, `files` and `hybrid` are false when the mode is off.
 */
export const resolveStatic = (setting: boolean | DruxtStaticOptions | undefined, nitroStatic: boolean): DruxtStaticState => {
  const enabled = setting === undefined ? nitroStatic : setting !== false
  const options = typeof setting === 'object' ? setting : {}
  const types = Array.isArray(options.routes) ? options.routes : undefined
  return { enabled, routes: enabled && options.routes !== false, ...(enabled && types ? { types } : {}), files: enabled && !!options.files, hybrid: enabled && !!options.hybrid }
}

/**
 * Where the manifest is written, under the app's base URL.
 *
 * It is `api/_druxt/prerender.json`, beside Druxt's routes.
 */
export const DRUXT_PRERENDER_MANIFEST = `${DRUXT_API_BASE.slice(1)}/prerender.json`

/**
 * Gets the target of a prerendered redirect page.
 *
 * A redirect page is the meta refresh Nuxt writes for a server redirect. A page of more than 2048 characters is not
 * read as one.
 *
 * @param html - The page.
 * @returns The target, or undefined when the page is not a redirect page.
 */
export const redirectOf = (html: string): string | undefined => {
  if (html.length > 2048) return undefined
  const target = /<meta http-equiv="refresh" content="\d+;\s*url=([^"]*)"/i.exec(html)?.[1]
  return target === undefined ? undefined : target.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

/** A route Nitro prerendered, as its `prerender:generate` hook gives it. */
export interface DruxtPrerenderedRoute {
  route: string
  fileName?: string
  contents?: string
  error?: unknown
}

/** Nitro's fallback pages. They are not routes of the site. */
const FALLBACKS = new Set(['/200.html', '/404.html'])

/**
 * Collects the prerender manifest from each route Nitro generates.
 *
 * An HTML page is a route. It is a redirect when it is Nuxt's meta refresh. Payloads, other files, the fallback pages
 * and failed routes are left out.
 *
 * @returns `add()`, which takes a generated route, and `manifest()`, which gives the manifest with its routes and
 * redirects sorted.
 */
export const prerenderCollector = () => {
  const routes = new Set<string>()
  const redirects: Record<string, string> = {}
  return {
    add(route: DruxtPrerenderedRoute): void {
      if (route.error || !route.fileName?.endsWith('.html') || FALLBACKS.has(route.route)) return
      const target = redirectOf(route.contents || '')
      if (target !== undefined) redirects[route.route] = target
      else routes.add(route.route)
    },
    manifest: (): DruxtPrerenderManifest => ({ routes: [...routes].sort(), redirects: Object.fromEntries(Object.entries(redirects).sort(([a], [b]) => a.localeCompare(b))) }),
  }
}

/** The code a file the static build could not copy is warned with. */
export const DRUXT_E_STATIC_FILE = 'DRUXT_E01005'

/**
 * A file a page names, in Drupal's public files.
 *
 * `file` is the path it is written at. `request` is the path it is read from, with any query.
 */
export interface DruxtStaticFile {
  file: string
  request: string
}

/** Escapes a text for use in a regular expression. */
const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Collects the files the pages name, from what the build wrote.
 *
 * It finds each site-relative path in Drupal's public files. The path can be in a page's HTML, such as an image's `src`
 * or a `srcset` entry, or in its payload. A path inside an absolute URL is not the site's, and is left out.
 *
 * A path is kept once, in its first form, with its query, such as an image style's token.
 *
 * @param appBaseURL - The app's base URL, which the paths are written under.
 * @returns `scan()`, which reads a text, and `files`, the files found, sorted by path.
 */
export const fileCollector = (appBaseURL = '/') => {
  const base = trimEndSlashes(appBaseURL)
  const pattern = new RegExp(`(?<=^|["'=,(\\s])${escapeRegExp(base)}(/sites/[^/"'\\s<>]+/files/[^"'\\s<>\\\\)]+)`, 'g')
  const found = new Map<string, string>()
  return {
    scan(text: string): void {
      for (const match of text.matchAll(pattern)) {
        const request = match[1]!.replace(/&amp;/g, '&')
        const file = request.split(/[?#]/)[0]!
        if (!found.has(file)) found.set(file, request)
      }
    },
    get files(): DruxtStaticFile[] {
      return [...found].sort(([a], [b]) => a.localeCompare(b)).map(([file, request]) => ({ file, request }))
    },
  }
}

/**
 * Copies the files the pages name into the output.
 *
 * Each file is read once, from where Drupal serves it. An image style's file is made as it is read.
 *
 * A file Drupal does not answer is warned about and left out. The page then links to a missing file on the site, as it
 * did on Drupal. A file whose path leaves the output directory is treated the same way.
 *
 * @param files - The files, from `fileCollector()`.
 * @param options - Where to read from, `filesUrl` or `baseUrl`, where to write, how to warn, and how many to copy at
 * once, 8 by default.
 * @returns How many were copied.
 */
export const copyFiles = async (files: DruxtStaticFile[], { origin, publicDir, warn, concurrency = 8 }: { origin: string, publicDir: string, warn: (message: string) => void, concurrency?: number }): Promise<number> => {
  const root = resolve(publicDir)
  const queue = [...files]
  let copied = 0
  const copy = async (): Promise<void> => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const url = `${trimEndSlashes(origin)}${next.request}`
      try {
        const target = resolve(root, ...decodeURIComponent(next.file).split('/').filter(Boolean))
        if (!target.startsWith(`${root}/`)) throw new Error('its path leaves the output directory')
        const response = await globalThis.fetch(url)
        if (!response.ok) throw new Error(`Drupal answered ${response.status}`)
        await mkdir(dirname(target), { recursive: true })
        await writeFile(target, Buffer.from(await response.arrayBuffer()))
        copied++
      } catch (error) {
        warn(`${DRUXT_E_STATIC_FILE}: ${next.file} was not copied into the static build, as ${(error as Error).message} at ${url}. The page links to it on the site, where it is missing.`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, copy))
  return copied
}

/** A language, as `getLanguages()` gives it: its langcode and its URL prefix. The prefix is empty when it has none. */
export interface DruxtPrerenderLanguage {
  langcode: string
  prefix: string
  default?: true
}

/** A published page Drupal lists: its alias, if any, its system path and its language. */
export interface DruxtPrerenderPage {
  alias?: string | null
  system: string
  langcode: string
}

/** The resource types whose entities are pages: content and taxonomy terms. */
const PAGE_TYPES = /^(?:node|taxonomy_term)--/

/** The start of every error for a failed read of the pages. */
const PRERENDER_FAILED = '[druxt] The static build could not list Drupal\'s published pages'

/**
 * Reads Drupal's published pages, through the build client, under each language's prefix.
 *
 * It reads every published node and taxonomy term of the types the index lists, with its path field.
 *
 * Under a language's prefix, an entity with no translation comes back in its own language. So a page counts under its
 * own language only.
 *
 * A read that fails would leave that type's pages in that language out of the static site. So it throws instead. It
 * throws once every read has ended, and names each type and language it could not list.
 *
 * @param client - The build client.
 * @param languages - The site's languages, from `getLanguages()`. None, for a site with one language.
 * @param only - The resource types to list, from a `druxt.static.routes` list. A string names one type, and a RegExp
 * matches some.
 * @returns The pages.
 * @throws When the JSON:API index cannot be read, or a read of a type's pages fails.
 * @throws When a string in `only` names no node or taxonomy term type of the site. A misspelt type would otherwise
 * leave its pages out with no word.
 */
export const readPrerenderPages = async (client: DruxtClient, languages: DruxtPrerenderLanguage[], only?: Array<string | RegExp>): Promise<DruxtPrerenderPage[]> => {
  const index = await client.getIndex().catch((error: Error) => {
    throw new Error(`${PRERENDER_FAILED}: the JSON:API index could not be read: ${error.message}`, { cause: error })
  })
  const listed = Object.keys(index).filter((type) => PAGE_TYPES.test(type))
  const unknown = (only || []).filter((entry): entry is string => typeof entry === 'string' && !listed.includes(entry))
  if (unknown.length) throw new Error(`${PRERENDER_FAILED}: druxt.static.routes names ${unknown.map((type) => `'${type}'`).join(', ')}, which ${unknown.length === 1 ? 'is' : 'are'} not among the site's node and taxonomy term types: ${listed.join(', ') || 'none'}.`)
  const types = only ? listed.filter((type) => only.some((entry) => typeof entry === 'string' ? entry === type : entry.test(type))) : listed
  const under = languages.length ? languages : [{ langcode: '', prefix: '' }]
  const reads = under.flatMap((language) => types.map(async (type): Promise<DruxtPrerenderPage[]> => {
    const node = type.startsWith('node--')
    const id = node ? 'drupal_internal__nid' : 'drupal_internal__tid'
    const query = new DrupalJsonApiParams().addFields(type, ['path', 'langcode', id]).addFilter('status', '1')
    const prefix = language.prefix ? `/${language.prefix}` : ''
    const rows = await client.getCollectionAll(type, query, prefix).catch((error: Error) => {
      const where = prefix ? `${type} under ${prefix} (${language.langcode})` : `${type}, unprefixed`
      throw new Error(`${where}: ${error.message}`, { cause: error })
    })
    return rows
      .flatMap((collection) => collection.data as Array<{ attributes?: Record<string, unknown> }>)
      .filter((row) => !language.langcode || row.attributes?.langcode === language.langcode)
      .map((row) => ({
        alias: (row.attributes?.path as { alias?: string | null } | undefined)?.alias ?? null,
        system: `${node ? '/node/' : '/taxonomy/term/'}${String(row.attributes?.[id] ?? '')}`,
        langcode: String(row.attributes?.langcode ?? language.langcode),
      }))
  }))
  const settled = await Promise.allSettled(reads)
  const failed = settled.flatMap((read) => (read.status === 'rejected' ? [(read.reason as Error).message] : []))
  if (failed.length) {
    throw new Error(`${PRERENDER_FAILED} of ${failed.length === 1 ? 'one type' : `${failed.length} types`}, so their pages would be missing from the static site: ${failed.join('; ')}. Fix the read, or set druxt.static.routes to false and list the pages in the druxt:prerender hook.`)
  }
  return settled.flatMap((read) => (read.status === 'fulfilled' ? read.value : []))
}

/**
 * Gets the site's paths for Drupal's published pages.
 *
 * The paths are each language's root, and then each page under its language's URL prefix. A page is at its alias, or at
 * its system path when it has no alias.
 *
 * A page in a language the site has no prefix for, such as `und`, goes under the default language's prefix.
 *
 * @param languages - The site's languages, from `getLanguages()`.
 * @param pages - The pages, from `readPrerenderPages()`.
 * @returns The paths, each once, sorted.
 *
 * @example @lang ts
 * prerenderPaths([{ langcode: 'en', prefix: 'en', default: true }], [{ alias: '/recipes/a', system: '/node/1', langcode: 'en' }])
 * // ['/', '/en', '/en/recipes/a']
 */
export const prerenderPaths = (languages: DruxtPrerenderLanguage[], pages: DruxtPrerenderPage[]): string[] => {
  const prefixes = new Map(languages.map((language) => [language.langcode, language.prefix ? `/${language.prefix}` : '']))
  const fallback = prefixes.get(languages.find((language) => language.default)?.langcode ?? '') ?? ''
  const paths = new Set<string>(['/', ...prefixes.values()].filter(Boolean))
  for (const page of pages) {
    const path = page.alias || page.system
    // A system path with no id names no page.
    if (!path.startsWith('/') || path.endsWith('/')) continue
    paths.add(`${prefixes.get(page.langcode) ?? fallback}${path}`)
  }
  return [...paths].sort()
}
