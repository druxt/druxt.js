import { DruxtNuxtModule } from './nuxtModule'

/**
 * DruxtJS JSON:API client.
 *
 * @type {class}
 * @exports DruxtClient
 * @name DruxtClient
 * @see {@link ./class|DruxtClient}
 *
 * @example @lang js
 * import { DruxtClient } from 'druxt'
 * const druxt = new DruxtClient('https://demo-api.druxtjs.org')
 */
export { DruxtClient } from './client'

/**
 * Nuxt module function to install Druxt.
 *
 * @type {Function}
 * @exports default
 * @name DruxtNuxtModule
 * @see {@link ./nuxtModule|DruxtNuxtModule}
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 */
export default DruxtNuxtModule

/**
 * Vuex store module.
 *
 * @type {object}
 * @exports DruxtStore
 * @name DruxtStore
 * @see {@link ./stores/druxt|DruxtStore}
 */
export { DruxtStore } from './stores/druxt'

/**
 * DruxtJS utility class.
 *
 * @type {class}
 * @exports DruxtClass
 * @name DruxtClass
 * @see {@link ./class|DruxtClass}
 *
 * @deprecated
 * @private
 */
export { DruxtClass } from './class'
