/**
 * Provides Vue.js properties for DruxtViewsFilter slot themable components.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * import { DruxtViewsFilterMixin } from 'druxt-views'
 *
 * export default {
 *   mixins: [DruxtViewsFilterMixin],
 * }
 * </script>
 */
const DruxtViewsFilterMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The Exposed Filter object.
     *
     * @type {object}
     */
    filter: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The DruxtViewFilter model value.
     *
     * @type {*}
     */
    value: {
      type: [Array, Boolean, Number, String],
      default: undefined,
    },
  },

  /**
   * Vue.js Data object.
   *
   * @property {object} model - The DruxtViewFilter model.
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

export { DruxtViewsFilterMixin }
