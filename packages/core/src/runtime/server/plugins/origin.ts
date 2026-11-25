import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import type { DruxtPublicConfig } from '../../types'
import { stripBaseUrl } from '../../utils/origin'

// Takes Drupal's address out of the markup of a page with no server render, when nothing in the browser uses it.
//
// Such a page gets its config from Nitro and runs no app plugin. One example is the shell a static host serves for a
// page that was not built. For a server-rendered page, the app's own plugin leaves the address out before the page
// is written.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const druxt = useRuntimeConfig(event).public.druxt as unknown as DruxtPublicConfig | undefined
    if (!druxt?.baseUrlHidden) return
    for (const part of ['head', 'bodyPrepend', 'bodyAppend'] as const) {
      html[part] = html[part].map((markup) => stripBaseUrl(markup, druxt.baseUrl))
    }
  })
})
