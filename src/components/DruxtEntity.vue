<script>
import merge from 'deepmerge'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtModule } from 'druxt'
import { mapActions } from 'vuex'

/**
 * The `<DruxtEntity />` component fetches the Entity JSON:API resource and
 * schema data to render the Entities fields based on the Drupal Display
 * Mode configuration.
 * 
 * Features:
 * - Display mode based field system
 * - Scoped slots
 * - Query settings
 *
 * @example @lang vue
 * <DruxtEntity
 *   type="node--article"
 *   :uuid="uuid"
 *   mode="teaser"
 * />
 */
export default {
  name: 'DruxtEntity',

  extends: DruxtModule,

  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * Drupal display mode.
     *
     * @type {string}
     * @default default
     */
    mode: {
      type: String,
      default: 'default'
    },

    /**
     * JSON:API resource type.
     *
     * @type {string}
     */
    type: {
      type: String,
      required: true
    },

    /**
     * Entity UUID.
     *
     * @type {string}
     */
    uuid: {
      type: [Boolean, String],
      default: false
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
     * The Entity value.
     * 
     * @type {object}
     * @model
     */
    value: {
      type: Object,
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
    if (this.uuid && !this.value) {
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

  fetchKey(getCounter) {
    const parts = ['DruxtEntity', this.type, this.uuid, this.mode, this.schemaType].filter((o) => o)
    return [...parts, getCounter(parts.join(':'))].join(':')
  },

  /**
   * Vue.js Data object.
   *
   * @property {object} entity - The Entity object.
   * @property {object} model - The model object.
   * @property {object} schema - The DruxtSchema object.
   */
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

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * Entity fields based on Display mode.
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
     * Builds the query for the JSON:API request.
     *
     * @param {ModuleSettings} settings - The merged module and component settings object.
     *
     * @return {boolean|object}
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
     * Provides the scoped slots object for the Module render function.
     *
     * A scoped slot is provided for each field being rendered, as per the
     * current display mode.
     * 
     * Additionally, the `default` slot will render all fields as per the
     *
     * @example <caption>DruxtEntity**ResourceType**.vue</caption> @lang vue
     * <template>
     *   <div>
     *     <slot name="content" />
     *     <slot :name="field_name" />
     *   </div>
     * </template>
     *
     * @return {ScopedSlots} The Scoped slots object.
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

  /**
   * Druxt module configuration.
   */
  druxt: {
    /**
     * Provides the available component naming options for the Druxt Wrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ schema }) => ([
      [schema.resourceType, schema.config.mode, schema.config.schemaType],
      [schema.config.mode],
    ]),

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ entity, fields, model, schema }) => ({ entity, fields, schema, value: model }),
  },
}

/**
 * Provides the available naming options for the Wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtEntity[ResourceType][DisplayMode][SchemaType]',
 *   'DruxtEntity[ResourceType][DisplayMode]',
 *   'DruxtEntity[ResourceType]',
 *   'DruxtEntity[DisplayMode]',
 * ]
 *
 * @example <caption>Article Node (default)</caption> @lang js
 * [
 *   'DruxtEntityNodeArticleDefaultView',
 *   'DruxtEntityNodeArticleDefault',
 *   'DruxtEntityNodeArticle',
 *   'DruxtEntityNodeDefault',
 * ]
 */

/**
 * Provides settings for the Entity module, via the `nuxt.config.js` `druxt.entity`
 * or the Wrapper component `druxt` object.
 *
 * @typedef {object} ModuleSettings
 * @param {string[]} fields - An array of fields to filter from the JSON:API Resource.
 * @param {boolean} schema - Whether to automatically detect fields to filter, per the Display mode.
 *
 * @example @lang js
 * {
 *   fields: [],
 *   schema: false,
 * }
 *
 * @example @lang vue
 * <script>
 * export default {
 *   druxt: {
 *     query: {
 *       fields: ['title']
 *       schema: true,
 *     },
 *   }
 * }
 */

/**
 * Provides propsData for use in the Wrapper component.
 *
 * @typedef {object} PropsData
 * @param {object} entity - The Drupal Entity JSON:API resource data.
 * @param {object} fields - Drupal Entity Fields data.
 * @param {object} schema - DruxtJS Schema object.
 * @param {object} value - The Entity value.
 *
 * @example @lang js
 * {
 *   entity: {
 *     attributes: {},
 *     id: '43118086-cca5-4c62-b11e-f1d870050ebd',
 *     links: {},
 *     relationships: {},
 *     type: 'node--article',
 *   },
 *   fields: {
 *     body: {},
 *     field_media_image: {},
 *     field_tags: {},
 *   },
 *   schema: {
 *     config: {},
 *     fields: {},
 *     groups: {},
 *     id: 'node--article--default--view',
 *     resourceType: 'node--article',
 *   },
 *   value: {},
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} * - Slot per field.
 * @param {function} default - All fields per Display mode.
 *
 * @example <caption>DruxtEntity**ResourceType**.vue</caption> @lang vue
 * <template>
 *   <div>
 *     <slot name="content" />
 *     <slot :name="field_name" />
 *   </div>
 * </template>
 */
</script>
