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
  mixins: [
    DruxtEntityContextMixin
  ],

  /** */
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
    },
  },

  /**
   * @property {object} model - The model object.
   */
  data: ({ value }) => ({
    model: value,
  }),

  /** */
  computed: {
    /**
     * 
     * @type {boolean|object}
     * @default false
     */
    items: ({ model, relationship, schema }) => {
      if (typeof model === 'undefined' || model === null) return []

      if (relationship) {
        const items = Array.isArray(model.data) ? [...model.data] : [{ ...model.data }]
        return items.map((item) => ({
          type: item.type || (item.data || {}).type,
          uuid: item.id || (item.data || {}).id,
          mode: ((schema.settings || {}).display || {}).view_mode || 'default',
        }))
      }

      return Array.isArray(model) ? [...model] : [model]
    }
  },

  watch: {
    model() {
      if (this.model !== this.value) {
        this.$emit('input', this.model)
      }
    },

    value() {
      if (this.model !== this.value) {
        this.model = this.value
      }
    }
  }
}

export { DruxtFieldMixin }
