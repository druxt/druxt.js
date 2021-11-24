/**
 * The DruxtRouterMixin Vue.js mixin provides the props required for a Router Druxt wrapper component.
 *
 * @mixin
 *
 * @example @lang vue
 * <template>
 *   <div>
 *     <slot />
 *   </div>
 * </template>
 *
 * <script>
 * import { DruxtRouterMixin } from 'druxt-router'
 *
 * export default {
 *   mixins: [DruxtRouterMixin]
 * }
 * </script>
 */
const DruxtRouterMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The Decoupled router path.
     *
     * @type {string}
     */
     path: {
      type: String,
      default: undefined,
    },

    /**
     * The Decoupled router object.
     *
     * @type {object}
     */
    route: {
      type: Object,
      required: true
    }
  }
}

export { DruxtRouterMixin }
