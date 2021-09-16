import { resolve } from 'path'
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
 *     baseUrl: 'https://demi-api.druxtjs.org'
 *   }
 * }
 *
 * @param {object} moduleOptions - Nuxt.js module options object.
 */
const DruxtBlocksNuxtModule = function () {
  const { options } = this

  // Use root level Druxt options.
  if (typeof options === 'undefined' || !options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }

  // Add dependant modules.
  const modules = ['druxt'].filter((module) => !(options.modules || []).includes(module))
  for (const module of modules) {
    this.addModule(module)
  }

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-blocks.js',
    options: options.druxt,
  })

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    await DruxtBlocksStorybook.call(this, { stories })
  })
}

export { DruxtBlocksNuxtModule }
