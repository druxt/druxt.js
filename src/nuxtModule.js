import { resolve } from 'path'

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
    ...moduleOptions,
    ...(this.options || {}).druxt
  }

  // Install the @nuxtjs/axios module.
  this.options.axios = {
    baseURL: options.baseUrl,
    ...this.options.axios
  }
  this.addModule('@nuxtjs/axios')

  // Ensure Axios plugin is loaded before Druxt plugin.
  const extendPluginsFn = this.options.extendPlugins
  this.options.extendPlugins = (plugins) => {
    if (typeof extendPluginsFn === 'function') {
      plugins = extendPluginsFn(plugins)
    }
    const axiosIndex = plugins.findIndex(
      ({ src }) => src === this.options.buildDir + '/axios.js'
    )
    const axiosPlugin = plugins[axiosIndex]

    plugins.splice(axiosIndex, 1)
    plugins.unshift(axiosPlugin)
  }

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt.js',
    options
  })

  // Add Vuex plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/store.js'),
    fileName: 'store/druxt.js',
    options
  })

  // Enable Vuex Store.
  this.options.store = true
}

DruxtNuxtModule.meta = require('../package.json')

export { DruxtNuxtModule }

/**
 * Module options object.
 *
 * @typedef {object} ModuleOptions
 * @property {string} baseUrl - The Base URL of the Drupal JSON:API backend.
 */
