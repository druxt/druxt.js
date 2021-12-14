import { DruxtNuxtModule } from './nuxt'
DruxtNuxtModule.meta = require('../package.json')

/**
 * The JSON:API client used by the Druxt Nuxt plugin and DruxtStore.
 *
 * @type {class}
 * @exports DruxtClient
 * @name DruxtClient
 * @see {@link /api/packages/druxt/client|DruxtClient}
 *
 * @example <caption>Creating a new instance of the DruxtClient</caption> @lang js
 * import { DruxtClient } from 'druxt'
 * const druxt = new DruxtClient('https://demo-api.druxtjs.org')
 */
export { DruxtClient } from './client'

/**
 * The Druxt module for Nuxt.
 *
 * @type {Function}
 * @exports default
 * @name DruxtNuxtModule
 * @see {@link /api/packages/druxt/nuxtModule|DruxtNuxtModule}
 *
 * @example <caption>Installing the Druxt module</caption> @lang js
 * // nuxt.config.js
 * export default {
 *   modules: ['druxt'],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 */
export default DruxtNuxtModule

/**
 * Vuex module used to interface with the DruxtClient and store resource data.
 *
 * @example <caption>Manual usage</caption> @lang js
 * import { DruxtStore } from 'druxt'
 * import Vue from 'vue'
 * import Vuex from 'vuex'
 *
 * Vue.use(Vuex)
 * const store = new Vuex.Store()
 * DruxtStore({ store })
 *
 * @type {object}
 * @exports DruxtStore
 * @name DruxtStore
 * @see {@link /api/packages/druxt/stores/druxt|DruxtStore}
 */
export { DruxtStore } from './stores/druxt'

/**
 * @deprecated
 * @private
 */
export { DruxtClass } from './class'
