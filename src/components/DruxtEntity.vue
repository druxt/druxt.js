<script>
import merge from 'deepmerge'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtModule } from 'druxt'
import { mapActions } from 'vuex'

/**
 * The `<DruxtEntity />` Vue.js component.
 *
 * - Loads a Drupal Entity JSON:API resource from the DruxtJS Router.
 * - Loads the DruxtJS Schema for the Drupal display mode.
 * - Renders Field data via the `<DruxtField />` component.
 * - Supports Component Suggestion based theming with Vue.js Slots.
 *
 * @example @lang vue
 * <!-- Render the specified Aritcle node with with Teaser display mode. -->
 * <DruxtEntity type="node--article" :uuid="uuid" :mode="teaser" />
 */
export default {
  name: 'DruxtEntity',

  extends: DruxtModule,

  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The Drupal display mode.
     *
     * @type {string}
     * @default default
     */
    mode: {
      type: String,
      default: 'default'
    },

    /**
     * The JSON:API resource type.
     *
     * @type {string}
     */
    type: {
      type: String,
      required: true
    },

    /**
     * The Drupal entity UUID.
     *
     * @type {string}
     */
    uuid: {
      type: String,
      required: true
    },
  },

  /**
   * Nuxt.js fetch method.
   */
  async fetch() {
    // Fetch Schema.
    this.schema = await this.getSchema({ resourceType: this.type, mode: this.mode })

    // Build wrapper component object.
    const options = this.getModuleComponents()
    let component = {
      is: (((options.filter(o => o.global) || [])[0] || {}).name || 'DruxtWrapper'),
      options: options.map(o => o.name) || [],
    }

    // Get wrapper component data to merge with module settings.
    const wrapperData = await this.getWrapperData(component.is)
    component.settings = merge((this.$druxtEntity || {}).options || {}, wrapperData.druxt || {}, { arrayMerge: (dest, src) => src })

    // Fetch Entity resource.
    const query = this.getQuery(component.settings)
    this.entity = (await this.getResource({ type: this.type, id: this.uuid, query })).data

    // Generate fields list.
    this.fields = this.getFields()

    // Build wrapper component propsData.
    component = { ...component, ...this.getModulePropsData(wrapperData.props) }

    // Set component data.
    this.component = component
  },

  data: () => ({
    fields: {}
  }),

  druxt: {
    componentOptions: ({ schema }) => ([
      [schema.resourceType, schema.config.mode],
      [schema.resourceType],
      [schema.config.mode],
    ]),

    propsData: ({ entity, fields, schema }) => ({ entity, fields, schema }),
  },

  methods: {
    /**
     * Get Entity fields per Schema.
     *
     * @return {object}
     */
    getFields() {
      if (!this.entity || !this.schema) return false

      const data = {
        ...(this.entity.attributes || {}),
        ...(this.entity.relationships || {})
      }

      const fields = {}
      for (const field of this.schema.fields) {
        // Filter out empty fields.
        if (this.isEmpty(data[field.id])) continue

        fields[field.id] = {
          id: field.id,
          data: data[field.id],
          schema: field,
          relationship: !!(this.entity.relationships || {})[field.id]
        }
      }

      return fields
    },

    /**
     * Get Entity query object.
     *
     * @param {object} settings - The merged module and component settings object.
     *
     * @return {object}
     */
    getQuery(settings) {
      const query = new DrupalJsonApiParams()

      // Build fields list.
      const fields = (settings.query || {}).schema
        ? [...this.schema.fields.map((o) => o.id), ...((settings.query || {}).fields || [])]
        : ((settings.query || {}).fields || [])
      if (fields.length) {
        query.addFields(this.type, fields)
        return query
      }
      return false
    },

    /**
     * Get scoped slots for each Entity field.
     *
     * @return {object}
     */
    getScopedSlots() {
      // Build scoped slots for each field.
      const scopedSlots = {}
      Object.entries(this.fields).map(([id, field]) => {
        scopedSlots[id] = attrs => this.$createElement('DruxtField', { attrs, props: field })
      })

      // Build default slot.
      scopedSlots.default = attrs => Object.entries(this.fields).map(([id]) => scopedSlots[id](attrs))

      return scopedSlots
    },

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
    },

    /**
     * Maps Vuex action to methods.
     */
    ...mapActions({
      getResource: 'druxt/getResource',
      getSchema: 'druxtSchema/get'
    })
  },
}
</script>
