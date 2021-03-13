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
 * The DruxtModule base Vue.js component.
 *
 * @type {object}
 * @exports DruxtModule
 * @name DruxtModule
 * @see {@link ./components/DruxtModule|API documentation}
 *
 * @example @lang vue
 * <script>
 * import { DruxtModule } from 'druxt'
 * export default {
 *   name: 'MyDruxtModule',
 *   extends: DruxtModule,
 *   druxt: {
 *     componentOptions: () => ([['wrapper']]),
 *     propsData: (ctx) => ({ prop: ctx.prop }),
 *   }
 * }
 * </script>
 */
export { default as DruxtModule } from './components/DruxtModule.vue'

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

/**
 * DruxtJS utility class.
 *
 * @type {class}
 * @exports DruxtClass
 * @name DruxtClass
 * @see {@link ./class|DruxtClass}
 *
 * @deprecated
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
 *
 * @deprecated
 */
export { DruxtComponentMixin } from './mixins/component'
