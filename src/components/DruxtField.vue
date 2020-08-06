<template>
  <!-- Render wrapper component and props. -->
  <component
    :is="component"
    :context="context"
    v-bind="props"
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
</template>

<script>
import { DruxtEntityContextMixin, DruxtEntityComponentSuggestionMixin } from '../mixins'

/**
 * The `<druxt-field />` Vue.js component.
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
   * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
   * @see {@link ../mixins/context|DruxtEntityContextMixin}
   * @see {@link https://vuejs.org/v2/guide/mixins.html}
   */
  mixins: [DruxtEntityContextMixin, DruxtEntityComponentSuggestionMixin],

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
    props() {
      if (this.data === null) return false

      // Normalize data.
      const data = Array.isArray(this.data) || this.relationship ? this.data : [this.data]

      // If not relationship.
      if (!this.relationship) {
        return {
          items: data,
          schema: this.schema,
          ...this.options
        }
      }

      // If relationship and data present.
      else if (data.data) {
        const items = Array.isArray(data.data) ? data.data : [data.data]
        return {
          items: items.map(item => ({
            type: item.type,
            uuid: item.id,
            mode: this.schema.settings.display.view_mode || 'default',
          })),
          schema: this.schema,
          ...this.options
        }
      }

      return false
    },

    /**
     * Default suggestions for the Component suggestion mixin.
     *
     * - **[Prefix][Type][Id]**
     * - **[Prefix][Type]**
     *
     * @type {object[]}
     *
     * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
     *
     * @example @lang html
     * <druxt-field :data="data" :schema="{ id: 'field_text', type: 'string' }" />
     * <!--
     * Suggestions to be rendered by the DruxtEntity component:
     *   - DruxtFieldStringFieldText
     *   - DruxtFieldString
     * -->
     */
    suggestionDefaults() {
      return [
        // e.g. DruxtFieldStringFieldText.
        { value: this.tokens.prefix + this.tokens.type + this.tokens.id },
        // e.g. DruxtFieldString.
        { value: this.tokens.prefix + this.tokens.type },
      ]
    },

    /**
     * Tokens for the Component suggestion mixin.
     *
     * - prefix
     * - id
     * - type
     *
     * @type {object}
     *
     * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
     */
    tokens() {
      return {
        prefix: 'DruxtField',
        id: this.suggest(this.schema.id),
        type: this.suggest(this.schema.type),
      }
    },

    /**
     * Token type for DruxtEntityComponentSuggestionMixin.
     *
     * @type {string}
     * @default field
     *
     * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
     */
    tokenType: () => 'field'
  }
}
</script>
