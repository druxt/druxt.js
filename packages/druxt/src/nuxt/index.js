import { addPluginTemplate, defineNuxtModule, installModule } from '@nuxt/kit'
import chalk from 'chalk'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { join, normalize, resolve } from 'path'
import { DruxtClient } from 'druxt'

/**
 * Nuxt module function to install Druxt.
 *
 * @param {ModuleOptions} moduleOptions - DruxtJS module options.
 *
 * @todo - Re-implement development mode features.
 * @todo - Re-implement storybook integration.
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
const DruxtNuxtModule = defineNuxtModule({
  meta: {
    name: 'druxt',
    configKey: 'druxt'
  },
  defaults: {
    proxy: {},
    baseUrl: '',
    endpoint: '/jsonapi'
  },

  async setup(moduleOptions, nuxt) {
    // This is required to prevent "FATAL: nuxt.options._layers is not iterable"
    // error when using `installModule()`.
    // @SEE https://github.com/nuxt/bridge/issues/1067
    nuxt.options._layers = nuxt.options._layers || []

    // Build the options object.
    const options = {
      // Merge @druxt/core module options.
      ...moduleOptions,
      // Merge root Druxt settings.
      ...nuxt.options?.druxt,
    }

    // Normalize slashes.
    nuxt.options.baseUrl = options.baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl
    nuxt.options.endpoint = options.endpoint = options.endpoint.startsWith('/') ? options.endpoint : `/${options.endpoint}`

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
      if (options.proxy?.api) {
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
      if (options.proxy?.files) {
        const filesPath = typeof options.proxy.files === 'string' ? options.proxy.files : 'default'
        proxies[`/sites/${filesPath}/files`] = options.baseUrl
      }

      // If there are existing proxy settings, merge in the appropriate format.
      if (nuxt.options.proxy) {
        if (Array.isArray(nuxt.options.proxy)) {
          nuxt.options.proxy = [
            ...nuxt.options.proxy,
            ...Object.keys(proxies).map((path) => `${options.baseUrl}${path}`)
          ]
        }
        else {
          nuxt.options.proxy = {
            ...nuxt.options.proxy,
            ...proxies
          }
        }
      }
      // Otherwise just set the the required proxies.
      else {
        nuxt.options.proxy = proxies
      }

      // Enable the Proxy module.
      await installModule('@nuxtjs/proxy', {}, nuxt)
    }

    // Install the @nuxtjs/axios module.
    if (!options.axios) {
      nuxt.options.axios = {
        baseURL: options.baseUrl,
        proxy: !!options.proxy?.api,
        ...nuxt.options.axios
      }
      await installModule('@nuxtjs/axios', {}, nuxt)
    }

    // Register components directories.
    nuxt.hook('components:dirs', dirs => {
      dirs.push({ path: join(__dirname, '../dist/components') })
    })

    // Add plugin.
    addPluginTemplate({
      src: resolve(__dirname, '../templates/plugin.js'),
      fileName: 'druxt.js',
      options
    })

    // Make the $axios and $druxt plugins the first to load.
    const extendPlugins = nuxt.options.extendPlugins
    nuxt.options.extendPlugins = (plugins) => {
      // Run the user defined extendPlugins function if defined.
      plugins = typeof extendPlugins === 'function' ? extendPlugins(plugins) : plugins

      // Extract the $axios plugin.
      const axiosIndex = plugins.findIndex(({ src }) => src === normalize(`${nuxt.options.buildDir}/axios.js`))
      const axiosPlugin = plugins[axiosIndex]
      plugins.splice(axiosIndex, 1)

      // Extract the $druxt plugin.
      const druxtIndex = plugins.findIndex(({ src }) => src === normalize(`${nuxt.options.buildDir}/druxt.js`))
      const druxtPlugin = plugins[druxtIndex]
      plugins.splice(druxtIndex, 1)

      // Re-add the plugins.
      plugins = [axiosPlugin, druxtPlugin, ...plugins]

      return plugins.filter((o) => o)
    }

    // Add Vuex plugin.
    addPluginTemplate({
      src: resolve(__dirname, '../templates/store.js'),
      fileName: 'store/druxt.js',
      options
    })

    // Enable Vuex Store.
    nuxt.options.store = true

    // Enable components auto-discovery by default.
    nuxt.options.components = nuxt.options.components ?? true

    // Get the version from the root directories package.json.
    const rootDir = __dirname.endsWith('/src/nuxt') ? '../..' : '..'
    const version = require(join(__dirname, `${rootDir}/package.json`)).version

    // Add CLI badge.
    nuxt.options.cli.badgeMessages.push(`${chalk.blue.bold('Druxt')} @ v${version}`)
    nuxt.options.cli.badgeMessages.push(`${chalk.bold('API:')} ${chalk.blue.underline(options.baseUrl + options.endpoint)}`)

    // Development mode features.
    if (nuxt.options.dev) {
      // @TODO - AddServerMiddleware isn't part of @nuxt/kit
      // Add the template stubber server middleware.
      // this.addServerMiddleware({
      //   path: '/_druxt/template',
      //   handler: 'druxt/dist/server-middleware/template.mjs'
      // })

      // // Add the Vue devtools plugin.
      // this.addPlugin({
      //   src: resolve(__dirname, '../dist/plugins/devtools.mjs'),
      //   fileName: 'druxt-devtools.js'
      // })
    }

    // Nuxt Storybook.
    // @TODO - @nuxt/kit and @nuxt/storybook aren't compatible.
    // nuxt.hook('storybook:config', async ({ stories }) => {
    //   // Druxt README story.
    //   addTemplate({
    //     src: resolve(__dirname, '../templates/stories/README.stories.mdx'),
    //     fileName: 'stories/druxt-README.stories.mdx',
    //   })
    //   stories.push(resolve(nuxt.options.buildDir, './stories/druxt-README.stories.mdx'))

    //   // Druxt custom module story.
    //   addTemplate({
    //     src: resolve(__dirname, '../templates/stories/druxt-module.stories.mdx'),
    //     fileName: 'stories/druxt-module.stories.mdx',
    //   })
    //   stories.push(resolve(nuxt.options.buildDir, './stories/druxt-module.stories.mdx'))

    //   // DruxtDebug component story.
    //   addTemplate({
    //     src: resolve(__dirname, '../templates/stories/druxt-debug.stories.js'),
    //     fileName: 'stories/druxt-debug.stories.js',
    //   })
    //   stories.push(resolve(nuxt.options.buildDir, './stories/druxt-debug.stories.js'))
    // })
  }
})

export default DruxtNuxtModule

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
