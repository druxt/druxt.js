import { join, resolve } from 'path'

/**
 * The Nuxt.js module function.
 *
 * - Extends the Vue router, adding the Druxt wildcard route.
 * - Adds the Druxt router plugin.
 * - Adds the Druxt router Vuex store.
 *
 * The module function should not be used directly, but rather installed via your Nuxt configuration file.
 *
 * Options are set on the root level `druxt` Nuxt config object.
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   modules: [
 *     'druxt-router'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demi-api.druxtjs.org'
 *   }
 * }
 *
 * @property {object} options.druxt - Druxt root level options.
 * @property {string} options.druxt.baseUrl - Base URL of Drupal JSON:API backend.
 * @property {string} options.druxt.router.component - File to custom Router component.
 */
const DruxtRouterNuxtModule = function (moduleOptions) {
  // Set default options.
  const options = {
    baseUrl: moduleOptions.baseUrl,
    ...(this.options || {}).druxt || {},
    router: {
      pages: true,
      wildcard: true,
      ...((this.options || {}).druxt || {}).router,
      ...moduleOptions,
    }
  }

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
  })

  // Add Druxt router custom wildcard route.
  if (options.router.wildcard) {
    this.addTemplate({
      src: resolve(__dirname, '../nuxt/component.js'),
      fileName: 'components/druxt-router.js',
      options
    })

    this.extendRoutes((routes, resolve) => {
      routes.push({
        name: 'druxt-router',
        path: '*',
        component: resolve(this.options.buildDir, 'components/druxt-router.js'),
        chunkName: 'druxt-router'
      })
    })
  }

  // Ignore page routes.
  if (options.router.wildcard && !options.router.pages) {
    this.nuxt.hook('build:before', () =>
      this.nuxt.options.build.createRoutes = () => []
    )
  }

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-router.js',
    options
  })

  // Enable Vuex Store.
  this.options.store = true

  // Add Vuex plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/store.js'),
    fileName: 'store/druxt-router.js',
    options
  })
}

export { DruxtRouterNuxtModule }
