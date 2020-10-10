import Druxt from './components/Druxt.vue'
import DruxtWrapper from './components/DruxtWrapper.vue'

import { DruxtNuxtModule } from './nuxtModule'

/**
 * The Vue.js Druxt component.
 *
 * @type {object}
 * @exports Druxt
 * @name Druxt
 * @see {@link ./components/Druxt|API documentation}
 * @see {@link /guide/#the-druxt-component|Guide}
 *
 * @example @lang js <caption>Register globally</caption>
 * import Vue from 'vue'
 * import { Druxt } from 'druxt'
 *
 * Vue.component(Druxt)
 *
 * @example @lang vue <caption>Register locally</caption>
 * <template>
 *   <Druxt :module="module" />
 * </template>
 *
 * <script>
 * import { Druxt } from 'druxt'
 * export default {
 *   components: { Druxt }
 * }
 * </script>
 */
export { Druxt }

/**
 * DruxtJS utility class.
 *
 * @type {class}
 * @exports DruxtClass
 * @name DruxtClass
 * @see {@link ./class|DruxtClass}
 *
 * @example @lang js
 * import { DruxtClass } from 'druxt'
 * const druxt = new DruxtClass()
 */
export { DruxtClass } from './class'

/**
 * Vue.js Mixin to add support for the Wrapper system to a Druxt module.
 *
 * @type {object}
 * @exports DruxtComponentMixin
 * @see {@link ./mixins/component|DruxtComponentMixin}
 * @see {@link /guide/#wrapper-theme-system|Wrapper theme system}
 *
 * @example @lang vue <caption>CustomDruxtModule.vue</caption>
 * <template>
 *   <component :is="component.is" v-bind="component.propsData">
 *     <!-- -->
 *   </component>
 * </template>
 *
 * <script>
 * import { DruxtComponentMixin } from 'druxt'
 * export default {
 *   mixins: [DruxtComponentMixin]
 * }
 * </script>
 */
export { DruxtComponentMixin } from './mixins/component'

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
 * The default Druxt module wrapper Vue.js component.
 *
 * @type {object}
 * @exports DruxtWrapper
 * @name DruxtWrapper
 * @see {@link ./components/DruxtWrapper|API documentation}
 * @see {@link /guide/#the-druxt-component|Guide}
 * @private
 */
export { DruxtWrapper }
