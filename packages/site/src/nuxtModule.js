import { join } from 'path'

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
const DruxtSiteNuxtModule = function () {
  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
  })

  // Enable JSON:API Menu items by default.
  if (typeof ((this.options.druxt || {}).menu || {}).jsonApiMenuItems === 'undefined') {
    this.options.druxt.menu = {
      ...this.options.druxt.menu,
      ...{ jsonApiMenuItems: true }
    }
  }

  // Setup proxy for 'sites/default/files'.
  if (typeof this.options.proxy === 'undefined') {
    this.options.proxy = [this.options.druxt.baseUrl + '/sites/default/files']
  }

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

  // Enable Vuex Store.
  this.options.store = true
}

DruxtSiteNuxtModule.meta = require('../package.json')

export { DruxtSiteNuxtModule }

/**
 * Module options object.
 *
 * @typedef {object} ModuleOptions
 * @see {@link ./typedefs/moduleOptions|ModuleOptions}
 */
