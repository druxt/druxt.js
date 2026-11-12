import { useRuntimeConfig } from '#imports'
import { resolveFileUrl } from '@druxt/core/files'
import type { DruxtFileUrl } from '@druxt/core/files'
import type { DruxtPublicConfig } from './types'

/**
 * Resolves a Drupal file's URL, such as an image's `uri.url`, for the site, as the default output does: on the site
 * through `proxy.files`, else absolute on `druxt.filesUrl` or `druxt.baseUrl`, and absolute on a static build, unless
 * `druxt.static.files` keeps a public file on the site. Read in `setup()`.
 *
 * @returns The resolver, giving the URL and whether it was rewritten.
 *
 * @example @lang ts
 * const fileUrl = useDruxtFileUrl()
 * const { url } = fileUrl('/sites/default/files/logo.png')
 */
export function useDruxtFileUrl(): (url: string) => DruxtFileUrl {
  const runtimeConfig = useRuntimeConfig()
  const config = runtimeConfig.public.druxt as unknown as DruxtPublicConfig
  const options = {
    // With Drupal's address left out of the pages, no file URL is made on it, on the server or in the browser.
    baseUrl: config.baseUrlHidden ? '' : config.baseUrl,
    filesUrl: config.filesUrl || undefined,
    proxyFiles: config.proxy?.files,
    static: !!config.staticBuild,
    staticFiles: !!config.staticFiles,
    appBaseURL: runtimeConfig.app.baseURL,
  }
  return (url) => resolveFileUrl(url, options)
}
