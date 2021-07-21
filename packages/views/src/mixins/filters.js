/**
 * Provides Vue.js properties for DruxtViewsFilters slot themable components.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * import { DruxtViewsFiltersMixin } from 'druxt-views'
 *
 * export default {
 *   mixins: [DruxtViewsFiltersMixin],
 * }
 * </script>
 */
const DruxtViewsFiltersMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The Exposed Filter objects.
     *
     * @type {object[]}
     */
    filters: {
      type: Array,
      default: () => ([]),
    },

    /**
     * The Exposed form options.
     *
     * @type {object}
     */
    options: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The Exposed form type.
     *
     * @type {string}
     */
    type: {
      type: String,
      default: 'basic',
    },

    /**
     * The DruxtViewFilters model value.
     *
     * @type {object}
     */
    value: {
      type: Object,
      default: () => ({}),
    },
  },

  /**
   * Vue.js Data object.
   *
   * @property {object} model - The DruxtViewFilters model.
   */
  data() {
    return {
      model: this.value
    }
  }
}

export { DruxtViewsFiltersMixin }
