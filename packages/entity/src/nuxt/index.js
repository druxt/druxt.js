import { defineNuxtModule, installModule } from '@nuxt/kit'
import { join } from 'path'
// import DruxtEntityStorybook from '../nuxtStorybook'

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
const DruxtEntityNuxtModule = defineNuxtModule({
  meta: {
    name: 'druxt-entity',
  },
  defaults: {
    baseUrl: '',
    endpoint: '/jsonapi'
  },

  async setup(moduleOptions, nuxt) {
    // Set default options.
    const options = {
      baseUrl: moduleOptions.baseUrl,
      ...nuxt.options?.druxt,
      entity: {
        query: {},
        ...nuxt.options?.druxt?.entity,
        ...moduleOptions,
        components: {
          fields: false,
          ...nuxt.options?.druxt?.entity?.components,
          ...moduleOptions?.components
        }
      }
    }

    // Add dependant modules.
    await installModule('druxt/nuxt', options, nuxt)
    await installModule('druxt-schema/nuxt', { baseUrl: options.baseUrl }, nuxt)

    // Register components directories.
    nuxt.hook('components:dirs', dirs => {
      dirs.push({
        path: join(__dirname, '../dist/components'),
        ignore: ['fields']
      })
      if (options.entity.components.fields) {
        dirs.push({ path: join(__dirname, '../dist/components/fields') })
      }
    })

    // Nuxt Storybook.
    // @TODO - @nuxt/kit and @nuxt/storybook aren't compatible.
    // this.nuxt.hook('storybook:config', async ({ stories }) => {
    //   await DruxtEntityStorybook.call(this, { stories })
    // })
  }
})

export default DruxtEntityNuxtModule
