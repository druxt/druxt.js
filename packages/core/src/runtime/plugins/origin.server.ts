import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import type { DruxtPublicConfig } from '../types'
import { hiddenBaseUrl } from '../utils/origin'

/**
 * Leaves Drupal's address out of the page when nothing in the browser uses it.
 *
 * Nuxt writes the public runtime config into every page, and the server reads the same config. So only the copy the
 * page is given changes: its `druxt.baseUrl` holds the path Drupal is served under, and no host.
 */
export default defineNuxtPlugin({
  name: 'druxt-origin',
  setup(nuxtApp) {
    const druxt = useRuntimeConfig().public.druxt as unknown as DruxtPublicConfig
    if (!druxt?.baseUrlHidden) return
    nuxtApp.hook('app:rendered', ({ ssrContext }) => {
      const config = ssrContext?.config as { public?: Record<string, unknown> } | undefined
      if (!ssrContext || !config?.public) return
      ssrContext.config = { ...config, public: { ...config.public, druxt: { ...druxt, baseUrl: hiddenBaseUrl(druxt.baseUrl) } } } as typeof ssrContext.config
    })
  },
})
