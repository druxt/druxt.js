/**
 * The DruxtRouter class.
 *
 * Core functionality for the DruxtRouter module.
 *
 * @type {class}
 * @exports DruxtRouter
 * @name DruxtRouter
 * @see {@link ./router|DruxtRouter}
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
