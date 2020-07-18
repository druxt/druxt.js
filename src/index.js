import consola from 'consola'
import { DruxtSchema } from 'druxt-schema'
import { resolve } from 'path'

export { Druxt } from './druxt.js'

export { DruxtStore } from './store'

export default function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }
  const options = this.options.druxt

  // @TODO - This is a temporary workaround for Druxt Schema.
  // Generate schemas.
  this.nuxt.hook('builder:prepared', async (nuxt, buildOptions) => {
    const druxtSchema = new DruxtSchema(options.baseUrl, options)
    const { schemas } = await druxtSchema.get()

    for (const name in schemas) {
      const schema = schemas[name]
      if (typeof schema === 'undefined') continue

      this.addTemplate({
        src: resolve('node_modules/druxt-schema/nuxt/schema.json'),
        fileName: `schemas/${name}.json`,
        options: { schema }
      })
    }

    consola.success('Druxt schema generated')
  })

  // Add Druxt modules.
  const modules = [
    'druxt-blocks',
    'druxt-breadcrumb',
    'druxt-entity',
    'druxt-menu',
    'druxt-router',
    'druxt-schema',
    'druxt-search',
    'druxt-views'
  ]
  for (const key in modules) {
    this.addModule(modules[key])
  }
}
