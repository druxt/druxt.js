import { mapActions } from 'vuex'

/**
 * Lazy loads a schema into the Vuex State object.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * // Import mixin.
 * import { DruxtSchemaMixin } from 'druxt-schema'
 *
 * export default {
 *   name: 'CustomComponent',
 *
 *   // Register mixin.
 *   mixins: [DruxtSchemaMixin],
 * }
 * </script>
 *
 * @example @lang vue
 * <!-- Render component with lazy loaded Default View mode Page schema. -->
 * <CustomComponent type="node--page" mode="default" />
 *
 * TODO: Add schemaType property to Mixin.
 */
const DruxtSchemaMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The Drupal Display mode.
     * @type {string}
     * @default default
     */
    mode: {
      type: String,
      default: 'default'
    },

    /**
     * The JSON:API Resource type.
     * @type {string}
     */
    type: {
      type: String,
      required: true
    }
  },

  /**
   * Loads the Schema from the Vuex store.
   */
  async fetch() {
    this.schema = await this.getSchema({ resourceType: this.type, mode: this.mode })
  },

  /**
   * Vue.js Data object.
   *
   * @property {object} schema - The Drupal Schema data.
   */
  data: () => ({
    schema: false
  }),

  /**
   * Vue.js methods.
   */
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
