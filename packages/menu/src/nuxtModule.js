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
 * A Nuxt module configures the Nuxt application, and is unrelated to a Drupal module.
 *
 * Options are set on the root level `druxt` Nuxt config object.
 *
 * @see https://druxtjs.org/modules/menu
 * @see {@link https://druxtjs.org/explanation/nuxt-for-drupal-developers|Nuxt for Drupal developers}
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   modules: [
 *     'druxt-menu'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://api.umami.demo.druxtjs.org'
 *   }
 * }
 *
 * @param {object} moduleOptions - Module options object.
 */
const DruxtMenuNuxtModule = async function (moduleOptions = {}) {
  // Set default options.
  const options = {
    baseUrl: moduleOptions.baseUrl,
    ...(this.options || {}).druxt || {},
    menu: {
      jsonApiMenuItems: true,
      ...((this.options || {}).druxt || {}).menu,
      ...moduleOptions,
    }
  }

  // Add dependant modules.
  await this.addModule(['druxt', options])

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
    dirs.push({ path: join(__dirname, 'components/blocks') })
  })

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../templates/plugin.js'),
    fileName: 'druxt-menu.js',
    options
  })

  // Add Vuex plugin.
  this.addPlugin({
    src: resolve(__dirname, '../templates/store.js'),
    fileName: 'store/druxt-menu.js',
    options
  })

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    await DruxtMenuStorybook.call(this, { stories })
  })
}

DruxtMenuNuxtModule.meta = require('../package.json')

export { DruxtMenuNuxtModule }
