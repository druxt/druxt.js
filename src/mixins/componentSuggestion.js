/**
 * Provides a mechanism for rendering custom Vue.js components for targetted theming.
 *
 * Suggestion rules are configurable via:
 * - Global suggestions in the `nuxt.config.js` file.
 * - Component specific suggestions in the relevant Vue.js file.
 *
 * @mixin
 * @deprecated
 *
 * @example @lang js
 * // nuxt.config.js
 * module.exports = {
 *   druxt: {
 *     entity: {
 *       suggestions: [{
 *         type: 'example',
 *         // Suggest 'ExampleHome' if route matches the homepath.
 *         value: ctx => ctx.route.isHomePath ? 'ExampleHome' : false
 *       }]
 *     }
 *   }
 * }
 *
 * @example @lang vue
 * // ExampleComponent.vue
 * <template>
 *   <!-- Render the suggested component. -->
 *   <component :is="component">
 *     <!-- -->
 *   </component>
 * </template>
 *
 * <script>
 * // Import mixin.
 * import { DruxtEntityComponentSuggestionMixin } from 'druxt-entity'
 *
 * export default {
 *   // Register mixin.
 *   mixins: [DruxtEntityComponentSuggestionMixin],
 *
 *   data: () => ({ value: 'Test' }),
 *
 *   computed: {
 *     suggestionDefaults() {
 *       return [{
 *         // e.g. ExampleTest
 *         value: `Example${this.value}`
 *       }]
 *     },
 *
 *     // Overridden token type to specify applicable rules.
 *     tokenType: () => 'example',
 *   }
 * }
 * </script>
 *
 * @todo Move DruxtEntityComponentSuggestionMixin to a common module.
 */
const DruxtEntityComponentSuggestionMixin = {
  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * The suggested component to be rendered.
     *
     * Returns the first item of the Suggested components array that has a
     * registered Vue.js component.
     *
     * @type string
     * @default div
     */
    component() {
      for (const suggestion of this.suggestions) {
        if (typeof this.$options.components[suggestion] !== 'undefined') {
          return suggestion
        }
      }

      return 'div'
    },

    /**
     * Suggested components.
     *
     * Contains an Array of possible Component names calculated by the
     * Suggestion Rules and Token context.
     *
     * @type {string[]}.
     */
    suggestions() {
      const suggestions = []

      for (const rule of this.suggestionRules) {
        switch (typeof rule.value) {
          case 'function':
            const result = rule.value(this.tokenContext)
            if (result) {
              suggestions.push(result)
            }
            break

          case 'string':
            suggestions.push(rule.value)
            break
        }
      }

      return suggestions
    },

    /**
     * Suggestion rules.
     *
     * Contains all suggestion rules, combined from the Global options and
     * Component rules.
     *
     * @type {object[]}
     */
    suggestionRules() {
      const rules = []

      // Add druxt.entity.suggestions configuration rules.
      if (this.$druxtEntity && Array.isArray(this.$druxtEntity.options.entity.suggestions)) {
        this.$druxtEntity.options.entity.suggestions.map(item => {
          if (item.type === this.tokenType) {
            rules.push(item)
          }
        })
      }

      // Add component default rules.
      if (typeof this.suggestionDefaults !== 'undefined') {
        this.suggestionDefaults.map(item => { rules.push(item) })
      }

      return rules
    },

    /**
     * Data to be used for calculating the component suggestions:
     * - route: The DruxtJS Router route object.
     * - tokens: `this.tokens`
     * - `...this.props`
     *
     * @type {object}
     */
    tokenContext() {
      return {
        route: this.$store.state.druxtRouter.route,
        tokens: this.tokens,
        ...this.props
      }
    },

    /**
     * Default token type.
     *
     * @default false
     */
    tokenType: () => false
  },

  /**
   * Vue.js methods.
   */
  methods: {
    /**
     * Transforms the input string into Component Suggestion compatible format.
     * @param {string} string - The raw string.
     * @kind method
     * @return {string} The transformed string.
     */
    suggest: (string) => typeof string === 'string'
      ? string.replace(/((\b|[^a-zA-Z0-9]+)[a-zA-Z0-9])/gi, (match, p1, p2) => match.toUpperCase().replace(p2, ''))
      : false
  }
}

export { DruxtEntityComponentSuggestionMixin }
