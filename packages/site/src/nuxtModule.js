import { existsSync } from 'fs'
import { join, resolve } from 'path'
import DruxtSiteStorybook from './nuxtStorybook'

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
    proxy: {
      api: false,
      files: true,
      ...((this.options || {}).druxt || {}).proxy,
    },
    site: {
      layout: true,
      ...((this.options || {}).druxt || {}).site,
      ...moduleOptions,
    },
  }
  this.options.druxt = options

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
  })

  // Add Druxt modules.
  const druxtModules = [
    'druxt',
    'druxt-blocks',
    'druxt-breadcrumb',
    'druxt-entity',
    'druxt-menu',
    'druxt-router/nuxt',
    'druxt-schema',
    'druxt-views'
  ]
  for (const module of druxtModules) {
    await this.addModule(module)
  }

  // Add default layout.
  if (!(await existsSync(resolve(this.options.srcDir, this.options.dir.layouts))) && options.site.layout) {
    this.addLayout(resolve(__dirname, './layouts/default.vue'), 'default')
  }

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    await DruxtSiteStorybook.call(this, { options, stories })
  })
}

DruxtSiteNuxtModule.meta = require('../package.json')

export { DruxtSiteNuxtModule }

/**
 * Module options object.
 *
 * @typedef {object} ModuleOptions
 * @see {@link ./typedefs/moduleOptions|ModuleOptions}
 */
