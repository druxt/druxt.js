import { addPluginTemplate, defineNuxtModule, installModule } from '@nuxt/kit'
import { join, resolve } from 'path'
// import DruxtMenuStorybook from './storybook'

/**
 * The Nuxt.js module function.
 *
 * - Adds Nuxt plugin.
 * - Adds Vuex store.
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
 *     'druxt-menu'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 *
 * @param {object} moduleOptions - Module options object.
 */
const DruxtMenuNuxtModule = defineNuxtModule({
  meta: {
    name: 'druxt-menu',
  },
  defaults: {
    baseUrl: '',
    endpoint: '/jsonapi'
  },

  async setup(moduleOptions, nuxt) {
    // Set default options.
    const options = {
      baseUrl: moduleOptions.baseUrl,
      ...nuxt.options?.druxt || {},
      menu: {
        jsonApiMenuItems: true,
        ...nuxt.options?.druxt?.menu,
        ...moduleOptions,
      }
    }

    // Add dependant modules.
    await installModule('druxt/nuxt', options)

    // Register components directories.
    nuxt.hook('components:dirs', dirs => {
      dirs.push({ path: join(__dirname, '../dist/components') })
      dirs.push({ path: join(__dirname, '../dist/components/blocks') })
    })

    // Add plugin.
    addPluginTemplate({
      src: resolve(__dirname, '../templates/plugin.js'),
      fileName: 'druxt-menu.js',
      options
    })

    // Add Vuex plugin.
    addPluginTemplate({
      src: resolve(__dirname, '../templates/store.js'),
      fileName: 'store/druxt-menu.js',
      options
    })

    // Nuxt Storybook.
    // @TODO - @nuxt/kit and @nuxt/storybook aren't compatible.
    // this.nuxt.hook('storybook:config', async ({ stories }) => {
    //   await DruxtMenuStorybook.call(this, { stories })
    // })
  }
})

export default DruxtMenuNuxtModule
