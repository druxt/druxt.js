import chalk from 'chalk'
import { join, resolve } from 'path'
import meta from '../../package.json'

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

    // Enable proxying of the Drupal site files.
    if ((options.proxy || {}).files) {
      const filesPath = typeof options.proxy.files === 'string' ? options.proxy.files : 'default'
      proxies[`/sites/${filesPath}/files`] = options.baseUrl
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

  // Make the $druxt plugin the first to load.
  const extendPlugins = this.options.extendPlugins
  this.options.extendPlugins = (plugins) => {
    // Run the user defined extendPlugins function if defined.
    plugins = typeof extendPlugins === 'function' ? extendPlugins(plugins) : plugins

    // Find the $druxt plugin.
    const index = plugins.findIndex(({ src }) => src === `${this.options.buildDir}/druxt.js`)
    const plugin = plugins[index]

    // Move the $druxt plugin to first place.
    plugins.splice(index, 1)
    plugins.unshift(plugin)

    return plugins
  }

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
  this.options.cli.badgeMessages.push(`${chalk.blue.bold('Druxt')} @ v${meta.version}`)
  this.options.cli.badgeMessages.push(`${chalk.bold('API:')} ${chalk.blue.underline(options.baseUrl + options.endpoint)}`)
}

export { DruxtNuxtModule }

/**
 * Module options object.
 *
 * @typedef {object} ModuleOptions
 * @property {string} baseUrl - The Base URL of the Drupal JSON:API backend.
 * @property {string} [endpoint=/jsonapi] - The JSON:API endpoint path.
 * @property {object} [proxy] - Proxy settings object.
 * @property {boolean} [proxy.api] - Proxy the JSON:API.
 * @property {(boolean|string)} [proxy.files] - Proxy Drupal's site files directory. Provide String to specify multi-site path.
 *
 * @example @lang js
 * export default {
 *   modules: ['druxt'],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org',
 *     endpoint: '/jsonapi',
 *     proxy: {
 *       api: true,
 *       files: 'default'
 *     }
 *   }
 * }
 */
