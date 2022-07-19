import { join, resolve } from 'path'

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
const DruxtBreadcrumbModule = async function (moduleOptions = {}) {
  // Set default options.
  const options = {
    baseUrl: moduleOptions.baseUrl,
    ...(this.options || {}).druxt || {},
    breadcrumb: {
      ...((this.options || {}).druxt || {}).breadcrumb,
      ...moduleOptions,
    }
  }

  // Add dependent module.
  await this.addModule(['druxt', options])
  await this.addModule(['druxt-router/nuxt', options])

  // Register components directories.
  this.nuxt.hook('components:dirs', dirs => {
    dirs.push({ path: join(__dirname, 'components') })
    dirs.push({ path: join(__dirname, 'components/blocks') })
  })

  // Nuxt Storybook.
  this.nuxt.hook('storybook:config', ({ stories }) => {
    this.addTemplate({
      src: resolve(__dirname, '../templates/druxt-breadcrumb.stories.js'),
      fileName: 'stories/druxt-breadcrumb.stories.js',
    })
    stories.push(resolve(this.options.buildDir, './stories/druxt-breadcrumb.stories.js'))
  })
}

DruxtBreadcrumbModule.meta = require('../package.json')

export { DruxtBreadcrumbModule }
