import { DruxtViewsNuxtModule } from './nuxtModule'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt application.
 *
 * @type {Function}
 * @exports default
 * @name DruxtViewsNuxtModule
 * @see {@link ./module|DruxtViewsNuxtModule}
 */
export default DruxtViewsNuxtModule

/**
 * Vuex store module.
 *
 * @type {object}
 * @exports DruxtViewsStore
 * @name DruxtViewsStore
 * @see {@link ./stores/views|DruxtViewsStore}
 */
export { DruxtViewsStore } from './stores/views'
