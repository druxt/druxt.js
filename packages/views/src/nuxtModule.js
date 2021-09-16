import { join, resolve } from 'path'
import DruxtViewsStorybook from './nuxtStorybook'

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
const DruxtViewsNuxtModule = function () {
  const { options } = this

  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
    dirs.push({ path: join(__dirname, 'components/blocks') })
  })

  // Add dependant modules.
  const modules = ['druxt', 'druxt-entity', 'druxt-schema'].filter((module) => !options.modules.includes(module))
  for (const module of modules) {
    this.addModule(module)
  }

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-views.js',
    options: options.druxt
  })

  // Add Vuex plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/store.js'),
    fileName: 'store/druxt-views.js',
    options: options.druxt
  })

  // Enable Vuex Store.
  options.store = true

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    await DruxtViewsStorybook.call(this, { stories })
  })
}

export { DruxtViewsNuxtModule }
