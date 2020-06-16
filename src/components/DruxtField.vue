<template>
  <component
    :is="component"
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
export default {
  name: 'DruxtField',

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
    component() {
      for (const suggestion of this.suggestions) {
        if (typeof this.$options.components[suggestion] !== 'undefined') {
          return suggestion
        }
      }

      return false
    },

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

    suggestions() {
      const suggestions = []
      if (!this.schema.type) return suggestions

      const prefix = 'DruxtField'

      const transform = (string) => string.replace(/((\b|_)[a-z])/gi, (string) =>
        string.toUpperCase().replace('_', '')
      )

      const type = transform(this.schema.type)
      const id = transform(this.schema.id)

      // e.g., DruxtFieldStringFieldText.
      suggestions.push(prefix + type + id)
      // e.g., DruxtFieldString.
      suggestions.push(prefix + type)

      return suggestions
    }
  }
}
</script>
