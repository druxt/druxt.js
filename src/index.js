import DruxtComponent from './components/Druxt.vue'
import { DruxtNuxtModule } from './nuxtModule'

/**
 * The Nuxt module.
 *
 * Installs DruxtJS functionality and configuration in your NuxtJS application.
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
 *     baseUrl: 'https://example.com'
 *   }
 * }
 */
export default DruxtNuxtModule

/**
 * The Druxt Vue.js component.
 *
 * @type {object}
 * @exports DruxtComponent
 * @name DruxtComponent
 * @see {@link ./components/Druxt|Druxt}
 * @example @lang js
 * import Vue from 'vue'
 * import { DruxtComponent } from 'druxt'
 *
 * Vue.component(DruxtComponent)
 */
export { DruxtComponent }

/**
 * Druxt Wrapper Mixin.
 *
 * @type {object}
 * @exports DruxtWrapperMixin
 * @see {@link ./mixins/wrapper|DruxtWrapperMixin}
 */
export { DruxtWrapperMixin } from './mixins/wrapper'
