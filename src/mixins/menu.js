/**
 * Provides Vue.js properties to render Drupal Menu components.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * import { DruxtMenuMixin } from 'druxt-menu'
 *
 * export default {
 *   mixins: [DruxtMenuMixin],
 * }
 * </script>
 */
const DruxtMenuMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The Menu items.
     *
     * @type {object[]}
     */
    items: {
      type: Array,
      required: true
    }
  },
}

export { DruxtMenuMixin }
