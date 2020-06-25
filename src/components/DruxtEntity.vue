<template>
  <component
    :is="wrapper.component"
    v-bind="wrapper.props"
  >
    <component
      :is="component"
      v-if="entity && schema"
      v-bind="props"
    >
      <!-- Render fields in their own named slots --->
      <template
        v-for="(field, key) of fields"
        v-slot:[field.schema.id]="options"
      >
        <druxt-field
          :key="key"
          v-bind="{ ...field, options }"
        />
      </template>

      <!-- Render fields in the default slot --->
      <template v-for="(field, key) of fields" v-bind="options">
        <druxt-field
          :key="key"
          v-bind="{ ...field, options }"
        />
      </template>
    </component>
  </component>
</template>

<script>
import { DruxtRouterEntityMixin } from 'druxt-router'
import { DruxtSchemaMixin } from 'druxt-schema'
import { mapActions } from 'vuex'

export default {
  name: 'DruxtEntity',

  mixins: [DruxtRouterEntityMixin, DruxtSchemaMixin],

  props: {
    wrapper: {
      type: Object,
      default: () => ({
        component: 'div',
        props: {}
      })
    }
  },

  computed: {
    component() {
      for (const suggestion of this.suggestions) {
        if (typeof this.$options.components[suggestion] !== 'undefined') {
          return suggestion
        }
      }

      return 'div'
    },

    fields() {
      if (!this.entity) return false

      const data = {
        ...this.entity.attributes,
        ...this.entity.relationships
      }

      const fields = {}
      for (const field of this.schema.fields) {
        // Filter out empty fields.
        if (this.isEmpty(data[field.id])) continue

        fields[field.id] = {
          data: data[field.id],
          schema: field,
          relationship: !!this.entity.relationships[field.id]
        }
      }

      return fields
    },

    props() {
      if (this.component === 'div') return false

      return {
        entity: this.entity,
        fields: this.fields,
        schema: this.schema
      }
    },

    suggestions() {
      const suggestions = []
      if (!this.schema) return suggestions

      const prefix = 'DruxtEntity'

      const transform = (string) => string.replace(/((\b|_|--)[a-z])/gi, (string) =>
        string.toUpperCase().replace('_', '').replace('--', '')
      )
      const type = transform(this.schema.resourceType)
      const mode = transform(this.schema.config.mode)

      // e.g. DruxtEntityNodePageDefault
      suggestions.push(prefix + type + mode)
      // e.g. DruxtEntityNodePage
      suggestions.push(prefix + type)
      // e.g. DruxtEntityDefault
      suggestions.push(prefix + mode)

      return suggestions
    }
  },

  methods: {
    isEmpty(value) {
      if (typeof value === 'undefined') return true

      if (!value) return true

      if (Array.isArray(value.data) && !value.data.length) return true

      if (typeof value.data !== 'undefined' && !value.data) return true

      return false
    }
  }
}
</script>
