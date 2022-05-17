/**
 * Provides Vue.js properties for DrupalSite Wrapper components.
 *
 * @mixin
 *
 * @example @lang vue
 * <template>
 *   <div>
 *     <DruxtBlockRegion
 *       v-for="region of regions"
 *       :key="region"
 *       v-bind="props[region]"
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
     * The JSON:API resource language code.
     *
     * @type {string}
     */
    langcode: {
      type: String,
      default: undefined,
    },

    /**
     * DruxtBlockRegion propsData for regions.
     *
     * @return {object}
     */
    props: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The Block region names.
     *
     * @type {string[]},
     */
     regions: {
      type: Array,
      default: () => ([])
    },

    /**
     * The Drupal theme ID.
     *
     * @type {string}
     */
    theme: {
      type: String,
      required: true,
    },
  },
}

export { DruxtSiteMixin }
