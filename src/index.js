import DruxtSite from './components/DruxtSite.vue'
import { DruxtSiteNuxtModule } from './nuxtModule'

/**
 * The Nuxt module.
 *
 * Installs and configures all DruxtJS Site modules.
 *
 * @type {Function}
 * @exports default
 * @name DruxtSiteNuxtModule
 * @see {@link ./nuxtModule|DruxtSiteNuxtModule}
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt-site'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://example.com'
 *   }
 * }
 */
export default DruxtSiteNuxtModule

/**
 * The DruxtSite Vue.js component.
 *
 * @type {object}
 * @exports DruxtSite
 * @name DruxtSite
 * @see {@link ./components/DruxtSite|DruxtSite}
 * @example @lang js
 * import Vue from 'vue'
 * import { DruxtSite } from 'druxt'
 *
 * Vue.component(DruxtSite)
 */
export { DruxtSite }
