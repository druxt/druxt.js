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
 * Default function to alert user to incorrectly installed module.
 *
 * This was added as part of the @nuxt/kit update due to breaking changes.
 */
export default () => {
  throw new Error("Druxt Nuxt module must be installed as 'druxt/nuxt'")
}
