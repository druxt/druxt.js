import { addPluginTemplate, defineNuxtModule, installModule } from '@nuxt/kit'
import { join, resolve } from 'path'
import DruxtViewsStorybook from './storybook'

/**
 * The Nuxt.js module function.
 *
 * - Adds the Vue.js components to the Nuxt application.
 *
 * The module function should not be used directly, but rather installed via your Nuxt configuration file.
 *
 * Options are set on the root level `druxt` Nuxt config object.
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   modules: [
 *     'druxt-views'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 *
 * @param {object} moduleOptions - Nuxt module options object.
 */
const DruxtViewsNuxtModule = defineNuxtModule({
  meta: {
    name: 'druxt-views',
  },
  defaults: {
    baseUrl: '',
    endpoint: '/jsonapi'
  },

  async setup(moduleOptions, nuxt) {
    // Set default options.
    const options = {
      baseUrl: moduleOptions.baseUrl,
      ...nuxt.options?.druxt || {},
      views: {
        query: {},
        ...nuxt.options?.druxt?.views,
        ...moduleOptions,
      }
    }

    // Register components directories.
    nuxt.hook('components:dirs', dirs => {
      dirs.push({ path: join(__dirname, '../dist/components') })
      dirs.push({ path: join(__dirname, '../dist/components/blocks') })
    })

    // Add dependant modules.
    await installModule('druxt/nuxt', options, nuxt)
    const modules = ['druxt-entity/nuxt', 'druxt-schema/nuxt']
    for (const module of modules) {
      await installModule(module, { baseUrl: options.baseUrl }, nuxt)
    }

    // Add Vuex plugin.
    addPluginTemplate({
      src: resolve(__dirname, '../templates/store.js'),
      fileName: 'store/druxt-views.js',
      options: options.druxt
    })

    // Enable Vuex Store.
    nuxt.options.store = true

    // Nuxt Storybook.
    nuxt.hook('storybook:config', async ({ stories }) => {
      await DruxtViewsStorybook.call(nuxt, { stories })
    })
  }
})

export default DruxtViewsNuxtModule
