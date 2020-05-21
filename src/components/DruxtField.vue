<template>
  <div v-if="items && schema">
    <strong v-if="schema.label && schema.label.position === 'above' && schema.label.text">{{ schema.label.text }}:</strong>

    <component
      :is="component"
      v-for="(item, key) of items"
      :key="key"
      v-bind="item"
    />

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

      if (this.relationship) {
        suggestions.push('DruxtEntity')
      }

      return suggestions
    },

    items() {
      const data = this.data
      if (data === null) return false

      // If not relationship, return Array wrapped object of data.
      // @TODO - Test with multi-cardinality fields.
      if (!this.relationship && typeof data === 'object') {
        return [{
          ...data,
          schema: this.schema
        }]
      }

      if (!this.relationship && typeof data !== 'object') {
        return [{
          value: data,
          schema: this.schema
        }]
      }

      // If relationship and data present, return transformed data.
      if (this.relationship && data.data) {
        const items = Array.isArray(data.data) ? data.data : [data.data]
        return items.map(item => ({
          type: item.type,
          uuid: item.id,
          mode: this.schema.settings.display.view_mode || 'default',
          schema: this.schema
        }))
      }

      return false
    }
  }
}
</script>
