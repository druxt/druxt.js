import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { DruxtClient, getLanguages } from 'druxt'

// @nuxt/components ignores a false isAsync on the directory.
const extendComponent = (component) => ({ ...component, isAsync: false })

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
 * A Nuxt module configures the Nuxt application, and is unrelated to a Drupal module.
 *
 * @see https://druxtjs.org/modules/router
 * @see https://druxtjs.org/explanation/nuxt-for-drupal-developers
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   buildModules: ['druxt-router/nuxt'],
 *   druxt: {
 *     baseUrl: 'https://api.umami.demo.druxtjs.org'
 *   }
 * }
 *
 * @param {object} moduleOptions - The Nuxt.js module options.
 * @property {object} options.druxt - Druxt root level options.
 * @property {string} options.druxt.baseUrl - Base URL of the Drupal JSON:API backend.
 * @property {string} [options.druxt.endpoint=/jsonapi] - The Drupal JSON:API endpoint path.
 * @property {object} [options.druxt.axios] - Axios settings for the DruxtRouter client.
 * @property {boolean} [options.druxt.proxy.api] - Proxy JSON:API requests on the client side.
 * @property {string} [options.druxt.router.render] - Name of the component used to render the
 *   resolved route.
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

  // Add dependant modules.
  await this.addModule(['druxt', options])

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, '../dist/components'), extendComponent })
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

    // Each language's URL prefix, from the options or read from Drupal.
    let languages = Object.entries(options.prefixes || {}).map(([langcode, prefix]) => ({ langcode, prefix }))
    if (!options.prefixes) {
      const druxt = new DruxtClient(options.baseUrl, {
        ...options,
        // Disable API Proxy, as Proxies aren't available at build.
        proxy: { ...options.proxy || {}, api: false },
      })
      languages = await getLanguages(druxt, { build: this.nuxt, endpoint: druxt.options.endpoint })
    }

    // Extend routes.
    this.extendRoutes((routes) => {
      // A route for each language under its prefix. A language without one, usually the default, is served by the
      // wildcard route. The prefix is a whole path segment, so `/es-food` is not Spanish.
      languages.filter(({ prefix }) => prefix).forEach(({ langcode, prefix }) => {
        routes.push({
          name: `druxt-router__${langcode}`,
          path: `/${prefix}(/.*)?`,
          component: resolve(this.options.buildDir, 'components/druxt-router.js'),
          chunkName: 'druxt-router',
          meta: { langcode }
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
