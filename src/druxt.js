/**
 * @vuepress
 * ---
 * title: Druxt
 * headline: The Druxt class
 * ---
 */

import { DruxtRouter } from 'druxt-router'

/**
 * The Druxt class.
 *
 * Core and common functionality for Druxt.js.
 */
class Druxt {

  /**
   * Druxt constructor.
   *
   *
   * @example
   * const druxt = new Druxt('https://example.com', {})
   *
   * @param {string} baseURL - The base URL of the Drupal JSON:API backend.
   * @param {object} options - Druxt.js options.
   * @param {string} options.endpoint - The JSON:API endpoint (e.g, 'jsonapi').
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
