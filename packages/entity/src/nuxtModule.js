import { join } from 'path'
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
 * @todo Document options.
 *
 * @property {object} options.druxt - DruxtJS root level options.
 * @property {string} options.druxt.baseUrl - Base URL of Drupal JSON:API backend.
 */
const DruxtEntityNuxtModule = function (moduleOptions = {}) {
  // Set default options.
  const options = {
    baseUrl: moduleOptions.baseUrl,
    ...(this.options || {}).druxt || {},
    entity: {
      query: {},
      ...((this.options || {}).druxt || {}).entity,
      ...moduleOptions,
      components: {
        fields: true,
        ...(((this.options || {}).druxt || {}).entity || {}).components,
        ...moduleOptions.components
      }
    }
  }

  // Add dependant modules.
  this.addModule(['druxt', options])
  this.addModule(['druxt-schema', { baseUrl: options.baseUrl }])

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

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', async ({ stories }) => {
    stories.push('druxt-entity/dist/components/*.stories.mjs')
    await DruxtEntityStorybook.call(this, { stories })
  })
}

DruxtEntityNuxtModule.meta = require('../package.json')

export { DruxtEntityNuxtModule }
