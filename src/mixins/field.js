import { DruxtEntityContextMixin } from './context'

/**
 * Provides Vue.js properties to render a DruxtField Wrapper component.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * import { DruxtFieldMixin } from 'druxt-entity'
 *
 * export default {
 *   mixins: [DruxtFieldMixin]
 * }
 * </script>
 */
const DruxtFieldMixin = {
  /**
   * Vue.js mixins.
   * @see {@link context|DruxtEntityContextMixin}
   * @type {object[]}
   */
  mixins: [
    DruxtEntityContextMixin
  ],

  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * JSON:API errors.
     *
     * @type {array}
     */
    errors: {
      type: Array,
      default: () => [],
    },

    /**
     * Inner wrapper component and props.
     * @type {object}
     * @default { component: 'div', props: {} }
     * @todo Move inner prop to new common Wrapper mixin.
     */
    inner: {
      type: Object,
      default: () => ({
        component: 'div',
        props: {}
      })
    },

    /**
     * Field items.
     * @type {array}
     */
    items: {
      type: [Array, Boolean],
      required: true
    },

    /**
     * Field relationship status.
     *
     * @type {boolean}
     */
     relationship: {
      type: Boolean,
      default: false
    },

    /**
     * Field schema object.
     * @type {object}
     */
    schema: {
      type: Object,
      required: true
    },

    /**
     * The Field value.
     */
     value: {
      type: [Array, Boolean, Number, String, Object],
      default: undefined,
    },

    /**
     * Outer wrapper component and props.
     * @type {object}
     * @default { component: 'div', props: {} }
     * @todo Move wrapper prop to new common Wrapper mixin.
     */
    wrapper: {
      type: Object,
      default: () => ({
        component: 'div',
        props: {}
      })
    }
  },

  data: ({ value }) => ({
    model: value,
  }),
}

export { DruxtFieldMixin }
