import { warn } from 'consola'

/**
 * Nuxt.js module function.
 *
 * @param {object} moduleOptions - The Nuxt.js module options.
 */
const DruxtModule = function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }

  warn('The out of the box, decoupled Drupal Site functionality is deprecated. Please see the `druxt-site` module.')
  this.addModule('druxt-site')
}

export { DruxtModule }
