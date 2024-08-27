import { addLayout, defineNuxtModule, installModule } from '@nuxt/kit'
import { existsSync } from 'fs'
import { resolve } from 'path'
// import DruxtSiteStorybook from '../nuxtStorybook'

/**
 * Nuxt module function to install Druxt Site.
 *
 * - Adds the DruxtSite component.
 * - Adds the core modules for DruxtJS Site.
 * - Adds default configuration for @nuxtjs/proxy.
 * - Enables Vuex store.
 *
 * @param {ModuleOptions} moduleOptions - The Nuxt.js module options.
 */
const DruxtSiteNuxtModule = defineNuxtModule({
  meta: {
    name: 'druxt-site',
  },
  defaults: {
    baseUrl: '',
    endpoint: '/jsonapi'
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
      ...nuxt.options?.druxt,
      proxy: {
        api: false,
        files: true,
        ...nuxt.options?.druxt?.proxy,
      },
      site: {
        layout: true,
        ...nuxt.options?.druxt?.site,
        ...moduleOptions,
      },
    }
    nuxt.options.druxt = options

    // Register components directories.
    nuxt.hook('components:dirs', dirs => {
      dirs.push({ path: resolve(__dirname, '../dist/components') })
    })

    // Add Druxt modules.
    const druxtModules = [
      'druxt/nuxt',
      'druxt-blocks/nuxt',
      'druxt-breadcrumb/nuxt',
      'druxt-entity/nuxt',
      'druxt-menu/nuxt',
      'druxt-router/nuxt',
      'druxt-schema/nuxt',
      'druxt-views/nuxt'
    ]
    for (const module of druxtModules) {
      await installModule(module, {}, nuxt)
    }

    // Add default layout.
    if (!(await existsSync(resolve(nuxt.options.srcDir, nuxt.options.dir.layouts))) && options.site.layout) {
      addLayout(resolve(__dirname, '../dist/layouts/default.vue'), 'default')
    }

    // Nuxt Storybook.
    // @TODO - @nuxt/kit and @nuxt/storybook aren't compatible.
    // this.nuxt.hook('storybook:config', async ({ stories }) => {
    //   await DruxtSiteStorybook.call(this, { options, stories })
    // })
  }
})

export default DruxtSiteNuxtModule

/**
 * Module options object.
 *
 * @typedef {object} ModuleOptions
 * @see {@link ./typedefs/moduleOptions|ModuleOptions}
 */
