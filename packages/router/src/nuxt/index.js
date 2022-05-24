import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'

/**
 * The Nuxt.js module function.
 *
 * - Extends the Vue router, adding the Druxt wildcard route.
 * - Adds the Druxt router plugin.
 * - Adds the Druxt router Vuex store.
 *
 * The module function should not be used directly, but rather installed via your Nuxt configuration file.
 *
 * Options are set on the root level `druxt` Nuxt config object.
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   buildModules: ['druxt-router/nuxt'],
 *   druxt: {
 *     baseUrl: 'https://demi-api.druxtjs.org'
 *   }
 * }
 *
 * @property {object} options.druxt - Druxt root level options.
 * @property {string} options.druxt.baseUrl - Base URL of Drupal JSON:API backend.
 * @property {string} options.druxt.router.component - File to custom Router component.
 */
const DruxtRouterNuxtModule = async function (moduleOptions = {}) {
  // Set default options.
  const options = {
    baseUrl: moduleOptions.baseUrl,
    ...(this.options || {}).druxt || {},
    router: {
      pages: (await existsSync(resolve(this.options.srcDir, this.options.dir.pages))),
      wildcard: true,
      ...((this.options || {}).druxt || {}).router,
      ...moduleOptions,
    }
  }

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, '../dist/components') })
  })

  // Add Druxt router custom wildcard route.
  if (options.router.wildcard) {
    // Ignore page routes.
    if (!options.router.pages) {
      this.nuxt.hook('build:before', () =>
        this.nuxt.options.build.createRoutes = () => []
      )
    }

    // Add route template.
    this.addTemplate({
      src: resolve(__dirname, '../templates/component.js'),
      fileName: 'components/druxt-router.js',
      options
    })

    // Fetch languages.
    let languages = []
    const druxt = new DruxtClient(options.baseUrl, {
      ...options,
      // Disable API Proxy, as Proxies aren't available at build.
      proxy: { ...options.proxy || {}, api: false },
    })
    const languageResourceType = 'configurable_language--configurable_language'
    if (await druxt.getIndex(languageResourceType)) {
      const query = new DrupalJsonApiParams().addFields(languageResourceType, ['drupal_internal__id'])
      languages = (await druxt.getCollectionAll(languageResourceType, query) || [])
        .map((o) => o.data)
        .flat()
        .filter((o) => !['und', 'zxx'].includes(((o || {}).attributes || {}).drupal_internal__id))
    }

    // Extend routes.
    this.extendRoutes((routes) => {
      // Add route per language.
      languages.forEach((o) => {
        routes.push({
          name: `druxt-router__${o.attributes.drupal_internal__id}`,
          path: `/${o.attributes.drupal_internal__id}*`,
          component: resolve(this.options.buildDir, 'components/druxt-router.js'),
          chunkName: 'druxt-router',
          meta: { langcode: o.attributes.drupal_internal__id }
        })
      })

      // Add wildcard route.
      routes.push({
        name: 'druxt-router',
        path: '*',
        component: resolve(this.options.buildDir, 'components/druxt-router.js'),
        chunkName: 'druxt-router'
      })
    })
  }

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../templates/plugin.js'),
    fileName: 'druxt-router.js',
    options
  })

  // Enable Vuex Store.
  this.options.store = true

  // Add Vuex plugin.
  this.addPlugin({
    src: resolve(__dirname, '../templates/store.js'),
    fileName: 'store/druxt-router.js',
    options
  })

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    this.addTemplate({
      src: resolve(__dirname, '../templates/druxt-router.stories.js'),
      fileName: 'stories/druxt-router.stories.js',
      options: {}
    })
    stories.push(resolve(this.options.buildDir, './stories/druxt-router.stories.js'))
  })
}

DruxtRouterNuxtModule.meta = require('../package.json')

export default DruxtRouterNuxtModule
