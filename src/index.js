/**
 * @vuepress
 * ---
 * title: DruxtModule
 * headline: The Nuxt.js module
 * ---
 */

export { Druxt } from './druxt.js'

export { DruxtStore } from './store'

/**
 * Adds Druxt modules to Nuxt.js application.
 *
 * @param {*} moduleOptions
 */
const DruxtModule = function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }

  // Add Druxt modules.
  const modules = [
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

  // Enable the Vuex store.
  this.options.store = true
}

export default DruxtModule
