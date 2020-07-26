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
 * Nuxt.js module function.
 *
 * Adds the core Druxt modules to the Nuxt.js application:
 * - [druxt-blocks](http://npmjs.com/package/druxt-blocks)
 * - [druxt-breadcrumb](http://npmjs.com/package/druxt-breadcrumb)
 * - [druxt-entity](http://npmjs.com/package/druxt-entity)
 * - [druxt-menu](http://npmjs.com/package/druxt-menu)
 * - [druxt-router](http://npmjs.com/package/druxt-router)
 * - [druxt-schema](http://npmjs.com/package/druxt-schema)
 * - [druxt-search](http://npmjs.com/package/druxt-search)
 * - [druxt-views](http://npmjs.com/package/druxt-views)
 *
 * @param {object} moduleOptions - The Nuxt.js module options.
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
