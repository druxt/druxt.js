<template>
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

export default {
  name: 'DruxtField',

  mixins: [DruxtEntityContextMixin, DruxtEntityComponentSuggestionMixin],

  props: {
    data: {
      type: [Array, Boolean, Number, Object, String],
      default: null,
    },

    relationship: {
      type: Boolean,
      default: false
    },

    schema: {
      type: Object,
      required: true
    },

    options: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    label() {
      if (!this.schema.label || !this.schema.label.text) return { position: 'hidden' }

      return this.schema.label
    },

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

    suggestionDefaults() {
      return [
        // e.g. DruxtFieldStringFieldText.
        { value: this.tokens.prefix + this.tokens.type + this.tokens.id },
        // e.g. DruxtFieldString.
        { value: this.tokens.prefix + this.tokens.type },
      ]
    },

    tokens() {
      return {
        prefix: 'DruxtField',
        id: this.suggest(this.schema.id),
        type: this.suggest(this.schema.type),
      }
    },

    tokenType: () => 'field'
  }
}
</script>
