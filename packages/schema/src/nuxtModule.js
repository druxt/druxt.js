import consola from 'consola'
import { resolve } from 'path'

import { DruxtSchema } from './schema'
import { schemaHandler } from './server-middleware/schema'
import { getHeldSchema } from './utils/hold'

/**
 * The Nuxt.js module function.
 *
 * - Adds the Schema plugin to Nuxt.js.
 * - Adds the Schema Vuex store to Nuxt.js.
 * - Builds the Schema data via the `builder:prepared` hook.
 * - With `druxt.schema.refresh`, regenerates schemas on the server after each cache clear, or on each request under `nuxt dev`.
 *
 * The module function should not be used directly, but rather installed via your Nuxt.js configuration file.
 *
 * A Nuxt module configures the Nuxt application, and is unrelated to a Drupal module.
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
 * @see {@link https://druxtjs.org/modules/schema|Schema module guide}
 * @see {@link https://druxtjs.org/explanation/nuxt-for-drupal-developers|Nuxt for Drupal developers}
 *
 * @param {object} moduleOptions - Nuxt.js module options object.
 */
const DruxtSchemaNuxtModule = function (moduleOptions = {}) {
  // Set default options.
  const options = {
    baseUrl: moduleOptions.baseUrl,
    ...(this.options || {}).druxt || {},
    schema: {
      ...((this.options || {}).druxt || {}).schema || {},
      ...moduleOptions,
    }
  }

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../templates/plugin.js'),
    fileName: 'druxt-schema.js',
    options
  })

  // Enable Vuex Store.
  this.options.store = true

  // Add Vuex plugin.
  this.addPlugin({
    src: resolve(__dirname, '../templates/store.js'),
    fileName: 'store/druxt-schema.js',
    options
  })

  if (options.schema.refresh) {
    // Schemas are generated with the same access the build uses.
    const createDruxtSchema = () => new DruxtSchema(options.baseUrl, {
      ...options,
      proxy: { ...options.proxy || {}, api: false },
    })
    // Under `nuxt dev` there is no cache or clear, so each request regenerates.
    const getSchema = this.options.dev
      ? (id) => createDruxtSchema().getSchemaById(id)
      : (id) => getHeldSchema(createDruxtSchema, id)
    this.addServerMiddleware({ path: '/_druxt/schema', handler: schemaHandler(getSchema) })
    // Nuxt runs the server bundle in a new context under `nuxt dev`, sharing process but not globalThis.
    process[Symbol.for('druxt.schemaRefresh')] = getSchema
  }

  // Generate schemas.
  this.nuxt.hook('builder:prepared', async () => {
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

      this.addTemplate({
        src: resolve(__dirname, '../templates/schema.json'),
        fileName: `schemas/${name}.json`,
        options: { schema }
      })
    }

    consola.success('Druxt schema files generated')
  })
}

DruxtSchemaNuxtModule.meta = require('../package.json')

export { DruxtSchemaNuxtModule }
