<template>
  <div v-if="props && schema">
    <!-- Label -->
    <strong v-if="schema.label && schema.label.position === 'above' && schema.label.text">{{ schema.label.text }}:</strong>

    <!-- Field component -->
    <component :is="component" v-bind="props" />

    <!-- Component error/debug message -->
    <div v-if="!component">
      <strong>Field component(s) missing: <code>{{ suggestions.join(', ') }}</code></strong>
      <pre>{{ items }}</pre>
    </div>
  </div>
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

    suggestions() {
      const suggestions = []

      const prefix = 'DruxtField'

      let type = ''
      if (this.schema.type) {
        type = this.schema.type.replace(/((\b|_)[a-z])/gi, (string) =>
          string.toUpperCase().replace('_', '')
        )
        suggestions.push(prefix + type)
      }

      return suggestions
    },

    props() {
      if (this.data === null) return false

      // Normalize data.
      const data = Array.isArray(this.data) || this.relationship ? this.data : [this.data]

      // If not relationship.
      if (!this.relationship) {
        return {
          items: data,
          schema: this.schema
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
          schema: this.schema
        }
      }

      return false
    }
  }
}
</script>
