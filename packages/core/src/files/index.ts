import { trimEndSlashes } from '../routes'

// @druxt/core/files: where a Drupal file's URL points from the site. Framework free: nothing here imports Vue, Nuxt or
// h3, so it runs on the server and in the browser alike.

/** What a file URL resolves against: the site's Drupal, and how the site serves Drupal's files. */
export interface DruxtFileUrlOptions {
  /** Drupal's base URL, `druxt.baseUrl`. */
  baseUrl: string
  /** The origin Drupal's files are served from, such as a CDN, `druxt.filesUrl`. Drupal's base URL when not set. */
  filesUrl?: string
  /** `druxt.proxy.files`: `true` for `sites/default/files`, or the site directory's name. */
  proxyFiles?: boolean | string
  /** Whether the build is static, as `nuxt generate` makes it, with no server to proxy the files. */
  static?: boolean
  /**
   * `druxt.static.files`: on a static build, a path in Drupal's public files stays on the site, under `appBaseURL`,
   * as the build copies the file into the output.
   */
  staticFiles?: boolean
  /** The app's base URL, `/` unless the site is served under a path. Read with `staticFiles`. */
  appBaseURL?: string
}

/** A path in Drupal's public files, under a site directory. A private file, under `/system/files/`, is not one. */
const PUBLIC_FILES = /^\/sites\/[^/]+\/files\//

/** A resolved file URL, and whether it differs from Drupal's. */
export interface DruxtFileUrl {
  url: string
  rewritten: boolean
}

/**
 * Where a Drupal file's URL, such as an image's `uri.url`, points from the site. Drupal gives a path on its own
 * origin, such as `/sites/default/files/logo.png`. With `proxy.files` on, a path in the proxied files directory stays
 * on the site, which proxies it to Drupal. Otherwise, and always on a static build, which has no proxy, the path is
 * made absolute on `filesUrl`, or on Drupal's base URL. On a static build with `staticFiles` on, a path in Drupal's
 * public files stays on the site, under the app's base URL, as the build copies the file. An absolute URL is left as
 * it is.
 *
 * @param url - The file's URL, as Drupal gives it.
 * @param options - Drupal's base URL, the files URL, the files proxy, whether the build is static and whether it
 *   copies the files.
 * @returns The URL, and whether it was rewritten.
 *
 * @example @lang js
 * resolveFileUrl('/sites/default/files/logo.png', { baseUrl: 'https://drupal.example.com' })
 * // { url: 'https://drupal.example.com/sites/default/files/logo.png', rewritten: true }
 *
 * resolveFileUrl('/sites/default/files/logo.png', { baseUrl: 'https://drupal.example.com', proxyFiles: true })
 * // { url: '/sites/default/files/logo.png', rewritten: false }
 */
export function resolveFileUrl(url: string, { baseUrl, filesUrl, proxyFiles, static: isStatic, staticFiles, appBaseURL }: DruxtFileUrlOptions): DruxtFileUrl {
  // An absolute or protocol-relative URL, or anything that is not a path on Drupal's origin, is left alone.
  if (!url.startsWith('/') || url.startsWith('//')) return { url, rewritten: false }
  // The static build copied the file to the same path on the site.
  if (isStatic && staticFiles && PUBLIC_FILES.test(url)) {
    const base = trimEndSlashes(appBaseURL || '/')
    return { url: `${base}${url}`, rewritten: base !== '' }
  }
  const site = typeof proxyFiles === 'string' ? proxyFiles : 'default'
  if (proxyFiles && !isStatic && url.startsWith(`/sites/${site}/files/`)) return { url, rewritten: false }
  const origin = filesUrl || baseUrl
  if (!origin) return { url, rewritten: false }
  try {
    return { url: new URL(url, origin).href, rewritten: true }
  } catch {
    return { url, rewritten: false }
  }
}

// A `src` or `href` attribute whose value is a path in Drupal's public files, under a site directory, or its private
// files, in double or single quotes.
const FILE_ATTRIBUTE = /(\s(?:src|href)\s*=\s*)(["'])(\/(?:sites\/[^/"'\s]+\/files|system\/files)\/[^"']*)\2/gi

/**
 * Resolves the file URLs inside markup, such as an editor's inline image in a text field's processed HTML: each `src`
 * and `href` whose value is a path under `/sites/<site>/files/` or `/system/files/` goes through `resolve`, such as
 * `resolveFileUrl()` with the site's options. The rest of the markup is left byte for byte, so the server and the
 * browser render the same.
 *
 * @param html - The markup.
 * @param resolve - What a file path becomes.
 * @returns The markup with its file URLs resolved.
 *
 * @example @lang js
 * resolveFileUrlsInHtml('<img src="/sites/default/files/a.png">', (url) => resolveFileUrl(url, { baseUrl }).url)
 * // '<img src="https://drupal.example.com/sites/default/files/a.png">'
 */
export function resolveFileUrlsInHtml(html: string, resolve: (url: string) => string): string {
  return html.replace(FILE_ATTRIBUTE, (_match, lead: string, quote: string, url: string) => `${lead}${quote}${resolve(url)}${quote}`)
}
