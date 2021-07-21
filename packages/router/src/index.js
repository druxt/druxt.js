import { DruxtRouterNuxtModule } from './nuxtModule'
import DruxtRouterComponent from './components/DruxtRouter.vue'

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
 * Vue.js component.
 *
 * @type {object}
 * @exports DruxtRouterComponent
 * @name DruxtRouterComponent
 * @see {@link ./components/DruxtRouter.html|DruxtRouterComponent}
 *
 * @example
 * <script>
 * import { DruxtRouterComponent } from 'druxt-router'
 *
 * export default {
 *   components: { DruxtRouterComponent }
 * }
 * </script>
 */
export { DruxtRouterComponent }

/**
 * Router Entity Vue.js Mixin.
 *
 * @type {object}
 * @exports DruxtRouterEntityMixin
 * @name DruxtRouterEntityMixin
 * @see {@link ./mixins/entity|DruxtRouterEntityMixin}
 *
 * @example
 * <script>
 * import { DruxtRouterEntityMixin } from 'druxt-router'
 *
 * export default {
 *   mixins: [DruxtRouterEntityMixin]
 * }
 * </script>
 */
export { DruxtRouterEntityMixin } from './mixins/entity'

/**
 * Router Wrapper Vue.js Mixin.
 *
 * @type {object}
 * @exports DruxtRouterMixin
 * @name DruxtRouterMixin
 * @see {@link ./mixins/router|DruxtRouterMixin}
 *
 * @example
 * <script>
 * import { DruxtRouterMixin } from 'druxt-router'
 *
 * export default {
 *   mixins: [DruxtRouterMixin]
 * }
 * </script>
 */
export { DruxtRouterMixin } from './mixins/router'

/**
 * Vuex store module.
 *
 * @type {object}
 * @exports DruxtRouterStore
 * @name DruxtRouterStore
 * @see {@link ./stores/router|DruxtRouterStore}
 */
export { DruxtRouterStore } from './stores/router'
