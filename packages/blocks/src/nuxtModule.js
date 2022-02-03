import { join } from 'path'
import DruxtBlocksStorybook from './nuxtStorybook'

/**
 * The Nuxt.js module function.
 *
 * - Adds the Vue.js components to the Nuxt.js frontend.
 *
 * The module function should not be used directly, but rather installed via yout Nuxt.js configuration file.
 *
 * Options are set on the root level `druxt` Nuxt.js config object.
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   modules: [
 *     'druxt-blocks'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 *
 * @param {object} moduleOptions - Nuxt.js module options object.
 */
const DruxtBlocksNuxtModule = function (moduleOptions = {}) {
  // Set default options.
  const options = {
    baseUrl: moduleOptions.baseUrl,
    ...(this.options || {}).druxt || {},
    blocks: {
      query: {},
      ...((this.options || {}).druxt || {}).site,
      ...moduleOptions,
    }
  }

  // Add Druxt module.
  this.addModule(['druxt', options])

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
    dirs.push({ path: join(__dirname, 'components/blocks') })
  })

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    await DruxtBlocksStorybook.call(this, { stories })
  })
}

DruxtBlocksNuxtModule.meta = require('../package.json')

export { DruxtBlocksNuxtModule }
