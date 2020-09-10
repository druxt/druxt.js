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

  // Add NuxtJS modules.
  const modules = [
    '@nuxtjs/proxy',
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

  // Enable Vuex Store.
  this.options.store = true
}

export { DruxtModule }
