import { existsSync } from 'fs'
import { join, resolve } from 'path'

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
const DruxtSiteNuxtModule = async function (moduleOptions = {}) {
  // Set default options.
  const options = {
    baseUrl: moduleOptions.baseUrl,
    ...(this.options || {}).druxt || {},
    menu: {
      jsonApiMenuItems: true,
      ...((this.options || {}).druxt || {}).menu,
    },
    site: {
      layout: true,
      ...((this.options || {}).druxt || {}).site,
      ...moduleOptions,
    },
  }

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
  })

  // Add Druxt modules.
  this.addModule(['druxt', options])
  const druxtModules = [
    'druxt-blocks',
    'druxt-breadcrumb',
    'druxt-entity',
    'druxt-menu',
    'druxt-router',
    'druxt-schema',
    'druxt-views'
  ]
  for (const module of druxtModules) {
    this.addModule([module, { baseUrl: options.baseUrl, ...options[module.split('-')[1]] || {}}])
  }

  // Setup proxy for 'sites/default/files'.
  if (typeof this.options.proxy === 'undefined') {
    this.options.proxy = [options.baseUrl + '/sites/default/files']
  }
  this.addModule('@nuxtjs/proxy')

  // Enable Vuex Store.
  this.options.store = true

  // Add default layout.
  if (!(await existsSync(resolve(this.options.srcDir, this.options.dir.layouts))) && options.site.layout) {
    this.addLayout(resolve(__dirname, './layouts/default.vue'), 'default')
  }
}

DruxtSiteNuxtModule.meta = require('../package.json')

export { DruxtSiteNuxtModule }

/**
 * Module options object.
 *
 * @typedef {object} ModuleOptions
 * @see {@link ./typedefs/moduleOptions|ModuleOptions}
 */
