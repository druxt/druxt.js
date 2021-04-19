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
      type: [Boolean, String],
      default: false
    },

    /**
     * The Drupal display schema type, 'view' or 'form'.
     * 
     * @type {string}
     */
    schemaType: {
      type: String,
      default: undefined,
    },
  },

  /**
   * Nuxt.js fetch method.
   */
  async fetch() {
    // Fetch Schema.
    this.schema = await this.getSchema({
      resourceType: this.type,
      mode: this.mode,
      schemaType: this.schemaType || 'view',
    })

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
    if (this.uuid) {
      const query = this.getQuery(component.settings)
      // @todo - Don't set data, mapState to vuex.
      this.entity = (await this.getResource({ type: this.type, id: this.uuid, query })).data
      this.model = JSON.parse(JSON.stringify(this.entity || {}))
    }

    // Build wrapper component propsData.
    component = { ...component, ...this.getModulePropsData(wrapperData.props) }

    // Set component data.
    this.component = component
  },

  data: ({ type, value }) => ({
    entity: {
      attributes: {},
      relationships: {},
      type,
      ...value,
    },
    model: {
      attributes: {},
      relationships: {},
      type,
      ...value,
    },
    schema: null,
  }),

  computed: {
    /**
     * Get Entity fields per Schema.
     *
     * @return {object}
     */
    fields() {
      if (!this.schema) return false

      const data = {
        ...(this.model.attributes || {}),
        ...(this.model.relationships || {})
      }

      const fields = {}
      for (const field of this.schema.fields) {
        // Filter out empty fields if not using the Form schema type.
        // @todo - Make this configurable?
        if (this.schemaType !== 'form' && this.isEmpty(data[field.id])) continue

        fields[field.id] = {
          id: field.id,
          // @todo - Remove deprecated 'data'.
          data: data[field.id],
          errors: (this.errors || []).filter((o) => ((o.source || {}).pointer || '').startsWith(`/data/attributes/${field.id}`)),
          relationship: !!((field.settings || {}).storage || {}).target_type || !!(this.model.relationships || {})[field.id],
          schema: {
            config: this.schema.config,
            ...field,
          },
          value: data[field.id],
        }
      }

      return fields
    },
  },

  methods: {
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
        scopedSlots[id] = (attrs) => this.$createElement('DruxtField', {
          attrs,
          key: id,
          props: field,
          on: {
            input: (value) => {
              const type = !field.relationship ? 'attributes' : 'relationships'
              this.model[type][id] = value
              this.$emit('input', this.model)
            }
          },
          ref: id,
        })
      })

      // Build default slot.
      scopedSlots.default = (attrs) => Object.entries(this.fields).map(([id]) => scopedSlots[id](attrs))

      return scopedSlots
    },

    /**
     * Checks if an Entity field is empty.
     *
     * @deprecated
     * @private
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

  druxt: {
    componentOptions: ({ schema }) => ([
      [schema.resourceType, schema.config.mode, schema.config.schemaType],
      [schema.config.mode],
    ]),

    propsData: ({ entity, fields, model, schema }) => ({ entity, fields, schema, value: model }),
  },
}
</script>
