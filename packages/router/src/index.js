import { DruxtRouterNuxtModule } from './nuxtModule'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt application.
 *
 * @type {Function}
 * @exports default
 * @name DruxtRouterNuxtModule
 * @see {@link ./nuxtModule|DruxtRouterNuxtModule}
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt-router'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 */
export default DruxtRouterNuxtModule

/**
 * The DruxtRouter class.
 *
 * Core functionality for the DruxtRouter module.
 *
 * @type {class}
 * @exports DruxtRouter
 * @name DruxtRouter
 * @see {@link ./router.html|DruxtRouter}
 */
export { DruxtRouter } from './router'

/**
 * Vuex store module.
 *
 * @type {object}
 * @exports DruxtRouterStore
 * @name DruxtRouterStore
 * @see {@link ./stores/router|DruxtRouterStore}
 */
export { DruxtRouterStore } from './stores/router'
