import { addPluginTemplate, addTemplate, defineNuxtModule, extendPages, installModule } from '@nuxt/kit'
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
const DruxtRouterNuxtModule = defineNuxtModule({
  meta: {
    name: 'druxt-router',
  },
  defaults: {
    baseUrl: '',
    endpoint: '/jsonapi',
  },

  async setup(moduleOptions, nuxt) {
    // Set default options.
    const options = {
      baseUrl: moduleOptions.baseUrl,
      ...nuxt.options?.druxt || {},
      router: {
        pages: (await existsSync(resolve(nuxt.options.srcDir, nuxt.options.dir.pages))),
        wildcard: true,
        ...nuxt.options?.druxt?.router,
        ...moduleOptions,
      }
    }

    // Add dependant modules.
    await installModule('druxt/nuxt', options, nuxt)

    // Register components directories.
    nuxt.hook('components:dirs', dirs => {
      dirs.push({ path: join(__dirname, '../dist/components') })
    })

    // Add Druxt router custom wildcard route.
    if (options.router.wildcard) {
      // Ignore page routes.
      if (!options.router.pages) {
        nuxt.hook('build:before', () =>
          nuxt.options.build.createRoutes = () => []
        )
      }

      // Add route template.
      addTemplate({
        src: resolve(__dirname, '../templates/component.js'),
        fileName: 'components/druxt-router.js',
        options,
        write: true
      })

      // Fetch languages.
      let languages = []
      const druxt = new DruxtClient(options.baseUrl, {
        ...options,
        // Disable API Proxy, as Proxies aren't available at build.
        proxy: { ...options.proxy || {}, api: false },
      })
      const languageResourceType = 'configurable_language--configurable_language'
      if (((await druxt.getIndex(languageResourceType)) || {}).href) {
        const query = new DrupalJsonApiParams().addFields(languageResourceType, ['drupal_internal__id'])
        languages = (await druxt.getCollectionAll(languageResourceType, query) || [])
          .map((o) => o.data)
          .flat()
          .filter((o) => !['und', 'zxx'].includes(o?.attributes?.drupal_internal__id))
      }

      // Extend pages.
      extendPages((routes) => {
        // Add route per language.
        languages.filter((o) => o).forEach((o) => {
          routes.push({
            name: `druxt-router__${o.attributes.drupal_internal__id}`,
            path: `/${o.attributes.drupal_internal__id}$/*`,
            component: resolve(nuxt.options.buildDir, 'components/druxt-router.js'),
            chunkName: 'druxt-router',
            meta: { langcode: o.attributes.drupal_internal__id }
          })
        })

        // Add wildcard route.
        routes.push({
          name: 'druxt-router',
          path: '/*',
          component: resolve(nuxt.options.buildDir, 'components/druxt-router.js'),
          chunkName: 'druxt-router'
        })
      })
    }

    // Add plugin.
    addPluginTemplate({
      src: resolve(__dirname, '../templates/plugin.js'),
      fileName: 'druxt-router.js',
      options
    })

    // Add store.
    addPluginTemplate({
      src: resolve(__dirname, '../templates/store.js'),
      fileName: 'store/druxt-router.js',
      options: {
        ...options
      }
    })

    // Enable Vuex Store.
    nuxt.options.store = true

    // Nuxt Storybook.
    nuxt.hook('storybook:config', async ({ stories }) => {
      addTemplate({
        src: resolve(__dirname, '../templates/druxt-router.stories.js'),
        fileName: 'stories/druxt-router.stories.js',
        options: {}
      })
      stories.push(resolve(nuxt.options.buildDir, './stories/druxt-router.stories.js'))
    })
  }
})

export default DruxtRouterNuxtModule
