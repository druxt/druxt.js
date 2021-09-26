import { join, resolve } from 'path'
import DruxtMenuStorybook from './nuxtStorybook'

/**
 * The Nuxt.js module function.
 *
 * - Adds Nuxt plugin.
 * - Adds Vuex store.
 * - Adds Nuxt Storybook integration.
 *
 * The module function should not be used directly, but rather installed via your Nuxt configuration file.
 *
 * Options are set on the root level `druxt` Nuxt config object.
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   modules: [
 *     'druxt-menu'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 *
 * @param {object} moduleOptions - Module options object.
 */
const DruxtMenuNuxtModule = function (moduleOptions) {
  // Set default options.
  const options = {
    baseUrl: moduleOptions.baseUrl,
    ...(this.options || {}).druxt || {},
    menu: {
      ...((this.options || {}).druxt || {}).menu,
      ...moduleOptions,
    }
  }

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
    dirs.push({ path: join(__dirname, 'components/blocks') })
  })

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-menu.js',
    options
  })

  // Enable Vuex Store.
  this.options.store = true

  // Add Vuex plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/store.js'),
    fileName: 'store/druxt-menu.js',
    options
  })

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    await DruxtMenuStorybook.call(this, { stories })
  })
}

export { DruxtMenuNuxtModule }
