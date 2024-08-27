import { defineNuxtModule, installModule } from '@nuxt/kit'
import { join } from 'path'

/**
 * The Nuxt.js module function.
 *
 * - Adds the Vue.js components to the Nuxt.js frontend.
 *
 * The module function should not be used directly, but rather installed via yout Nuxt.js configuration file.
 *
 * Options are set on the root level `druxt` Nuxt.js config object.
 *
* @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt-breadcrumb'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://example.com'
 *   }
 * }
 *
 * @param {object} moduleOptions - Nuxt.js module options object.
 */
const DruxtBreadcrumbModule = defineNuxtModule({
  meta: {
    name: 'druxt-breadcrumb',
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
      breadcrumb: {
        ...nuxt.options?.druxt?.breadcrumb,
        ...moduleOptions,
      }
    }

    // Add dependent module.
    await installModule('druxt/nuxt', options, nuxt)
    await installModule('druxt-router/nuxt', options, nuxt)

    // Register components directories.
    nuxt.hook('components:dirs', dirs => {
      dirs.push({ path: join(__dirname, '../dist/components') })
      dirs.push({ path: join(__dirname, '../dist/components/blocks') })
    })

    // Nuxt Storybook.
    // @TODO - @nuxt/kit and @nuxt/storybook aren't compatible.
    // nuxt.hook('storybook:config', ({ stories }) => {
    //   addTemplate({
    //     src: resolve(__dirname, '../templates/druxt-breadcrumb.stories.js'),
    //     fileName: 'stories/druxt-breadcrumb.stories.js',
    //   })
    //   stories.push(resolve(nuxt.options.buildDir, './stories/druxt-breadcrumb.stories.js'))
    // })
  }
})

export default DruxtBreadcrumbModule
