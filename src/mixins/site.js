/**
 * Provides Vue.js properties to render Drupal Site components.
 *
 * @mixin
 *
 * @example @lang vue
 * <template>
 *   <div>
 *     <DruxtBlockRegion
 *       v-for="region of regions"
 *       :key="region"
 *       :name="region"
 *       :theme="theme"
 *     />
 *   </div>
 * </template>
 *
 * <script>
 * import { DruxtSiteMixin } from 'druxt-site'
 *
 * export default {
 *   mixins: [DruxtSiteMixin],
 * }
 * </script>
 */
const DruxtSiteMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The Drupal theme ID.
     *
     * @type {string}
     */
    theme: {
      type: String,
      required: true,
    },

    /**
     * The Block region names.
     *
     * @type {string[]},
     */
    regions: {
      type: Array,
      default: []
    }
  },
}

export { DruxtSiteMixin }
