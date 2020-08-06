/**
 * @vuepress
 * ---
 * title: DruxtRouterModule
 * ---
 */

import { resolve } from 'path'

/**
 * The Nuxt.js module function.
 *
 * - Extends the Vue router, adding the Druxt wildcard route.
 * - Adds the Druxt router plugin.
 * - Adds the Druxt router Vuex store.
 *
 * The module function should not be used directly, but rather installed via yout Nuxt.js configuration file.
 *
 * Options are set on the root level `druxt` Nuxt.js config object.
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   modules: [
 *     'druxt-router'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://example.com'
 *   }
 * }
 *
 * @todo [Add module level options]{@link https://github.com/druxt/druxt-router/issues/53}
 *
 * @property {object} options.druxt - Druxt.js root level options.
 * @property {string} options.druxt.baseUrl - Base URL of Drupal JSON:API backend.
 * @property {string} options.druxt.router.component - File to custom Router component.
 */
const DruxtRouterModule = function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }
  const options = this.options.druxt
  options.router = options.router || {}

  this.extendRoutes((routes, resolve) => {
    // Only add router component if custom component is undefined.
    // @TODO - Validate custom component.
    // @TODO - Add test for custom component.
    // @TODO - Document usage.
    if (!options.router.component) {
      options.router.component = resolve(this.options.buildDir, 'components/druxt-router.js')
      this.addTemplate({
        src: resolve(__dirname, '../nuxt/component.js'),
        fileName: 'components/druxt-router.js',
        options
      })
    }

    // Add Druxt router custom wildcard route.
    routes.push({
      name: 'druxt-router',
      path: '*',
      component: options.router.component,
      chunkName: 'druxt-router'
    })
  })

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-router.js',
    options
  })

  // Add Vuex plugin.
  // @TODO - Ensure Vuex store is available.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/store.js'),
    fileName: 'store/druxt-router.js',
    options
  })
}

export { DruxtRouterModule }
