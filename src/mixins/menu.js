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
    },

    /**
     * The menu parent ID to use as the root of the menu.
     * 
     * @type {string}
     */
    parentId: {
      type: String,
      default: null,
    }
  },
}

export { DruxtMenuMixin }
