import { resolve } from 'path'

/**
 * The Nuxt.js module function.
 *
 * - Adds the Nuxt.js plugin.
 *
 * The module function should not be used directly, but rather installed via yout Nuxt.js configuration file.
 *
 * Options are set on the root level `druxt` Nuxt.js config object.
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   modules: [
 *     'druxt-entity'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://example.com'
 *   }
 * }
 *
 * @todo Add module level options.
 * @todo Document options.
 *
 * @property {object} options.druxt - DruxtJS root level options.
 * @property {string} options.druxt.baseUrl - Base URL of Drupal JSON:API backend.
 */
const DruxtEntityModule = function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }
  const options = this.options.druxt

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-entity.js',
    options
  })
}

export { DruxtEntityModule }
