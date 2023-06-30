<script>
import merge from 'deepmerge'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import DruxtDebug from 'druxt/dist/components/DruxtDebug.vue'
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import { mapActions } from 'vuex'

/**
 * The DruxtEntity component renders a Drupal Content Entity by JSON:API
 * resource type, UUID, view mode and schema type.
 *
 * Fields are rendered as DruxtField components, based on the Drupal display
 * mode configuration.
 *
 * @example @lang vue
 * <DruxtEntity
 *   type="node--article"
 *   :uuid="uuid"
 *   mode="teaser"
 * />
 *
 * @example <caption>DruxtEntity Wrapper component boilerplate</caption> @lang vue
 * <template>
 *   <DruxtDebug :json="entity" />
 * </template>
 *
 * <script>
 * import { DruxtEntityMixin } from 'druxt-entity'
 * export default {
 *   mixins: [DruxtEntityMixin]
 * }
 *
 * @example <caption>DruxtEntity with template injection</caption> @lang vue
 * <DruxtEntity type="" uuid="">
 *   <template #default="{ entity }">
 *     <!-- Do whatever you want here -->
 *     <DruxtDebug :json="entity" />
 *   </template>
 * </DruxtEntity>
 */
export default {
  name: 'DruxtEntity',

  components: { DruxtDebug },

  extends: DruxtModule,

  /** */
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
     * Module settings object.
     *
     * @type {ModuleSettings}
     * @default {}
     */
    settings: {
      type: Object,
      default: () => ({}),
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
  },

  /**
   * @property {object} model - The model object.
   * @property {object} schema - The DruxtSchema object.
   */
  data: ({ type, value }) => ({
    model: {
      attributes: {},
      relationships: {},
      included: undefined,
      type,
      ...value,
    },
    schema: null,
  }),

  fetchKey(getCounter) {
    const parts = ['DruxtEntity', this.type, this.uuid, this.mode, this.schemaType].filter((o) => o)
    return [...parts, getCounter(parts.join(':'))].join(':')
  },

  /** */
  computed: {
    /**
     * The Entity object.
     *
     * @return {object}.
     */
    entity: ({ model }) => ({ ...model }),

    /**
     * Entity fields based on Display mode.
     *
     * @return {object}
     */
    fields: ({ errors, isEmpty, lang, model, schema, schemaType }) => {
      if (!schema) return false

      const fields = {}
      for (const field of schema.fields || []) {
        const relationship = !!((field.settings || {}).storage || {}).target_type || !!(model.relationships || {})[field.id]
        const value = relationship ? ((model || {}).relationships || {})[field.id] : ((model || {}).attributes || {})[field.id]

        // Filter out empty fields if not using the Form schema type.
        // @todo - Make this configurable?
        if (schemaType !== 'form' && isEmpty(value)) continue

        fields[field.id] = {
          id: field.id,
          // @todo - Remove deprecated 'data'.
          data: value,
          errors: (errors || []).filter((o) => ((o.source || {}).pointer || '').startsWith(`/data/attributes/${field.id}`)),
          langcode: lang,
          relationship,
          schema: {
            config: schema.config,
            ...field,
          },
          value,
        }
      }

      return fields
    },
  },

  watch: {
    mode() {
      this.$fetch()
    },

    settings() {
      this.$fetch()
    },

    schemaType() {
      this.$fetch()
    },

    type() {
      this.$fetch()
    },

    uuid() {
      this.$fetch()
    },
  },

  mounted() {
    // If static, re-fetch data allowing for cache-bypass.
    // @TODO - Don't re-fetch in serverless configuration.
    if (this.$store.app.context.isStatic) {
      this.$fetch()
    }
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

      // Add includes.
      if (settings.query.include && Array.isArray(settings.query.include)) {
        query.addInclude(settings.query.include)
      }

      let rootFields = []
      if (settings.query.fields && Array.isArray(settings.query.fields)) {
        // If the first item is a string, this is a root level filter array.
        if (settings.query.fields.length === 0 || typeof settings.query.fields[0] === 'string' || typeof settings.query.fields[0] === 'undefined') {
          rootFields = settings.query.fields
        // Otherwise this is an array structure field map.
        } else if (Array.isArray(settings.query.fields[0])) {
          rootFields = settings.query.fields.find((a) => a.length === 0 || typeof [...a].pop() === 'string' || typeof [...a].pop() === 'undefined') || []

          // Apply included field mapping.
          const fieldMaps = settings.query.fields.filter(
            (a) => a.length == 2 && typeof a[0] === 'string' && Array.isArray(a[1])
          )
          for (const fieldMap of fieldMaps) {
            query.addFields(fieldMap[0], fieldMap[1])
          }
        }
      }

      // If Schema mode, generate list including schema fields and explicitly
      // defined fields.
      if (settings.query.schema) {
        rootFields = [...((this.schema || {}).fields || []).map((o) => o.id), ...rootFields]
      }

      // Apply root fields filter.
      if (rootFields.length) {
        query.addFields(this.type, rootFields)
      }

      return query
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

  /** DruxtModule settings */
  druxt: {
    /**
     * Provides the available component naming options for the Druxt Wrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ mode, schema, schemaType, type }) => ([
      // DruxtEntity[ResourceType][ViewMode][SchemaType]
      [
        (schema || {}).resourceType || type,
        ((schema || {}).config || {}).mode || mode,
        ((schema || {}).config || {}).schemaType || schemaType || 'view'
      ],

      // DruxtEntity[EntityType][ViewMode][SchemaType]
      [
        (((schema || {}).resourceType || type) || '').split('--').shift(),
        ((schema || {}).config || {}).mode || mode,
        ((schema || {}).config || {}).schemaType || schemaType || 'view'
      ],

      // DruxtEntity[ViewMode]
      [
        ((schema || {}).config || {}).mode || mode,
      ],
    ]),

    /**
     * Fetches the Druxt schema object.
     */
    async fetchConfig() {
      try {
        this.schema = await this.getSchema({
          resourceType: this.type,
          mode: this.mode,
          schemaType: this.schemaType || 'view',
        })
      } catch(e) {
        // TODO: Handle error
      }
    },

    /**
     * Fetches the content entity JSON:API resource.
     */
    async fetchData(settings) {
      if (!this.type) return

      if ((this.schemaType || 'view') === 'view' && !this.uuid && !this.value) {
        throw new Error('Missing required props: uuid.')
      }

      if (this.uuid && !this.value) {
        // Check if we need to bypass cache.
        let bypassCache = false
        if (typeof (settings.query || {}).bypassCache === 'boolean') {
          bypassCache = settings.query.bypassCache
        }

        // Build query.
        const query = this.getQuery(settings)

        // Execute the resquest.
        const resource = await this.getResource({
          id: this.uuid,
          prefix: this.lang,
          type: this.type,
          query,
          bypassCache
        })
        const entity = { ...(resource.data || {}) }
        entity.included = resource.included
        this.model = JSON.parse(JSON.stringify(entity || {}))
      }
    },

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ fields, model, schema }) => ({ entity: model, fields, schema, value: model }),

    /**
     * Component settings.
     */
    settings: (context, wrapperSettings) => {
      const { $druxt, settings } = context

      // Start with the `nuxt.config.js` `druxt.settings.entity` settings and
      // merge the Wrapper component settings on top.
      let mergedSettings = merge(($druxt.settings || {}).entity || {}, wrapperSettings || {}, { arrayMerge: (dest, src) => src })
      // Merge the DruxtEntity component `settings` property on top.
      mergedSettings = merge(mergedSettings || {}, settings || {}, { arrayMerge: (dest, src) => src })

      // Evaluate the bypass cache function.
      if (typeof (mergedSettings.query || {}).bypassCache === 'function') {
        mergedSettings.query.bypassCache = !!mergedSettings.query.bypassCache(context)
      }

      // Currently only returning the query settings.
      return {
        query: mergedSettings.query || {},
      }
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
    slots(h) {
      const scopedSlots = {}

      if (!this.schema) {
        const summary = `Missing display settings for resource type: '${this.type}--${this.mode}'`
        const description = [
          h('p', 'Create a Druxt theme component to render the entity.'),
        ]

        scopedSlots.debug = () => h('DruxtDebug',
          { props: { summary } },
          [
            h('div', description),
            !!this.component.options.length && h('DruxtDevelTemplate', { props: { options: this.component.options }}),
            h('details', [h('summary', 'JSON:API resource'), h('pre', [h('code', [JSON.stringify(this.model, null, '  ')])])])
          ]
        )
        return scopedSlots
      }

      // Build scoped slots for each field.
      Object.entries(this.fields).map(([id, field]) => {
        scopedSlots[id] = (attrs) => h('DruxtField', {
          attrs,
          key: id,
          props: field,
          on: {
            input: (value) => {
              const type = !field.relationship ? 'attributes' : 'relationships'
              if (value) {
                this.model[type][id] = value
              }
              else if (this.model[type][id]) {
                delete this.model[type][id]
              }
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
     * Druxt development template tool configuration.
     */
    template: {
      debug: '{ entity, schema }',
      mixins: {
        'DruxtEntityMixin': 'druxt-entity'
      },
      druxt: {
        'query.//fields': ['name', 'path', 'title'],
        'query.//include': [],
        'query.//schema': true
      }
    }
  }
}

/**
 * Provides the available naming options for the Wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtEntity[ResourceType][DisplayMode][SchemaType][Langcode]',
 *   'DruxtEntity[ResourceType][DisplayMode][SchemaType]',
 *   'DruxtEntity[EntityType][DisplayMode][SchemaType][Langcode]',
 *   'DruxtEntity[EntityType][DisplayMode][SchemaType]',
 *   'DruxtEntity[ResourceType][DisplayMode][Langcode]',
 *   'DruxtEntity[ResourceType][DisplayMode]',
 *   'DruxtEntity[EntityType][DisplayMode][Langcode]',
 *   'DruxtEntity[EntityType][DisplayMode]',
 *   'DruxtEntity[ResourceType][Langcode]',
 *   'DruxtEntity[ResourceType]',
 *   'DruxtEntity[EntityType][Langcode]',
 *   'DruxtEntity[EntityType]',
 *   'DruxtEntity[DisplayMode][Langcode]',
 *   'DruxtEntity[DisplayMode]',
 * ]
 *
 * @example <caption>Article Node (default)</caption> @lang js
 * [
 *   'DruxtEntityNodeArticleDefaultViewEn',
 *   'DruxtEntityNodeArticleDefaultView',
 *   'DruxtEntityNodeDefaultViewEn',
 *   'DruxtEntityNodeDefaultView',
 *   'DruxtEntityNodeArticleDefaultEn',
 *   'DruxtEntityNodeArticleDefault',
 *   'DruxtEntityNodeDefaultEn',
 *   'DruxtEntityNodeDefault',
 *   'DruxtEntityNodeArticleEn',
 *   'DruxtEntityNodeArticle',
 *   'DruxtEntityNodeEn',
 *   'DruxtEntityNode',
 *   'DruxtEntityDefaultEn',
 *   'DruxtEntityDefault',
 * ]
 */

/**
 * Provides settings for the Entity module, via the `nuxt.config.js` `druxt.entity`,
 * the Wrapper component `druxt` object or the DruxtEntity component `settings`
 * property.
 *
 * @typedef {object} ModuleSettings
 * @param {object} query - Entity Query settings:
 * @param {(string[]|array[])} query.fields - An array or arrays of fields to filter from the JSON:API Resources.
 * @param {string[]} query.include - An array of relationships to include alongside the JSON:API Resource.
 * @param {boolean} query.schema - Whether to automatically detect fields to filter, per the Display mode.
 *
 * @example <caption>DruxtEntity Wrapper component</caption> @lang vue
 * <script>
 * export default {
 *   druxt: {
 *     query: {
 *       fields: [['title'], ['user--user', ['display_name']]],
 *       include: ['uid']
 *       schema: true,
 *     },
 *   }
 * }
 *
 * @example <caption>DruxtEntity component with settings</caption> @lang vue
 * <template>
 *   <DruxtEntity
 *     type="node--article"
 *     :uuid="uuid"
 *     :settings="{
 *       query: {
 *         fields: [['title'], ['user--user', ['display_name']]],
 *         include: ['uid']
 *         schema: true,
 *       }
 *     }"
 *   />
 * </template>
 */

/**
 * Provides property data for use in the Wrapper component.
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
