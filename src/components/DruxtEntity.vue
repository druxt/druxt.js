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
        v-slot:[field.schema.id]="{ context, options }"
      >
        <druxt-field
          :key="key"
          v-bind="{ ...field, context: { ..._self.context, ...context }, options }"
        />
      </template>

      <!-- Render fields in the default slot --->
      <template v-for="(field, key) of fields" v-bind="{ context, options }">
        <druxt-field
          :key="key"
          v-bind="{ ...field, context: { ..._self.context, ...context }, options }"
        />
      </template>
    </component>
  </component>
</template>

<script>
import { DruxtRouterEntityMixin } from 'druxt-router'
import { DruxtSchemaMixin } from 'druxt-schema'
import { mapActions } from 'vuex'

import { DruxtEntityContextMixin, DruxtEntityComponentSuggestionMixin } from '../mixins'

export default {
  name: 'DruxtEntity',

  mixins: [DruxtEntityContextMixin, DruxtEntityComponentSuggestionMixin, DruxtRouterEntityMixin, DruxtSchemaMixin],

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
      return {
        entity: this.entity,
        fields: this.fields,
        schema: this.schema
      }
    },

    suggestionDefaults() {
      if (!this.tokens) return []

      return [
        // e.g. DruxtEntityNodePageDefault
        { value: this.tokens.prefix + this.tokens.type + this.tokens.mode },
        // e.g. DruxtEntityNodePage
        { value: this.tokens.prefix + this.tokens.type },
        // e.g. DruxtEntityDefault
        { value: this.tokens.prefix + this.tokens.mode }
      ]
    },

    tokens() {
      if (!this.schema) return false

      return {
        prefix: 'DruxtEntity',
        mode: this.suggest(this.schema.config.mode),
        type: this.suggest(this.schema.resourceType),
      }
    },

    tokenType: () => 'entity'
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
