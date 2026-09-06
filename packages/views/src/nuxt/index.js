import { join, resolve } from 'path'
import DruxtViewsStorybook from './storybook'

/**
 * The Nuxt.js module function.
 *
 * - Adds the Vue.js components to the Nuxt application.
 *
 * The module function should not be used directly, but rather installed via your Nuxt configuration file.
 *
 * A Nuxt module configures the Nuxt application, and is unrelated to a Drupal module.
 *
 * Options are set on the root level `druxt` Nuxt config object.
 *
 * @see https://druxtjs.org/modules/views
 * @see {@link https://druxtjs.org/explanation/nuxt-for-drupal-developers|Nuxt for Drupal developers}
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   modules: [
 *     'druxt-views'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://api.umami.demo.druxtjs.org'
 *   }
 * }
 *
 * @param {object} moduleOptions - Nuxt module options object.
 */
const DruxtViewsNuxtModule = async function (moduleOptions = {}) {
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
  await this.addModule(['druxt', options])
  const modules = ['druxt-entity', 'druxt-schema']
  for (const module of modules) {
    await this.addModule([module, { baseUrl: options.baseUrl }])
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
    await DruxtViewsStorybook.call(this, { stories })
  })
}

export { DruxtViewsNuxtModule }
