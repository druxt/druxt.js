/**
 * @vuepress
 * ---
 * title: Druxt
 * headline: The Druxt class
 * ---
 */

import { DruxtRouter } from 'druxt-router'

/**
 * Druxt class.
 */
class Druxt {

  /**
   * Druxt constructor.
   *
   * @param {string} baseURL
   * @param {object} options
   */
  constructor (baseURL, options = {}) {
    // Check for URL.
    if (!baseURL) {
      throw new Error('The \'baseURL\' parameter is required.')
    }

    /**
     * Druxt.js options.
     *
     * @type {object}
     * @public
     */
    this.options = {
      endpoint: 'jsonapi',
      ...options
    }

    /**
     * Druxt router instance.
     *
     * @type {DruxtRouter}
     * @public
     */
    this.druxtRouter = new DruxtRouter(baseURL, options)
  }
}

export { Druxt }
