<template>
  <!-- Render wrapper component and props. -->
  <component
    :is="wrapper.component"
    v-bind="wrapper.props"
  >
    <!-- Render suggested component. -->
    <component
      :is="component"
      v-if="entity && schema"
      v-bind="props"
    >
      <!-- Render fields in their own named slots. --->
      <template
        v-for="(field, key) of fields"
        v-slot:[field.schema.id]="{ context, options }"
      >
        <druxt-field
          :key="key"
          v-bind="{ ...field, context: { ..._self.context, ...context }, options }"
        />
      </template>

      <!-- Render fields in the default slot. --->
      <template
        v-for="(field, key) of fields"
        v-bind="{ context, options }"
      >
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

/**
 * The `<druxt-entity />` Vue.js component.
 *
 * - Loads a Drupal Entity JSON:API resource from the Druxt.js Router.
 * - Loads the Druxt.js Schema for the Drupal display mode.
 * - Renders Field data via the `<druxt-field />` component.
 * - Supports Component Suggestion based theming with Vue.js Slots.
 *
 * @example @lang vue
 * <!-- Render the specified Aritcle node with with Teaser display mode. -->
 * <druxt-entity type="node--article" :uuid="uuid" :mode="teaser" />
 *
 * @see {@link DruxtField}
 * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
 */
export default {
  name: 'DruxtEntity',

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
   * @see {@link ../mixins/context|DruxtEntityContextMixin}
   * @see {@link https://druxt.github.io/druxt-router/api/mixins/entity|DruxtRouterEntityMixin}
   * @see DruxtSchemaMixin.
   * @see {@link https://vuejs.org/v2/guide/mixins.html}
   */
  mixins: [DruxtEntityComponentSuggestionMixin, DruxtEntityContextMixin, DruxtRouterEntityMixin, DruxtSchemaMixin],

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * Wrapper component.
     *
     * @type {object}
     * @default { component: 'div', props: {} }
     *
     * @todo Move wrapper prop to new common Wrapper mixin.
     */
    wrapper: {
      type: Object,
      default: () => ({
        component: 'div',
        props: {}
      })
    }
  },

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * Renderable Entity fields based on Drupal view mode.
     * @type {boolean|object[]}
     * @default false
     */
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

    /**
     * Properties to pass through to the resolved component suggestion.
     *
     * @type {object}
     *
     * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
     */
    props() {
      return {
        entity: this.entity,
        fields: this.fields,
        schema: this.schema
      }
    },

    /**
     * Default suggestions for the Component suggestion mixin.
     *
     * - **[Prefix][Type][Mode]**
     * - **[Prefix][Type]**
     * - **[Prefix][Mode]**
     *
     * @type {object[]}
     *
     * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
     *
     * @example @lang html
     * <druxt-entity type="node--article" mode="teaser" :uuid="uuid" />
     * <!--
     * Suggestions to be rendered by the DruxtEntity component:
     *   - DruxtEntityNodeArticleTeaser
     *   - DruxtEntityNodeArticle
     *   - DruxtEntityTeaser
     * -->
     */
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

    /**
     * Tokens for the Component suggestion mixin.
     *
     * - prefix
     * - mode
     * - type
     *
     * @type {boolean|object}
     *
     * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
     */
    tokens() {
      if (!this.schema) return false

      return {
        prefix: 'DruxtEntity',
        mode: this.suggest(this.schema.config.mode),
        type: this.suggest(this.schema.resourceType),
      }
    },

    /**
     * Token type for DruxtEntityComponentSuggestionMixin.
     *
     * @type {string}
     * @default entity
     *
     * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
     */
    tokenType: () => 'entity'
  },

  methods: {
    /**
     * Checks if an Entity field is empty.
     *
     * @param {*} value - Field value.
     * @return {boolean}
     */
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
