// No #imports here: the plugins and the unit tests both use this file.

/**
 * What a page is given in place of `druxt.baseUrl` when the browser has no use for Drupal's address: the path Drupal
 * is served under, such as `/drupal`, and nothing for a Drupal at its host's root. The path is no secret, and the
 * browser needs it to read Drupal's links as paths.
 *
 * @param baseUrl - `druxt.baseUrl`.
 */
export const hiddenBaseUrl = (baseUrl: string): string => {
  try {
    return new URL(baseUrl).pathname.replace(/\/+$/, '')
  } catch {
    return ''
  }
}

/**
 * The browser's `baseUrl` on a site whose pages hold no Drupal address: the site's own origin, with the path Drupal
 * is served under. The browser makes no request to it, or makes its requests through the site's proxy.
 *
 * @param hidden - What the page was given, from `hiddenBaseUrl()`.
 * @param origin - The site's origin, `window.location.origin`.
 */
export const browserBaseUrl = (hidden: string, origin: string): string => `${origin}${hidden}`

/**
 * Takes Drupal's address out of the config script Nuxt wrote into a page's markup, for a page with no server
 * render, whose config no app plugin sees: the shell a static host serves for a page that was not built.
 *
 * @param html - A part of the page's markup.
 * @param baseUrl - `druxt.baseUrl`.
 */
export const stripBaseUrl = (html: string, baseUrl: string): string => {
  if (!baseUrl || !html.includes('__NUXT__')) return html
  return html.split(`baseUrl:${JSON.stringify(baseUrl)}`).join(`baseUrl:${JSON.stringify(hiddenBaseUrl(baseUrl))}`)
}
