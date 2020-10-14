import { DruxtEntityContextMixin } from './context'

/**
 * Provides Vue.js properties to render a Drupal Entity JSON:API resource component.
 *
 * This Mixin is intended for use by `entity` type Component Suggestions for
 * targetted theming of Drupal Entity JSON:API resources.
 *
 * @mixin
 *
 * @example @lang vue
 * <template>
 *   <div :classes="classes">
 *     <!-- Render a `druxt-field` component for all renderable fields. -->
 *     <druxt-field
 *       v-for="(field, key) of fields"
 *       :key="key"
 *       :v-bind="field"
 *     />
 *   </div>
 * </template>
 *
* <script>
 * // Import mixin.
 * import { DruxtEntityMixin } from 'druxt-entity'
 *
 * export default {
 *   // Register mixin.
 *   mixins: [DruxtEntityMixin],
 * }
 * </script>
 *
 * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
 */
const DruxtEntityMixin = {
  /**
   * Vue.js mixins.
   * @see {@link context|DruxtEntityContextMixin}
   */
  mixins: [DruxtEntityContextMixin],

  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The Drupal Entity JSON:API resource data.
     * @type {object}
     */
    entity: {
      type: Object,
      require: true,
    },

    /**
     * Drupal Entity Fields data.
     * @type {object}
     */
    fields: {
      type: Object,
      required: true,
    },

    /**
     * DruxtJS Schema object.
     * @type {object}}
     */
    schema: {
      type: Object,
      required: true,
    }
  },

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * Array of CSS classes.
     * @type {string[]}
     */
    classes() {
      const classes = []

      classes.push(this.schema.id)
      classes.push(this.schema.resourceType)
      classes.push(this.schema.config.entityType)
      classes.push(this.schema.config.bundle)
      classes.push(this.schema.config.mode)
      classes.push(this.schema.config.schemaType)

      return classes.join(' ')
    }
  }
}

export { DruxtEntityMixin }
