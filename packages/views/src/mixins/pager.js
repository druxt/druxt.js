/**
 * Provides Vue.js properties for DruxtViewPager slot themable components.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * import { DruxtViewsPagerMixin } from 'druxt-views'
 *
 * export default {
 *   mixins: [DruxtViewsPagerMixin],
 * }
 * </script>
 */
const DruxtViewsPagerMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The JSON:API Views results total count.
     *
     * @type {integer}
     */
    count: {
      type: [Boolean, Number],
      default: false,
    },

    /**
     * The Pager options.
     *
     * @type {object}
     */
    options: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The JSON:API Views results resource.
     *
     * @type {object}
     */
    resource: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The Pager type.
     *
     * @type {object}
     */
    type: {
      type: String,
      default: 'none',
    },

    /**
     * The DruxtViewPager model value.
     *
     * @type {integer}
     */
    value: {
      type: Number,
      default: 0,
    },
  },

  /**
   * Vue.js Data object.
   *
   * @property {object} model - The DruxtViewPager model.
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

export { DruxtViewsPagerMixin }
