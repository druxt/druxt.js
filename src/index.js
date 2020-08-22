import { DruxtModule } from './module'

/**
 * The Nuxt.js module function.
 *
 * Sets up a Druxt.js frontend.
 *
 * @type {Function}
 * @exports default
 * @name DruxtModule
 * @see {@link ./module|DruxtModule}
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://example.com'
 *   }
 * }
 */
export default DruxtModule

/**
 * The Druxt class.
 *
 * @exports Druxt
 * @name Druxt
 * @see {@link ./druxt|Druxt}
 */
export { Druxt } from './druxt'

/**
 * The Druxt.js Vuex store.
 *
 * @exports DruxtStore
 * @name DruxtStore
 * @see {@link ./stores/druxt|DruxtStore}
 */
export { DruxtStore } from './stores/druxt'
