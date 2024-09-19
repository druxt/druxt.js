import { addPluginTemplate, addTemplate, defineNuxtModule, useLogger } from '@nuxt/kit'
import { resolve } from 'path'

import { DruxtSchema } from '../schema'

/**
 * The Nuxt.js module function.
 *
 * - Adds the Schema plugin to Nuxt.js.
 * - Adds the Schema Vuex store to Nuxt.js.
 * - Builds the Schema data via the `builder:prepared` hook.
 *
 * The module function should not be used directly, but rather installed via yout Nuxt.js configuration file.
 *
 * Options are set on the root level `druxt` Nuxt.js config object.
 *
 * @example @lang js
 * // `nuxt.config.js`
 * module.exports = {
 *   modules: [
 *     'druxt-schema'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://example.com'
 *   }
 * }
 *
 * @todo Document options.
 *
 * @param {object} moduleOptions - Nuxt.js module options object.
 */
const DruxtSchemaNuxtModule = defineNuxtModule({
  meta: {
    name: 'druxt-schema',
  },
  defaults: {
    baseUrl: '',
    endpoint: '/jsonapi'
  },

  async setup(moduleOptions, nuxt) {
    const logger = useLogger('druxt-schema')
    // Set default options.
    const options = {
      baseUrl: moduleOptions.baseUrl,
      ...nuxt.options?.druxt || {},
      schema: {
        ...nuxt.options?.druxt?.schema || {},
        ...moduleOptions,
      }
    }

    // Add plugin.
    addPluginTemplate({
      src: resolve(__dirname, '../templates/plugin.js'),
      fileName: 'druxt-schema.js',
      options
    })

    // Enable Vuex Store.
    nuxt.options.store = true

    // Add Vuex plugin.
    addPluginTemplate({
      src: resolve(__dirname, '../templates/store.js'),
      fileName: 'store/druxt-schema.js',
      options
    })

    // Generate schema files.
    nuxt.hook('modules:done', async () => {
      const druxtSchema = new DruxtSchema(options.baseUrl, {
        ...options,
        // Disable API Proxy, as Proxies aren't available at build.
        proxy: { ...options.proxy || {}, api: false },
      })
      const { schemas } = await druxtSchema.get()

      // Throw error if no schema files generated.
      if (!Object.entries(schemas).length) {
        throw new Error('No Druxt Schema files generated.\n Have you created any content types yet?')
      }

      for (const name in schemas) {
        const schema = schemas[name]
        if (typeof schema === 'undefined') continue

        addTemplate({
          src: resolve(__dirname, '../templates/schema.json'),
          fileName: `schemas/${name}.json`,
          options: { schema },
          // @TODO - Does it need to be written to the file system?
          write: true
        })
      }

      logger.success('Druxt schema files generated')
    })
  }
})

export default DruxtSchemaNuxtModule
