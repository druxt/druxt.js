/**
 * Provides Vue.js properties for DruxtViewSorts slot themable components.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * import { DruxtViewSortsMixin } from 'druxt-views'
 *
 * export default {
 *   mixins: [DruxtViewSortsMixin],
 * }
 * </script>
 */
const DruxtViewsSortsMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
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
     * The Exposed Sort objects.
     *
     * @type {object[]}
     */
    sorts: {
      type: Array,
      default: () => ([]),
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
     * The DruxtViewSorts model value.
     *
     * @type {string}
     */
    value: {
      type: String,
      default: undefined,
    },
  },

  /**
   * Vue.js Data object.
   *
   * @property {object} model - The DruxtViewSorts model.
   */
  data() {
    return {
      model: this.value
    }
  },

  watch: {
    model(to, from) {
      if (to !== from) {
        this.$emit('input', this.model)
      }
    }
  }
}

export { DruxtViewsSortsMixin }
