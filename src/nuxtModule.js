import { resolve } from 'path'

/**
 * Nuxt.js module function.
 *
 * - Adds the DruxtSite component.
 * - Adds the core modules for DruxtJS Site:
 *   - [@nuxtjs/proxy](https://www.npmjs.com/package/@nuxtjs/proxy)
 *   - [druxt-blocks](http://npmjs.com/package/druxt-blocks)
 *   - [druxt-breadcrumb](http://npmjs.com/package/druxt-breadcrumb)
 *   - [druxt-entity](http://npmjs.com/package/druxt-entity)
 *   - [druxt-menu](http://npmjs.com/package/druxt-menu)
 *   - [druxt-router](http://npmjs.com/package/druxt-router)
 *   - [druxt-schema](http://npmjs.com/package/druxt-schema)
 *   - [druxt-search](http://npmjs.com/package/druxt-search)
 *   - [druxt-views](http://npmjs.com/package/druxt-views)
 * - Adds default configuration for @nuxtjs/proxy.
 * - Enables Vuex store.
 *
 * @param {object} moduleOptions - The Nuxt.js module options.
 */
const DruxtSiteNuxtModule = function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-site.js',
    options: this.options.druxt
  })

  // Add NuxtJS modules.
  const modules = [
    '@nuxtjs/proxy',
    // @todo {@link https://github.com/druxt/druxt-site/issues/2|Uncomment after DruxtJS 0.3.0 is released.}
    // 'druxt',
    'druxt-blocks',
    'druxt-breadcrumb',
    'druxt-entity',
    'druxt-menu',
    'druxt-router',
    'druxt-schema',
    'druxt-search',
    'druxt-views'
  ]
  for (const key in modules) {
    this.addModule(modules[key])
  }

  // Setup proxy for 'sites/default/files'.
  // @todo {@link https://github.com/nuxt-community/proxy-module/issues/80|Suppress warning}
  if (typeof this.options.proxy === 'undefined') {
    this.options.proxy = [this.options.druxt.baseUrl + '/sites/default/files']
  }

  // Enable JSON:API Menu items by default.
  if (typeof ((this.options.druxt || {}).menu || {}).jsonApiMenuItems === 'undefined') {
    this.options.druxt.menu = {
      ...this.options.druxt.menu,
      ...{ jsonApiMenuItems: true }
    }
  }

  // Enable Vuex Store.
  this.options.store = true
}

export { DruxtSiteNuxtModule }
