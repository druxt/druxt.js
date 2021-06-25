<script>
import { DruxtModule } from 'druxt'

/**
 * The `<DruxtField />` component renders an Entity Field for the DruxtEntity
 * and DruxtEntityForm components.
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
     * @type {object[]}
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
     * @todo deprecate this?
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

  /**
   * @property {object} model - The model object.
   */
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

  /** DruxtModule settings */
  druxt: {
    /**
     * Provides the available component naming options for the Druxt Wrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ schema }) => ([
      [schema.type || 'undefined', schema.id, (schema.config || {}).schemaType],
      [schema.type || 'undefined', (schema.config || {}).schemaType],
      ['default', (schema.config || {}).schemaType],
    ]),

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ errors, model, relationship, schema }) => ({ errors, relationship, schema, value: model }),

    /**
     * Provides the scoped slots object for the Module render function.
     *
     * A scoped slot is provided for the label, as well as label-above and
     * label-inline depending on the field schema.
     * 
     * A default slot is provided with debug information if Nuxt is in
     * development mode.
     *
     * @example <caption>DruxtField**SchemaType**.vue</caption> @lang vue
     * <template>
     *   <div>
     *     <slot name="label" />
     *     {{ $attrs.value }}
     *   </div>
     * </template>
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
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

/**
 * Provides the available naming options for the Wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtField[Type][Id][SchemaType]',
 *   'DruxtField[Type][Id]
 *   'DruxtField[Type][SchemaType]',
 *   'DruxtField[Default][SchemaType]',
 *   'DruxtField[Type]',
 *   'DruxtField[Default]',
 * ]
 *
 * @example <caption>Media field</caption> @lang js
 * [
 *   'DruxtFieldEntityReferenceEntityViewFieldMediaImageView',
 *   'DruxtFieldEntityReferenceEntityViewFieldMediaImage',
 *   'DruxtFieldEntityReferenceEntityViewView',
 *   'DruxtFieldDefaultView',
 *   'DruxtFieldEntityReferenceEntityView',
 *   'DruxtFieldDefault',
 * ]
 */

/**
 * Provides propsData for use in the Wrapper component.
 *
 * @typedef {object} PropsData
 * @param {object[]} errors - JSON:API errors.
 * @param {boolean} relationship - Field relationship status.
 * @param {object} schema - Drupal Field schema information.
 * @param {object} value - The Field value.
 *
 * @example @lang js
 * {
 *   errors: [],
 *   relationship: true,
 *   schema: {
 *     config: {},
 *     description: '',
 *     id: 'field_media_image',
 *     label: {},
 *     required: true,
 *     settings: {},
 *     thirdPartySettings: [],
 *     type: 'entity_reference_entity_view',
 *     weight: 4,
 *   },
 *   value: {
 *     data: {
 *       id: '71a90e86-55b6-40fe-b77d-552dca1bee77',
 *       type: 'media--image',
 *     },
 *     links: {},
 *   },
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} label - The field label.
 * @param {function} label-above - The field label, if label position is 'above'.
 * @param {function} label-inline - The field label, if label position is 'inline'.
 * @param {function} default - Debug information if Nuxt is in development mode.
 */
</script>
