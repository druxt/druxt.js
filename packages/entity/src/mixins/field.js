import { DruxtEntityContextMixin } from './context'

/**
 * Provides Vue.js properties to render a DruxtField Wrapper component.
 *
 * @mixin
 * @see https://druxtjs.org/modules/entity
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
     * @default []
     */
    errors: {
      type: Array,
      default: () => [],
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
     * @type {(array|boolean|number|object|string)}
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
   * Provides the reactive field model, initialized from the value property.
   *
   * @param {object} vm - The component ViewModel.
   * @param {Array|boolean|number|object|string} vm.value - The Field value.
   * @property {object} model - The model object.
   */
  data: ({ value }) => ({
    model: value,
  }),

  /** */
  computed: {
    /**
     * The Field items, normalised to an array for rendering.
     *
     * Relationship values are mapped to `{ type, uuid, mode }` objects for use
     * with the DruxtEntity component.
     *
     * @type {boolean|object}
     * @default []
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
