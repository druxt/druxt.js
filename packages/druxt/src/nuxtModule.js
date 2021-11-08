import chalk from 'chalk'
import { join, resolve } from 'path'

/**
 * Nuxt module function to install Druxt.
 *
 * @param {ModuleOptions} moduleOptions - DruxtJS module options.
 *
 * @example <caption>Nuxt configuration with module options</caption> @lang js
 * module.exports = {
 *   modules: [
 *     ['druxt', { baseUrl: 'https://demo-api.druxtjs.org' }]
 *   ]
 * }
 *
 * @example <caption>Nuxt configuration with root level options</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 */
const DruxtNuxtModule = function (moduleOptions = {}) {
  const options = {
    endpoint: '/jsonapi',
    ...moduleOptions,
    ...(this.options || {}).druxt,
  }

  // Nuxt proxy integration.
  if (options.proxy) {
    const proxies = {}

    // Enable proxying of the API endpoint.
    // This is primarily used to avoid CORS errors.
    if ((options.proxy || {}).api) {
      // Main API Endpoint.
      proxies[options.endpoint] = options.baseUrl
      // Decoupled Router Endpoint.
      proxies['/router/translate-path'] = options.baseUrl
    }

    // If there are existing proxy settings, merge in the appropriate format.
    if (this.options.proxy) {
      if (Array.isArray(this.options.proxy)) {
        this.options.proxy = [
          ...Object.keys(proxies).map((path) => `${options.baseUrl}${path}`),
          ...this.options.proxy
        ]
      }
      else {
        this.options.proxy = {
          ...proxies,
          ...this.options.proxy
        }
      }
    }
    // Otherwise just set the the required proxies.
    else {
      this.options.proxy = proxies
    }

    // Enable the Proxy module.
    this.addModule('@nuxtjs/proxy')
  }

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
  })

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../templates/plugin.js'),
    fileName: 'druxt.js',
    options
  })

  // Add Vuex plugin.
  this.addPlugin({
    src: resolve(__dirname, '../templates/store.js'),
    fileName: 'store/druxt.js',
    options
  })

  // Enable Vuex Store.
  this.options.store = true

  // Enable components auto-discovery by default.
  this.options.components = this.options.components ?? true

  // Add CLI badge.
  this.options.cli.badgeMessages.push(`${chalk.bold('Druxt API:')} ${chalk.blue.underline(options.baseUrl + options.endpoint)}`)
}

DruxtNuxtModule.meta = require('../package.json')

export { DruxtNuxtModule }

/**
 * Module options object.
 *
 * @typedef {object} ModuleOptions
 * @property {string} baseUrl - The Base URL of the Drupal JSON:API backend.
 */
