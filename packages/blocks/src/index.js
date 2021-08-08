import { DruxtBlocksNuxtModule } from './nuxtModule'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt application.
 *
 * @type {Function}
 * @exports default
 * @name DruxtBlocksModule
 * @see {@link ./nuxtModule|DruxtBlocksModule}
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt-blocks'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 */
export default DruxtBlocksNuxtModule

/**
 * Vue.js Mixin.
 *
 * @type {object}
 * @exports DruxtBlocksBlockMixin
 * @see {@link ./mixins/block|DruxtBlocksBlockMixin}
 */
 export { DruxtBlocksBlockMixin } from './mixins/block'
