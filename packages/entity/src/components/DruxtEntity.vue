<script>
import merge from 'deepmerge'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import DruxtDebug from 'druxt/dist/components/DruxtDebug.vue'
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import Vue from 'vue'
import { mapActions } from 'vuex'

/**
 * The JSON of entity data without its included resources, which is what an
 * edit is compared with.
 *
 * @param {object} data - The JSON:API resource data.
 * @return {string} The JSON.
 */
const pristineOf = (data) => {
  const rest = { ...(data || {}) }
  delete rest.included
  return JSON.stringify(rest)
}

/**
 * The JSON of what the relationships of entity data link to, which is what
 * included resources belong to.
 *
 * @param {object} data - The JSON:API resource data.
 * @return {string} The JSON.
 */
const linkageOf = (data) => {
  const relationships = (data || {}).relationships || {}
  return JSON.stringify(Object.keys(relationships).sort().map((key) => [
    key,
    [].concat((relationships[key] || {}).data || []).map((o) => [o.type, o.id]),
  ]))
}

/**
 * The DruxtEntity component renders a Drupal Content Entity by JSON:API
 * resource type, UUID, view mode and schema type.
 *
 * Fields are rendered as DruxtField components, based on the Drupal display
 * mode configuration.
 *
 * @see https://druxtjs.org/modules/entity
 *
 * @example @lang vue
 * <DruxtEntity
 *   type="node--article"
 *   :uuid="uuid"
 *   mode="teaser"
 * />
 *
 * @example <caption>DruxtEntity with v-model</caption> @lang vue
 * <template>
 *   <DruxtEntity v-model="model" type="node--article" :uuid="uuid" />
 * </template>
 *
 * <script>
 * export default {
 *   data: () => ({ model: undefined }),
 * }
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
 * @see {@link https://druxtjs.org/explanation/component-resolution|Component resolution}
 *
 * @example <caption>DruxtEntity default slot (template injection)</caption> @lang vue
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
     * @type {(boolean|string)}
     * @default false
     */
    uuid: {
      type: [Boolean, String],
      default: false
    },
  },

  /**
   * Provides the reactive entity model and display schema state.
   *
   * @param {object} vm - The component ViewModel.
   * @param {string} vm.type - The JSON:API resource type.
   * @param {object} vm.value - The Vue.js v-model value. If set, it provides the entity data directly and the JSON:API fetch is skipped.
   * @property {object} model - The model object.
   * @property {object} schema - The DruxtSchema object.
   * @property {string} schemaError - Why the schema couldn't be loaded, when the display exists but loading it failed.
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
    schemaError: undefined,
  }),

  fetchKey(getCounter) {
    const parts = ['DruxtEntity', this.type, this.uuid, this.mode, this.schemaType].filter((o) => o)
    return [...parts, getCounter(parts.join(':'))].join(':')
  },

  /** */
  computed: {
    /**
     * Whether the model holds edits that aren't saved.
     *
     * The model is compared with the copy last taken from the store, a fetch or
     * a save, so an assignment equal to that copy isn't an edit. A component
     * whose parent passes `value` holds its parent's data and is never dirty.
     *
     * @return {boolean} `true` when the model differs from the copy last taken.
     */
    dirty() {
      return this.hasEdits()
    },

    /**
     * The Entity object.
     *
     * @param {object} vm - The component ViewModel.
     * @param {object} vm.model - The model object.
     * @param {object} vm.storedEntity - The entity's resource in the store.
     * @param {object} vm.value - The Vue.js v-model value.
     * @return {object} A copy of the stored entity, with the model's included resource data, or a copy of the model when nothing is stored or the parent passes `value`.
     */
    entity: ({ model, storedEntity, value }) => {
      if ((value !== undefined && value !== null) || !storedEntity) return { ...model }
      const entity = JSON.parse(JSON.stringify(storedEntity))
      if ((model || {}).included !== undefined) entity.included = model.included
      return entity
    },

    /**
     * Entity fields based on Display mode.
     *
     * @param {object} vm - The component ViewModel.
     * @param {object[]} vm.errors - Form submission response errors, if any.
     * @param {Function} vm.isEmpty - Checks if an Entity field is empty.
     * @param {string} vm.lang - The current language code.
     * @param {object} vm.model - The model object.
     * @param {object} vm.schema - The DruxtSchema object.
     * @param {('view'|'form')} vm.schemaType - Drupal display schema type, 'view' or 'form'.
     * @return {object} Field objects keyed by field ID, each containing the field's schema, value, errors and relationship status.
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

    /**
     * The entity's resource data in the store, under the entity's language.
     *
     * @param {object} vm - The component ViewModel.
     * @param {object} vm.$store - The Vuex store.
     * @param {string} vm.lang - The current language code.
     * @param {object} vm.model - The model object.
     * @param {string} vm.type - The JSON:API resource type.
     * @param {(boolean|string)} vm.uuid - The entity UUID.
     * @return {object} The stored JSON:API resource data, or `undefined`.
     * @private
     */
    storedEntity: ({ $store, lang, model, type, uuid }) => {
      const id = uuid || (model || {}).id
      if (!id) return undefined
      return ((((($store.state.druxt || {}).resources || {})[type] || {})[id] || {})[lang] || {}).data
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
      // Edits belong to one entity: another entity starts with none, in any
      // language. Dropped here, as the store may hand over the next entity
      // before the fetch runs.
      this._druxtDrafts = {}
      this.$fetch()
    },
  },

  created() {
    // Kept off the reactive data, so none of it reaches the page payload:
    // - the JSON of the copy edits are compared with, and the language it is in;
    // - the language the model is in, which a language change leaves behind
    //   until the next language loads;
    // - whether a copy has been taken yet, as the default language has no
    //   code to tell it from no language;
    // - each other language's unsaved edits;
    // - whether the fetch has asked once more after a flush, and whether
    //   Drupal refused the entity.
    this._druxtPristine = undefined
    // Counts the changes of that copy, so `dirty` is worked out again after one.
    this._druxtPristineVersion = Vue.observable({ value: 0 })
    this._druxtPristineLang = undefined
    this._druxtModelLang = undefined
    this._druxtLoaded = false
    this._druxtDrafts = {}
    this._druxtFetchedAgain = false
    this._druxtRefused = false
    // The entity, the language and the JSON of what a form's running save sent.
    this._druxtSaving = undefined

    // The watchers are for the browser. They leave a model the parent passes
    // alone, and take over when the parent stops passing one.
    if (this.$isServer) return

    // Follow the entity's resource in the store.
    this.$watch('storedEntity', (to, from) => {
      if (to === from) return
      // After a language switch the lang watcher fetches that translation.
      if (this._druxtLoaded && this._druxtPristineLang !== this.lang) return
      // Flushed: keep showing the copy and fetch again.
      if (!to) {
        if (from) this.fetchAgain()
        return
      }
      if (this.value !== undefined && this.value !== null) return
      // The store makes a new object for each write, so a write that changes
      // nothing, such as this entity's own fetch, leaves the model as it is.
      if (pristineOf(to) === this._druxtPristine) return
      // An edit of what a running save sent counts, even one back to the
      // value from before the save.
      if (this.hasEdits() || this.editedSinceSent()) return
      this.setModelFromStore({ ...to, included: (this.model || {}).included })
    })

    // An entity Drupal refused has nothing in the store to follow. A clear of
    // the whole store, as after a sign-in, is its cue to ask again.
    this.$watch(() => (this.$store.state.druxt || {}).resources, (to, from) => {
      if (to !== from && this._druxtRefused && !this.storedEntity) this.fetchAgain()
    })
  },

  beforeMount() {
    // A server-rendered entity doesn't fetch on the client: the model it was
    // hydrated with is the copy to compare edits with. Nuxt restores that
    // model in a created hook that runs after this component's own.
    if (this.$isServer || (this.value !== undefined && this.value !== null)) return
    if (typeof this._druxtPristine !== 'string' && (this.model || {}).id) {
      this.setPristine(this.model)
    }
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
     * Whether the model differs from what a form's running save sent, for
     * this entity in the model's language. Such an edit is unsaved even when
     * it matches the copy from before the save.
     *
     * @return {boolean} `true` when the model was edited since the save started.
     * @private
     */
    editedSinceSent() {
      const saving = this._druxtSaving
      if (!saving || saving.id !== (this.model || {}).id) return false
      // Not once the language has changed: the model is then put away, and
      // the next language's takes its place.
      if (saving.lang !== this._druxtModelLang || saving.lang !== this._druxtPristineLang) return false
      return pristineOf(this.model) !== saving.sent
    },

    /**
     * Fetches again once a running fetch settles, as after a flush. A running
     * fetch may have read the store before the flush emptied it.
     *
     * @return {Promise} The fetch.
     * @private
     */
    async fetchAgain() {
      // Only Nuxt's fetch can fetch again.
      if (typeof this.$fetch !== 'function') return
      if (this._fetchPromise) await this._fetchPromise
      return this.$fetch()
    },

    /**
     * Builds the query for the JSON:API request.
     *
     * @param {ModuleSettings} settings - The merged module and component settings object.
     *
     * @return {boolean|object} The DrupalJsonApiParams query object.
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
     * Whether the model differs from the copy last taken, read now rather
     * than from the cached `dirty`, which can't see that copy change.
     *
     * @return {boolean} `true` when the model holds unsaved edits.
     * @private
     */
    hasEdits() {
      // Read first, so `dirty` follows the copy as well as the model.
      const version = (this._druxtPristineVersion || {}).value
      if ((this.value !== undefined && this.value !== null) || typeof this._druxtPristine !== 'string') return false
      return version !== undefined && pristineOf(this.model) !== this._druxtPristine
    },

    /**
     * Checks if an Entity field is empty.
     *
     * @param {*} value - Field value.
     * @return {boolean} `true` if the field value is empty.
     */
    isEmpty(value) {
      if (typeof value === 'undefined') return true

      if (!value) return true

      if (Array.isArray(value.data) && !value.data.length) return true

      if (typeof value.data !== 'undefined' && !value.data) return true

      return false
    },

    /**
     * The JSON of entity data without its included resources, which is what
     * an edit is compared with.
     *
     * @param {object} data - The JSON:API resource data.
     * @return {string} The JSON.
     * @private
     */
    pristineOf(data) {
      return pristineOf(data)
    },

    /**
     * Sets the model to a copy of stored entity data, and makes that copy the
     * one edits are compared with.
     *
     * @param {object} data - The JSON:API resource data, with any included resource data.
     * @private
     */
    setModelFromStore(data) {
      this.setPristine(data)
      this.model = JSON.parse(JSON.stringify(data || {}))
    },

    /**
     * Keeps the JSON of the copy edits are compared with, on the instance and
     * outside `data`, so it stays out of the page payload.
     *
     * @param {object} data - The JSON:API resource data.
     * @param {string} [lang] - The language the data is in, when it isn't the component's.
     * @private
     */
    setPristine(data, lang = this.lang) {
      this._druxtPristine = pristineOf(data)
      this._druxtPristineVersion.value += 1
      this._druxtPristineLang = lang
      // The language the model is in, which a language change leaves behind
      // until the next language loads.
      this._druxtModelLang = lang
      this._druxtLoaded = true
    },

    /**
     * Puts away the previous language's unsaved edits and brings back the
     * current language's, when the language has changed since the copy edits
     * are compared with was taken. Each language keeps its own edits.
     *
     * @private
     */
    switchLanguage() {
      const from = this._druxtPristineLang
      // The default language has no code, so "nothing loaded yet" is kept apart.
      if (!this._druxtLoaded || from === this.lang || (this.model || {}).id !== this.uuid) return

      const drafts = this._druxtDrafts || (this._druxtDrafts = {})
      // A copy, so an edit made while the next language loads stays out of it.
      // While a form saves this language, an edit of what it sent is kept as
      // well, even one back to the value from before the save.
      if (this.hasEdits() || this.editedSinceSent()) drafts[from] = { model: JSON.parse(JSON.stringify(this.model)), pristine: this._druxtPristine }

      const draft = drafts[this.lang]
      delete drafts[this.lang]
      this._druxtPristineLang = this.lang
      if (draft) {
        this._druxtPristine = draft.pristine
        this._druxtPristineVersion.value += 1
        this.model = draft.model
        this._druxtModelLang = this.lang
      } else {
        this._druxtPristine = undefined
        this._druxtPristineVersion.value += 1
      }
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
     * @param {string} context.mode - The Drupal display mode.
     * @param {object} context.schema - The DruxtSchema object.
     * @param {('view'|'form')} context.schemaType - Drupal display schema type, 'view' or 'form'.
     * @param {string} context.type - The JSON:API resource type.
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
      this.schemaError = undefined
      try {
        this.schema = await this.getSchema({
          resourceType: this.type,
          mode: this.mode,
          schemaType: this.schemaType || 'view',
        })
      } catch(err) {
        // The entity renders without a schema either way, as one an earlier
        // fetch loaded can be for another display. A display Drupal doesn't
        // have is expected for some bundles, while any other failure is shown
        // in development.
        this.schema = null
        const missing = ['DRUXT_SCHEMA_MISSING', 'MODULE_NOT_FOUND'].includes((err || {}).code)
        if (!missing) this.schemaError = (err || {}).message || String(err)
      }
    },

    /**
     * Fetches the content entity JSON:API resource.
     *
     * @param {object} settings - The module settings object, including the resource query configuration.
     */
    async fetchData(settings) {
      if (!this.type) return

      if ((this.schemaType || 'view') === 'view' && !this.uuid && !this.value) {
        throw new Error('Missing required props: uuid.')
      }

      if (this.uuid && !this.value) {
        // Edits belong to one entity: another entity starts with none.
        if ((this.model || {}).id && this.model.id !== this.uuid) this._druxtDrafts = {}
        this.switchLanguage()
        const lang = this.lang

        // A value the parent sets while the request is pending wins over the
        // response.
        const value = this.value

        // Check if we need to bypass cache.
        let bypassCache = false
        if (typeof (settings.query || {}).bypassCache === 'boolean') {
          bypassCache = settings.query.bypassCache
        }

        // Build query.
        const query = this.getQuery(settings)

        // Execute the request.
        const resource = await this.getResource({
          id: this.uuid,
          prefix: this.lang,
          type: this.type,
          query,
          bypassCache
        })
        if (this.value !== value) return

        // The language changed while the request ran, so its answer is for
        // another language. Fetch this one once this fetch settles.
        if (this.lang !== lang) {
          this.$nextTick(() => this.fetchAgain())
          return
        }

        // Drupal refused an entity this component already shows, as after a
        // sign-out: show the error state rather than an empty entity.
        this._druxtRefused = !!(resource.error && !resource.data)
        if (this._druxtRefused && (this.model || {}).id === this.uuid) {
          const err = new Error(resource.error.message)
          err.response = { status: resource.error.statusCode }
          throw err
        }

        // A flush while the request ran keeps the store from storing its
        // answer, which may be from before the flush, such as a signed-in
        // copy after a sign-out. Fetch once more, after this fetch settles.
        // Or the store holds a newer copy that links to other resources than
        // the answer does, so the answer's included resources aren't its.
        const stored = this.storedEntity
        const answered = (resource.data || {}).id && !resource.error
        const relinked = !!stored && !!answered && linkageOf(stored) !== linkageOf(resource.data)
        if ((!stored && answered) || relinked) {
          if (!this._druxtFetchedAgain) {
            this._druxtFetchedAgain = true
            this.$nextTick(() => this.fetchAgain())
          }
        } else {
          this._druxtFetchedAgain = false
        }

        // Unsaved edits to this entity stay, as across a flip of the schema
        // type or a flush.
        if ((this.hasEdits() || this.editedSinceSent()) && (this.model || {}).id === this.uuid) return

        // The store's copy when it has one: the answer can be older, as when
        // a flush overtook this request and something stored the entity since.
        const entity = { ...(stored || resource.data || {}) }
        // Included resources belong to what the answer links to. For a copy
        // that links elsewhere, the fetch that follows brings them.
        entity.included = relinked
          ? ((this.model || {}).id === this.uuid ? this.model.included : undefined)
          : resource.included
        // The model already holds this copy, taken as the store stored it, and
        // needs only the included resources.
        if (pristineOf(entity) === this._druxtPristine && (this.model || {}).id === this.uuid) {
          if (JSON.stringify(this.model.included) !== JSON.stringify(entity.included)) {
            this.$set(this.model, 'included', entity.included)
          }
          return
        }
        this.setModelFromStore(entity)
      }
    },

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @param {object} context.fields - Entity fields based on the display mode.
     * @param {object} context.model - The model object.
     * @param {object} context.schema - The DruxtSchema object.
     * @returns {PropsData}
     */
    propsData: ({ fields, model, schema }) => ({ entity: model, fields, schema, value: model }),

    /**
     * Component settings.
     *
     * @param {object} context - The module component ViewModel.
     * @param {object} wrapperSettings - Settings provided by the wrapper component.
     * @returns {object} The merged module settings.
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
     * The `default` slot will also render all fields as per the
     * Drupal display mode configuration.
     *
     * @example <caption>DruxtEntity**ResourceType**.vue</caption> @lang vue
     * <template>
     *   <div>
     *     <slot name="content" />
     *     <slot :name="field_name" />
     *   </div>
     * </template>
     *
     * @param {Function} h - The Vue createElement function.
     * @return {ScopedSlots} The Scoped slots object.
     */
    slots(h) {
      const scopedSlots = {}

      if (!this.schema) {
        const display = `'${this.type}' in the '${this.mode}' ${this.schemaType === 'form' ? 'form' : 'view'} mode`
        const summary = this.schemaError
          ? `The display settings for ${display} couldn't be loaded`
          : `Missing display settings for ${display}`
        const description = this.schemaError
          ? [h('p', this.schemaError)]
          : [h('p', 'Create a Druxt theme component to render the entity.')]

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
              // Through Vue, so a field the model didn't have, or one taken
              // off it, counts as an edit.
              if (value) {
                this.$set(this.model[type], id, value)
              }
              else if (this.model[type][id]) {
                this.$delete(this.model[type], id)
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
 * Provides the available naming options for the wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @see {@link https://druxtjs.org/explanation/component-resolution|Component resolution}
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
 * the wrapper component `druxt` object or the DruxtEntity component `settings`
 * property.
 *
 * @typedef {object} ModuleSettings
 * @param {object} query - Entity query settings:
 * @param {(boolean|function)} query.bypassCache - Whether to pull the data from the Vuex store or from the JSON:API.
 * @param {(string[]|array[])} query.fields - An array or arrays of fields to filter from the JSON:API Resources.
 * @param {string[]} query.include - An array of relationships to include alongside the JSON:API Resource.
 * @param {boolean} query.schema - Whether to automatically detect fields to filter, per the Display mode.
 *
 * @example <caption>DruxtEntity Wrapper component</caption> @lang vue
 * <script>
 * export default {
 *   druxt: {
 *     query: {
 *       bypassCache: ({ $store }) => $store.$auth.loggedIn,
 *       fields: [['title'], ['user--user', ['display_name']]],
 *       include: ['uid'],
 *       schema: true,
 *     },
 *   },
 * }
 *
 * @example <caption>DruxtEntity component with settings</caption> @lang vue
 * <template>
 *   <DruxtEntity
 *     type="node--article"
 *     :uuid="uuid"
 *     :settings="{
 *       query: {
 *         bypassCache: true,
 *         fields: [['title'], ['user--user', ['display_name']]],
 *         include: ['uid'],
 *         schema: true,
 *       }
 *     }"
 *   />
 * </template>
 */

/**
 * Provides property data for use in the wrapper component.
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
 * Provides scoped slots for use in the wrapper component.
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
