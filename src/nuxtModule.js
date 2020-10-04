import { resolve } from 'path'

/**
 * Nuxt.js module function.
 *
 * @param {object} moduleOptions - The Nuxt.js module options.
 */
const DruxtNuxtModule = function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt.js',
    options: this.options.druxt
  })
}

export { DruxtNuxtModule }
