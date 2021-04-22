import { DruxtEntityContextMixin } from './context'

/**
 * Provides Vue.js properties to render a DruxtEntity or DruxtEntityForm Wrapper component.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * import { DruxtEntityMixin } from 'druxt-entity'
 *
 * export default {
 *   mixins: [DruxtEntityMixin],
 * }
 * </script>
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
    },

    /**
     * The Entity value.
     */
     value: {
      type: Object,
      default: undefined,
    },
  },

  data: ({ value }) => ({
    model: value,
  }),

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
