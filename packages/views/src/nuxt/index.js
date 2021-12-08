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
const DruxtViewsNuxtModule = function (moduleOptions = {}) {
  // Set default options.
  const options = {
    baseUrl: moduleOptions.baseUrl,
    ...(this.options || {}).druxt || {},
    views: {
      query: {},
      ...((this.options || {}).druxt || {}).views,
      ...moduleOptions,
    }
  }

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
    dirs.push({ path: join(__dirname, 'components/blocks') })
  })

  // Add dependant modules.
  this.addModule(['druxt', options])
  const modules = ['druxt-entity', 'druxt-schema']
  for (const module of modules) {
    this.addModule([module, { baseUrl: options.baseUrl }])
  }

  // Add Vuex plugin.
  this.addPlugin({
    src: resolve(__dirname, '../templates/store.js'),
    fileName: 'store/druxt-views.js',
    options: options.druxt
  })

  // Enable Vuex Store.
  options.store = true

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    stories.push('druxt-views/dist/components/*.stories.mjs')
    await DruxtViewsStorybook.call(this, { stories })
  })
}

export { DruxtViewsNuxtModule }
