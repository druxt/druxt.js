import { resolve } from 'path'

/**
 * The NuxtJS module function.
 *
 * - Adds the Vue.js components to the NuxtJS frontend.
 *
 * The module function should not be used directly, but rather installed via yout NuxtJS configuration file.
 *
 * Options are set on the root level `druxt` NuxtJS config object.
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   modules: [
 *     'druxt-blocks'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demi-api.druxtjs.org'
 *   }
 * }
 *
 * @param {object} moduleOptions - NuxtJS module options object.
 */
const DruxtBlocksNuxtModule = function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }
  const options = this.options.druxt

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-blocks.js',
    options
  })
}

export { DruxtBlocksNuxtModule }
