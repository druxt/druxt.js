import { addImports, addPluginTemplate, addTemplate, defineNuxtModule, isNuxt2, useLogger } from '@nuxt/kit'
import { DruxtSchema } from 'druxt-schema'
import { resolve } from 'path'

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

    // Add $druxtSchema plugin.
    addPluginTemplate({
      src: resolve(__dirname, '../templates/plugin.js'),
      fileName: 'druxtSchema.js',
      options: {
        ...options,
        isNuxt2
      }
    })

    // Install Vuex store for Nuxt 2.
    if (isNuxt2()) {
      // Enable Vuex Store.
      nuxt.options.store = true

      // Add Vuex plugin.
      addPluginTemplate({
        src: resolve(__dirname, '../templates/stores/vuex.js'),
        fileName: 'store/druxt-schema.js',
        options
      })
    }

    // Or Pinia store for Nuxt 3
    else {
      addTemplate({
        src: resolve(__dirname, '../templates/stores/pinia.js'),
        fileName: 'stores/druxt-schema.js',
        options
      })
      addImports({
        from: '#build/stores/druxt-schema',
        name: 'useDruxtSchemaStore'
      })
    }

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
          write: true
        })
      }

      logger.success('Druxt schema files generated')
    })
  }
})

export default DruxtSchemaNuxtModule
