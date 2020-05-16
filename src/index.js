import { resolve } from 'path'

import { DruxtSchema } from './druxtSchema'
export { DruxtSchema }

export { DruxtSchemaStore } from './store'

export default async function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }
  const options = this.options.druxt

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-schema.js',
    options
  })

  // Add Vuex plugin.
  // @TODO - Ensure Vuex store is available.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/store.js'),
    fileName: 'store/druxt-schema.js',
    options
  })

  // Generate schemas.
  const druxtSchema = new DruxtSchema(options.baseUrl, options)
  const { schemas } = await druxtSchema.get()

  for (const name in schemas) {
    const schema = schemas[name]
    if (typeof schema === 'undefined') continue

    this.addTemplate({
      src: resolve(__dirname, '../nuxt/schema.json'),
      fileName: `schemas/${name}.json`,
      options: { schema }
    })
  }
}
