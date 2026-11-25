import { trimEndSlashes } from '@druxt/core/routes'
// This file imports nothing from `#imports`, because the plugins and the unit tests both use it.

/**
 * What a page is given in place of `druxt.baseUrl` when the browser has no use for Drupal's address.
 *
 * It is the path Drupal is served under, such as `/drupal`. It is empty for a Drupal at its host's root, and for a
 * base URL that does not parse. The path is no secret, and the browser needs it to read Drupal's links as paths.
 *
 * @param baseUrl - `druxt.baseUrl`.
 */
export const hiddenBaseUrl = (baseUrl: string): string => {
  try {
    return trimEndSlashes(new URL(baseUrl).pathname)
  } catch {
    return ''
  }
}

/**
 * The browser's `baseUrl` on a site whose pages hold no Drupal address.
 *
 * It is the site's own origin, with the path Drupal is served under. The browser makes no request to it, or makes
 * its requests through the site's proxy.
 *
 * @param hidden - What the page was given, from `hiddenBaseUrl()`.
 * @param origin - The site's origin, `window.location.origin`.
 */
export const browserBaseUrl = (hidden: string, origin: string): string => `${origin}${hidden}`

/** What Nuxt writes just before a page's config, in the script that holds it. */
const CONFIG = '__NUXT__.config='

/**
 * Finds a key of an object, in the text Nuxt writes a page's config as.
 *
 * Only the object's own keys are read. A key of an object inside it, and the text of a string, are passed over.
 *
 * @param text - The text.
 * @param from - Where the object's keys start, just past its `{`.
 * @param key - The key.
 * @returns Where the key's value starts, or -1 when the object has no such key.
 */
const valueAt = (text: string, from: number, key: string): number => {
  let depth = 0
  for (let at = from; at < text.length; at++) {
    const char = text[at]
    if (char === '"') {
      for (at++; at < text.length && text[at] !== '"'; at++) if (text[at] === '\\') at++
    } else if (char === '{' || char === '[') {
      depth++
    } else if (char === '}' || char === ']') {
      if (--depth < 0) return -1
    } else if (!depth && (at === from || text[at - 1] === ',') && text.startsWith(`${key}:`, at)) {
      return at + key.length + 1
    }
  }
  return -1
}

/**
 * Takes Drupal's address out of the config script Nuxt wrote into a page's markup.
 *
 * It is for a page with no server render, whose config no app plugin sees. That is the shell a static host serves
 * for a page that was not built.
 *
 * Only Druxt's own `baseUrl` is changed, in the `druxt` object of the public config. Another integration's setting
 * may hold the same address, and is its own.
 *
 * @param html - A part of the page's markup.
 * @param baseUrl - `druxt.baseUrl`.
 */
export const stripBaseUrl = (html: string, baseUrl: string): string => {
  const config = baseUrl ? html.indexOf(CONFIG) : -1
  if (config === -1) return html
  const from = JSON.stringify(baseUrl)
  const to = JSON.stringify(hiddenBaseUrl(baseUrl))
  // A config that is not written as one object has no keys to follow, so every base URL with the address is changed.
  if (html[config + CONFIG.length] !== '{') return html.split(`baseUrl:${from}`).join(`baseUrl:${to}`)
  let at = config + CONFIG.length
  for (const key of ['public', 'druxt']) {
    at = valueAt(html, at + 1, key)
    if (at === -1 || html[at] !== '{') return html
  }
  at = valueAt(html, at + 1, 'baseUrl')
  return at !== -1 && html.startsWith(from, at) ? `${html.slice(0, at)}${to}${html.slice(at + from.length)}` : html
}
