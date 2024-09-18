import { defineNuxtModule, installModule } from '@nuxt/kit'
import { join } from 'path'
import DruxtBlocksStorybook from './storybook'

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
const DruxtBlocksNuxtModule = defineNuxtModule({
  meta: {
    name: 'druxt-blocks'
  },
  defaults: {
    baseUrl: '',
    endpoint: '/jsonapi',
  },

  async setup(moduleOptions, nuxt) {
    // Prevent issue "FATAL: Cannot determine nuxt version! Is current
    // instance passed?".
    nuxt._version = nuxt._version || '2.'
    // This is required to prevent "FATAL: nuxt.options._layers is not iterable"
    // error when using `installModule()`.
    nuxt.options._layers = nuxt.options._layers || []

    // Set default options.
    const options = {
      baseUrl: moduleOptions.baseUrl,
      ...nuxt.options?.druxt || {},
      blocks: {
        query: {},
        ...nuxt.options?.druxt?.blocks,
        ...moduleOptions,
      }
    }

    // Add Druxt module.
    await installModule('druxt/nuxt', options, nuxt)

    // Register components directories.
    nuxt.hook('components:dirs', dirs => {
      dirs.push({ path: join(__dirname, '../dist/components') })
      dirs.push({ path: join(__dirname, '../dist/components/blocks') })
    })

    // Nuxt Storybook.
    nuxt.hook('storybook:config', async ({ stories }) => {
      await DruxtBlocksStorybook.call(nuxt, { stories })
    })
  }
})

export default DruxtBlocksNuxtModule

