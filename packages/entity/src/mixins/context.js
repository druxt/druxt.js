/**
 * Provides a context passthrough mechanism for Vue.js components.
 *
 * Context persists through all `<druxt-entity>` and `<DruxtField>`
 * components.
 *
 * @mixin
 * @deprecated
 * @private
 *
 * @example @lang vue
 * <!-- Parent component -->
 * <template>
 *   <child-component :context="{ icon: true }" />
 * </template>
 *
 * @example @lang vue
 * <!-- Nested/Child component -->
 * <template>
 *   <div>
 *     <!-- Render Icon component if `context.icon` is `true`. -->
 *     <icon-component v-if="context.icon" />
 *   </div>
 * </template>
 *
 * <script>
 * // Import mixin.
 * import { DruxtEntityContextMixin } from 'druxt-entity'
 *
 * export default {
 *   // Register mixin.
 *   mixins: [DruxtEntityContextMixin],
 * }
 * </script>
 *
 * TODO: Move DruxtEntityContextMixin to a common module.
 */
const DruxtEntityContextMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * @type {object}
     * @default { ...this.$parent.context }
     */
    context: {
      type: Object,
      default: function() {
        return { ...this.$parent.context }
      },
    },
  },
}

export { DruxtEntityContextMixin }
