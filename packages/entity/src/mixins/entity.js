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
  mixins: [DruxtEntityContextMixin],

  /** */
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
      type: [Object, Boolean],
      default: undefined,
    },

    /**
     * The JSON:API resource language code.
     *
     * @type {string}
     */
    langcode: {
      type: String,
      default: undefined,
    },

    /**
     * DruxtJS Schema object.
     * @type {object}}
     */
    schema: {
      type: Object,
      default: undefined,
    },

    /**
     * The Entity value.
     */
     value: {
      type: Object,
      default: undefined,
    },
  },

  /**
   * @property {object} model - The model object.
   */
  data: ({ value }) => ({
    model: value,
  }),

  /** */
  computed: {
    /**
     * Array of CSS classes.
     * @type {string[]}
     */
    classes: ({ schema }) => schema && [
      schema.id,
      schema.resourceType,
      schema.config.entityType,
      schema.config.bundle,
      schema.config.mode,
      schema.config.schemaType,
    ].join(' '),
  }
}

export { DruxtEntityMixin }
