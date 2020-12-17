import DruxtSite from './components/DruxtSite.vue'
import { DruxtSiteNuxtModule } from './nuxtModule'

/**
 * The Nuxt.js module functions.
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
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 */
export default DruxtSiteNuxtModule

/**
 * The DruxtSite Vue.js component.
 *
 * Renders all available block regions and content based on Drupals
 * configuration and routing information.
 *
 * @type {object}
 * @exports DruxtSite
 * @name DruxtSite
 * @see {@link ./components/DruxtSite|DruxtSite}
 * @example @lang vue
 * <template>
 *   <DruxtSite theme="umami" />
 * </template>
 *
 * <script>
 *   import { DruxtSite } from 'druxt-site'
 *
 *   export default {
 *     components: { DruxtSite }
 *   }
 * </script>
 */
export { DruxtSite }
