import { join, resolve } from 'path'
import DruxtEntityStorybook from './nuxtStorybook'

/**
 * The Nuxt.js module function.
 *
 * - Adds dependant modules.
 * - Adds Nuxt plugin.
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
 *     'druxt-entity'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 *
 * @todo Add module level options.
 * @todo Document options.
 *
 * @property {object} options.druxt - DruxtJS root level options.
 * @property {string} options.druxt.baseUrl - Base URL of Drupal JSON:API backend.
 */
const DruxtEntityNuxtModule = function () {
  // Use root level Druxt options.
  if (!(this.options || {}).druxt) {
    throw new TypeError('Druxt settings missing.')
  }

  const options = this.options.druxt
  options.entity = {
    ...options.entity,
    components: {
      fields: true,
      ...(options.entity || {}).components
    }
  }

  // Add dependant modules.
  const modules = ['druxt', 'druxt-schema'].filter((module) => !this.options.modules.includes(module))
  for (const module of modules) {
    this.addModule(module)
  }

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({
      path: join(__dirname, 'components'),
      ignore: ['fields']
    })
    if (options.entity.components.fields) {
      dirs.push({ path: join(__dirname, 'components/fields') })
    }
  })

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-entity.js',
    options
  })

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    await DruxtEntityStorybook.call(this, { stories })
  })
}

DruxtEntityNuxtModule.meta = require('../package.json')

export { DruxtEntityNuxtModule }
