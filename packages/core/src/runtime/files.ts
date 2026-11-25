import { useRuntimeConfig } from '#imports'
import { resolveFileUrl } from '@druxt/core/files'
import type { DruxtFileUrl } from '@druxt/core/files'
import type { DruxtPublicConfig } from './types'

/**
 * Gets the function that resolves a Drupal file's URL for the site, as the default output does. An image's
 * `uri.url` is one such URL.
 *
 * - With `proxy.files`, the URL is on the site.
 * - Otherwise it is absolute, on `druxt.filesUrl` or `druxt.baseUrl`.
 * - On a static build it is absolute, unless `druxt.static.files` keeps a public file on the site.
 *
 * Call it in `setup()`.
 *
 * @returns The resolver. It gives the URL, and whether the URL was rewritten.
 *
 * @example @lang ts
 * const fileUrl = useDruxtFileUrl()
 * const { url } = fileUrl('/sites/default/files/logo.png')
 */
export function useDruxtFileUrl(): (url: string) => DruxtFileUrl {
  const runtimeConfig = useRuntimeConfig()
  const config = runtimeConfig.public.druxt as unknown as DruxtPublicConfig
  const options = {
    // When Drupal's address is left out of the pages, no file URL is made on it, on the server or in the browser.
    baseUrl: config.baseUrlHidden ? '' : config.baseUrl,
    filesUrl: config.filesUrl || undefined,
    proxyFiles: config.proxy?.files,
    static: !!config.staticBuild,
    staticFiles: !!config.staticFiles,
    appBaseURL: runtimeConfig.app.baseURL,
  }
  return (url) => resolveFileUrl(url, options)
}
