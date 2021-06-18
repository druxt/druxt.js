<template>
  <component
    :is="wrapper.component"
    v-if="!$fetchState.pending"
    class="field"
    :class="wrapper.class"
    :style="wrapper.style"
    v-bind="wrapper.propsData"
  >
    <component
      :is="component.is"
      ref="component"
      v-model="model"
      v-bind="{
        ...component.propsData,
        errors,
        ...$attrs
      }"
      @input="onInput"
    >
      <!-- Label: Above -->
      <template
        v-if="label.position === 'above'"
        v-slot:label-above
      >
        <strong>{{ label.text }}:</strong>
      </template>

      <!-- Label: Inline -->
      <template
        v-if="label.position === 'inline'"
        v-slot:label-inline
      >
        <strong>{{ schema.label.text }}:</strong>
      </template>

      <div>Missing Field: <code>{{ schema.type }}</code></div>
    </component>
  </component>
</template>

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
    /**
     * Updates the model whenever the value is directly changed.
     */
    value() {
      this.model = this.value
    },
  },

  methods: {
    /**
     * Input event handler, emits `input`.
     * 
     * @params {(array|boolean|number|object|string)} value - The Field value.
     */
    onInput(value) {
      this.model = value
      this.$emit('input', value)
    },
  },

  druxt: {
    componentOptions: ({ schema }) => ([
      [schema.type || 'undefined', schema.id, (schema.config || {}).schemaType],
      [schema.type || 'undefined', (schema.config || {}).schemaType],
      ['default', (schema.config || {}).schemaType],
    ]),

    propsData: ({ errors, model, relationship, schema }) => ({ errors, relationship, schema, value: model }),
  }
}
</script>
