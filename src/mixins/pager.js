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
      type: Number,
      require: true,
    },

    /**
     * The Pager options.
     *
     * @type {object}
     */
    options: {
      type: Object,
      required: true,
    },

    /**
     * The JSON:API Views results resource.
     *
     * @type {object}
     */
    resource: {
      type: Object,
      require: true,
    },

    /**
     * The Pager type.
     *
     * @type {object}
     */
    type: {
      type: String,
      required: true,
    },

    /**
     * The DruxtView pager model value.
     *
     * @type {integer}
     */
    value: {
      type: Number,
      default: undefined,
    },
  },

  /**
   * Vue.js Data object.
   *
   * @property {object} model - The DruxtView pager model.
   */
  data() {
    return {
      model: this.value
    }
  },

  watch: {
    model() {
      this.$emit('input', this.model)
    }
  }
}

export { DruxtViewsPagerMixin }
