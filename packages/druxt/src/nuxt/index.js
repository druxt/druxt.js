import chalk from 'chalk'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { join, normalize, resolve } from 'path'
import { DruxtClient } from '../client'
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
const DruxtNuxtModule = async function (moduleOptions = {}) {
  const options = {
    endpoint: '/jsonapi',
    ...moduleOptions,
    ...(this.options || {}).druxt,
  }

  // Normalize slashes.
  this.options.baseUrl = options.baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl
  this.options.endpoint = options.endpoint = options.endpoint.startsWith('/') ? options.endpoint : `/${options.endpoint}`

  const druxt = new DruxtClient(options.baseUrl, {
    ...options,
    // Disable API Proxy, as Proxies aren't available at build.
    proxy: { ...options.proxy || {}, api: false },
  })

  // Nuxt proxy integration.
  if (options.proxy) {
    const proxies = {}

    // Enable proxying of the API endpoint.
    // This is primarily used to avoid CORS errors.
    if ((options.proxy || {}).api) {
      // Main API Endpoint.
      proxies[options.endpoint] = options.baseUrl

      // Langcode prefixed API endpoints.
      const languageResourceType = 'configurable_language--configurable_language'
      if (((await druxt.getIndex(languageResourceType)) || {}).href) {
        const query = new DrupalJsonApiParams().addFields(languageResourceType, ['drupal_internal__id'])
        const languages = (await druxt.getCollectionAll(languageResourceType, query) || [])
          .map((o) => o.data)
          .flat()
          .filter((o) => !['und', 'zxx'].includes(((o || {}).attributes || {}).drupal_internal__id))
          .map((o) => o.attributes.drupal_internal__id)
        for (const langcode of languages) {
          proxies[`/${langcode}${options.endpoint}`] = options.baseUrl
        }
      }

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
          ...this.options.proxy,
          ...Object.keys(proxies).map((path) => `${options.baseUrl}${path}`)
        ]
      }
      else {
        this.options.proxy = {
          ...this.options.proxy,
          ...proxies
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

  // Install the @nuxtjs/axios module.
  if (!options.axios) {
    this.options.axios = {
      baseURL: options.baseUrl,
      proxy: !!(options.proxy || {}).api,
      ...this.options.axios
    }
    this.addModule('@nuxtjs/axios')
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

  // Make the $axios and $druxt plugins the first to load.
  const extendPlugins = this.options.extendPlugins
  this.options.extendPlugins = (plugins) => {
    // Run the user defined extendPlugins function if defined.
    plugins = typeof extendPlugins === 'function' ? extendPlugins(plugins) : plugins

    // Extract the $axios plugin.
    const axiosIndex = plugins.findIndex(({ src }) => src === normalize(`${this.options.buildDir}/axios.js`))
    const axiosPlugin = plugins[axiosIndex]
    plugins.splice(axiosIndex, 1)

    // Extract the $druxt plugin.
    const druxtIndex = plugins.findIndex(({ src }) => src === normalize(`${this.options.buildDir}/druxt.js`))
    const druxtPlugin = plugins[druxtIndex]
    plugins.splice(druxtIndex, 1)

    // Re-add the plugins.
    plugins = [axiosPlugin, druxtPlugin, ...plugins]

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

  // Development mode features.
  if (this.options.dev) {
    // Add the template stubber server middleware.
    this.addServerMiddleware({
      path: '/_druxt/template',
      handler: 'druxt/dist/server-middleware/template.mjs'
    })

    // Add the Vue devtools plugin.
    this.addPlugin({
      src: resolve(__dirname, '../dist/plugins/devtools.mjs'),
      fileName: 'druxt-devtools.js'
    })
  }

  // Nuxt Storybook.
  const self = this
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    // Druxt README story.
    self.addTemplate({
      src: resolve(__dirname, '../templates/stories/README.stories.mdx'),
      fileName: 'stories/druxt-README.stories.mdx',
    })
    stories.push(resolve(self.options.buildDir, './stories/druxt-README.stories.mdx'))

    // Druxt custom module story.
    self.addTemplate({
      src: resolve(__dirname, '../templates/stories/druxt-module.stories.mdx'),
      fileName: 'stories/druxt-module.stories.mdx',
    })
    stories.push(resolve(self.options.buildDir, './stories/druxt-module.stories.mdx'))

    // DruxtDebug component story.
    self.addTemplate({
      src: resolve(__dirname, '../templates/stories/druxt-debug.stories.js'),
      fileName: 'stories/druxt-debug.stories.js',
    })
    stories.push(resolve(self.options.buildDir, './stories/druxt-debug.stories.js'))
  })
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
