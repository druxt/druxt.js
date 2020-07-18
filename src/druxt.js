import { DruxtRouter } from 'druxt-router'

class Druxt {
  /**
   * Constructor.
   *
   * @param string baseURL
   * @param object options
   */
  constructor (baseURL, options = {}) {
    // Check for URL.
    if (!baseURL) {
      throw new Error('The \'baseURL\' parameter is required.')
    }

    this.options = {
      endpoint: 'jsonapi',
      ...options
    }

    // Setup Druxt Router.
    this.druxtRouter = new DruxtRouter(baseURL, options)
  }
}

export { Druxt }
