import { resolve } from 'path'

/**
 * Nuxt module function to install Druxt Site.
 *
 * - Adds the DruxtSite component.
 * - Adds the core modules for DruxtJS Site.
 * - Adds default configuration for @nuxtjs/proxy.
 * - Enables Vuex store.
 *
 * @param {ModuleOptions} moduleOptions - The Nuxt.js module options.
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

  // Add Nuxt.js modules.
  const modules = [
    '@nuxtjs/proxy',
    'druxt',
    'druxt-blocks',
    'druxt-breadcrumb',
    'druxt-entity',
    'druxt-menu',
    'druxt-router',
    'druxt-schema',
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

/**
 * Module options object.
 *
 * @typedef {object} ModuleOptions
 * @see {@link ./typedefs/moduleOptions|ModuleOptions}
 */
