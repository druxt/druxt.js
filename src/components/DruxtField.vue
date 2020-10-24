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
      v-bind="{
        ...component.propsData,
        ...$attrs
      }"
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
    </component>
  </component>
</template>

<script>
import { DruxtComponentMixin } from 'druxt'

/**
 * The `<DruxtField />` Vue.js component.
 *
 * - Renders the provided Field data.
 * - Supports Component Suggestion based theming with Vue.js Slots.
 *
 * @example
 * <druxt-field
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

  /**
   * Vue.js Mixins.
   *
   * @see {@link https://druxtjs.org/api/mixins/component.html|DruxtComponentMixin}
   */
  mixins: [DruxtComponentMixin],

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * The Field data.
     *
     * @type {(array|boolean|number|object|string)}
     */
    data: {
      type: [Array, Boolean, Number, Object, String],
      default: null,
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
    }
  },

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * The Field label display settings.
     *
     * @type {object}
     * @default { position: 'hidden' }
     */
    label() {
      if (!this.schema.label || !this.schema.label.text) return { position: 'hidden' }

      return this.schema.label
    },

    /**
     * Component properties to pass through to the Field's suggested component.
     *
     * @type {boolean|object}
     * @default false
     *
     * @todo Add test coverage with relationship data.
     */
    items() {
      if (this.data === null) return false

      // Normalize data.
      const data = Array.isArray(this.data) || this.relationship ? this.data : [this.data]

      // If not relationship.
      if (!this.relationship) {
        return data
      }

      // If relationship and data present.
      else if (data.data) {
        const items = Array.isArray(data.data) ? data.data : [data.data]
        return items.map(item => ({
          type: item.type,
          uuid: item.id,
          mode: ((this.schema.settings || {}).display || {}).view_mode || 'default'
        }))
      }

      return false
    },
  },

  druxt: ({ vm }) => ({
    componentOptions: [[vm.schema.type, vm.schema.id]],

    propsData: {
      items: vm.items,
      schema: vm.schema
    }
  })
}
</script>
