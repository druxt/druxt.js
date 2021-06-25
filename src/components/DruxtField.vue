<script>
import { DruxtModule } from 'druxt'

/**
 * The `<DruxtField />` Vue.js component.
 *
 * - Renders the provided Field data.
 * - Supports Component Suggestion based theming with Vue.js Slots.
 *
 * @example
 * <DruxtField
 *   data="A wholesome pasta bake is the ultimate comfort food. This delicious bake is super quick to prepare and an ideal midweek meal for all the family."
 *   :schema="{
 *     id: 'field_summary',
 *     label: {
 *       position: 'above',
 *       text: 'Summary',
 *     },
 *     type: 'basic_string'
 *   }"
 * />
 */
export default {
  name: 'DruxtField',

  extends: DruxtModule,

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
     * Field relationship status.
     *
     * @type {boolean}
     */
    relationship: {
      type: Boolean,
      default: false
    },

    /**
     * Drupal Field schema information.
     *
     * @type {object}
     */
    schema: {
      type: Object,
      required: true
    },

    /**
     * Field options.
     *
     * @type {object}
     * @default {}
     */
    options: {
      type: Object,
      default: () => ({})
    },

    /**
     * The Field value.
     * 
     * @type {(array|boolean|number|object|string)}
     * @model
     */
    value: {
      type: [Array, Boolean, Number, String, Object],
      default: undefined,
    },
  },

  fetchKey(getCounter) {
    const parent = (this.$parent || {}).entity || ((this.$parent || {}).$parent || {}).entity || {}
    const parts = ['DruxtField', parent.type, parent.id, this.schema.id].filter((o) => o)
    return [...parts, getCounter(parts.join(':'))].join(':')
  },

  data: ({ value }) => ({
    model: value,
  }),

  /** */
  computed: {
    /**
     * The Field data.
     * 
     * @type {(array|boolean|number|object|string)}
     */
    data: ({ model }) => model,

    /**
     * The Field label display settings.
     *
     * @type {object}
     * @default { position: 'hidden' }
     */
    label: ({ schema }) => !((schema || {}).label || {}).text
      ? { position: 'hidden' }
      : schema.label,
  },

  watch: {
    errors() {
      this.component.props.errors = this.errors
      this.component.propsData.errors = this.errors
    },
  },

  druxt: {
    componentOptions: ({ schema }) => ([
      [schema.type || 'undefined', schema.id, (schema.config || {}).schemaType],
      [schema.type || 'undefined', (schema.config || {}).schemaType],
      ['default', (schema.config || {}).schemaType],
    ]),

    propsData: ({ errors, model, relationship, schema }) => ({ errors, relationship, schema, value: model }),

    slots(h) {
      const scopedSlots = {}

      // Label(s).
      scopedSlots.label = (attrs) => h('strong', { attrs }, [`${this.schema.label.text}:`])
      if (this.label.position === 'above') {
        scopedSlots['label-above'] = scopedSlots.label
      }
      if (this.label.position === 'inline') {
        scopedSlots['label-inline'] = scopedSlots.label
      }

      // Provide debug data if Nuxt is running in dev mode.
      if (this.$nuxt.context.isDev)  {
        scopedSlots.default = (attrs) => h(
          'details',
          {
            attrs,
            style: {
              border: '2px dashed lightgrey',
              margin: '0.5em 0',
              padding: '1em',
            },
          },
          [
            h('summary', [`[DruxtField] Missing wrapper component for '${this.schema.id} (${this.schema.type}')`]),
            h('br'),
            h('label', ['Component options:', h('ul', this.component.options.map((s) => h('li', [s])))]),
            h('br'),
            h('label', ['Data:', h('pre', [JSON.stringify(this.model, null, '\t')])]),
            h('br'),
            h('label', ['Schema:', h('pre', [JSON.stringify(this.schema, null, '\t')])])
          ]
        )
      }

      return scopedSlots
    },
  },
}
</script>
