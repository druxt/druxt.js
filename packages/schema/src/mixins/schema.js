import { mapActions } from 'vuex'

/**
 * Lazy loads a schema into the Vuex State object.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * import { DruxtSchemaMixin } from 'druxt-schema'
 * export default {
 *   mixins: [DruxtSchemaMixin],
 * }
 * </script>
 */
const DruxtSchemaMixin = {
  /** */
  props: {
    /**
     * The Drupal Display mode.
     *
     * @type {string}
     * @default default
     */
    mode: {
      type: String,
      default: 'default'
    },

    /**
     * Drupal display schema type, 'view' or 'form'.
     *
     * @type {('view'|'form')}
     */
     schemaType: {
      type: String,
      default: undefined,
    },

    /**
     * The JSON:API Resource type.
     *
     * @type {string}
     */
    type: {
      type: String,
      required: true
    },
  },

  /**
   * Loads the Schema from the Vuex store.
   */
  async fetch() {
    this.schema = await this.getSchema({
      resourceType: this.type,
      mode: this.mode,
      schemaType: this.schemaType || 'view'
    })
  },

  /**
   * @property {object} schema - The Drupal Schema data.
   */
  data: () => ({
    schema: false
  }),

  /** */
  methods: {
    /**
     * Maps `druxtSchema/get` Vuex action to `this.getSchema`.
     *
     * @name getSchema
     * @method
     */
    ...mapActions({
      getSchema: 'druxtSchema/get'
    })
  }
}

export { DruxtSchemaMixin }
