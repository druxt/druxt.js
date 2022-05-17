import { DruxtEntityContextMixin } from 'druxt-entity'

/**
 * Provides Vue.js properties for DruxtView slot themable components.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * import { DruxtViewsViewMixin } from 'druxt-views'
 *
 * export default {
 *   mixins: [DruxtViewsViewMixin],
 * }
 * </script>
 */
const DruxtViewsViewMixin = {
  /**
   * Vue.js mixins.
   * @see {@link https://entity.druxtjs.org/api/mixins/context|DruxtEntityContextMixin}
   * @type {object[]}
   */
  mixins: [DruxtEntityContextMixin],

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
     * The View display object.
     *
     * @type {object}
     */
    display: {
      type: Object,
      require: true,
    },

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
     * The Entity display mode.
     *
     * @type {boolean|string}
     */
    mode: {
      type: [Boolean, String],
      default: 'default'
    },

    /**
     * The View pager settings.
     *
     * @type {object}
     */
    pager: {
      type: Object,
      require: true,
    },

    /**
     * The JSON:API Views results.
     *
     * @type {object[]}
     */
    results: {
      type: Array,
      require: true,
    },

    /**
     * The DruxtView model value.
     *
     * @type {object}
     */
    value: {
      type: Object,
      default: () => ({
        page: null,
      })
    },

    /**
     * The JSON:API View resource.
     *
     * @type {object}
     */
    view: {
      type: Object,
      require: true,
    },
  },

  /**
   * Vue.js Data object.
   *
   * @property {object} model - The DruxtView model.
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

export { DruxtViewsViewMixin }
