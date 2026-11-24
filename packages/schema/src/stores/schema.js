import Vue from 'vue'

const DruxtSchemaStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxtSchema'

  // Moved on by a flush, so a schema loaded before it is not stored.
  const generation = { value: 0 }

  // Labels being loaded, by langcode, so concurrent schemas share one load.
  const loadingLabels = new Map()

  // The schema with a language's labels and descriptions for its fields.
  const withLabels = (schema, labels) => ({
    ...schema,
    fields: (schema.fields || []).map((field) => labels[field.id]
      ? { ...field, description: labels[field.id].description, label: { ...field.label, text: labels[field.id].label } }
      : field),
  })

  /**
   * The druxtSchema Vuex module.
   *
   * Provides a Vuex state object, mutations and actions for interacting with the Druxt Schemas.
   *
   * @name druxtSchema
   * @module druxtSchema
   *
   * @see {@link https://druxtjs.org/explanation/druxt-store|The DruxtStore}
   */
  const module = {
    namespaced: true,

    /**
     * The Vuex State object.
     *
     * @name state
     * @type {state}
     */
    state: () => ({
      labels: {},
      schemas: {}
    }),

    /**
     * Vuex Mutations.
     */
    mutations: {
      /**
       * @name addSchema
       * @mutator {object} addSchema=schemas
       * @param {state} state - The Vuex State object.
       * @param {addSchemaPayload} data - Schema object and ID to be committed.
       *
       * @example @lang js
       * this.$store.commit('druxtSchema/addSchema', { id, schema })
       */
      addSchema(state, { id, schema }) {
        Vue.set(state.schemas, id, schema)
      },

      /**
       * @name addLabels
       * @mutator {object} addLabels=labels
       * @param {state} state - The Vuex State object.
       * @param {object} data - The langcode and its labels.
       * @param {string} data.langcode - The langcode.
       * @param {object} data.labels - The translated field labels, by resource type and field.
       *
       * @example @lang js
       * this.$store.commit('druxtSchema/addLabels', { langcode: 'es', labels })
       */
      addLabels(state, { langcode, labels }) {
        Vue.set(state.labels, langcode, labels)
      },

      /**
       * @name flushSchemas
       * @mutator {object} flushSchemas=schemas Removes the stored schemas, so each is loaded again.
       * @param {state} state - The Vuex State object.
       *
       * @example @lang js
       * this.$store.commit('druxtSchema/flushSchemas')
       */
      flushSchemas(state) {
        generation.value += 1
        loadingLabels.clear()
        Vue.set(state, 'schemas', {})
        Vue.set(state, 'labels', {})
      }
    },

    /**
     * Vuex Actions.
     */
    actions: {
      /**
       * Get a schema, with its field labels in a language when `langcode` is given.
       *
       * The schemas are built in Drupal's default language. In another language, the field labels and descriptions
       * Drupal translates replace those of the built schema.
       *
       * @name get
       * @action get=schema
       * @param {SchemaConfiguration} resource The requested resource schema configuration object, and an optional `langcode`.
       * @returns {Schema} The Druxt Schema object.
       *
       * @example @lang js
       * const schema = await this.$store.dispatch('druxtSchema/get', { resourceType: 'node--page', langcode: 'es' })
       */
      async get({ state, commit, dispatch }, resource = {}) {
        resource = {
          id: null,
          resourceType: null,
          entityType: 'node',
          bundle: null,
          mode: 'default',
          schemaType: 'view',

          ...resource
        }

        // Build ID from resource type.
        if (!resource.id && resource.resourceType) {
          resource.id = [resource.resourceType, resource.mode, resource.schemaType].join('--')
        }

        // Build ID from entity and bundle types.
        if (!resource.id && resource.bundle) {
          resource.id = [resource.entityType, resource.bundle, resource.mode, resource.schemaType].join('--')
        }

        if (!resource.id) {
          return false
        }

        const schema = await dispatch('getBuilt', resource.id)
        if (!resource.langcode || !schema) return schema

        const id = `${resource.id}@${resource.langcode}`
        if (state.schemas[id]) return state.schemas[id]

        const labels = (await dispatch('getLabels', resource.langcode))[schema.resourceType]
        if (!labels) return schema

        // Kept only beside the schema it was made from, which a flush removes.
        const translated = withLabels(schema, labels)
        if (state.schemas[resource.id] === schema) commit('addSchema', { id, schema: translated })
        return translated
      },

      /**
       * Get a schema as built, in Drupal's default language.
       *
       * @name getBuilt
       * @action getBuilt=schema
       * @param {string} id The schema ID.
       * @returns {Schema} The Druxt Schema object.
       *
       * @example @lang js
       * const schema = await this.$store.dispatch('druxtSchema/getBuilt', 'node--page--default--view')
       */
      async getBuilt({ state, commit }, id) {
        if (state.schemas[id]) return state.schemas[id]

        // A schema loaded across a flush may be stale, so it is loaded again.
        let schema
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const since = generation.value
          schema = await this.$druxtSchema.import(id)
          if (since === generation.value) {
            commit('addSchema', { id, schema })
            return state.schemas[id]
          }
        }

        // Flushed during every attempt: the last schema is used but not stored.
        return schema
      },

      /**
       * Get the field labels and descriptions Drupal translates in a language, by resource type and field.
       *
       * Empty for a language without translated labels, or when they can't be loaded.
       *
       * @name getLabels
       * @action getLabels=labels
       * @param {string} langcode The langcode.
       * @returns {object} The labels.
       *
       * @example @lang js
       * const labels = await this.$store.dispatch('druxtSchema/getLabels', 'es')
       */
      async getLabels({ state, commit }, langcode) {
        if (state.labels[langcode]) return state.labels[langcode]

        if (!loadingLabels.has(langcode)) {
          const since = generation.value
          const loading = Promise.resolve()
            .then(() => this.$druxtSchema.labels(langcode))
            .catch(() => ({}))
            .then((labels) => {
              labels = labels || {}
              if (since === generation.value) {
                commit('addLabels', { langcode, labels })
                loadingLabels.delete(langcode)
              }
              return labels
            })
          loadingLabels.set(langcode, loading)
        }
        return loadingLabels.get(langcode)
      }
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtSchemaStore }

/**
 * The Vuex State object.
 *
 * @typedef {object} state
 * @property {object} labels - Translated field labels, keyed by langcode.
 * @property {object} schemas - Druxt Schemas, keyed by Schema ID, and by `<id>@<langcode>` with a language's labels.
 */

/**
 * Parameters for the `addSchema` mutation.
 *
 * @typedef {object} addSchemaPayload
 *
 * @param {string} id - The Schema ID.
 * @param {object} schema - The Schema object.
 *
 * @example @lang js
 * {
 *   id: 'node--page--default--view',
 *   schema: {}
 * }
 */

/**
 * The Druxt Schema object.
 *
 * @typedef {object} Schema
 * @see {@link ../typedefs/schema|Schema}
 */

/**
 * Druxt Schema configuration object.
 *
 * @typedef {object} SchemaConfiguration
 * @see {@link ../typedefs/schemaConfiguration|SchemaConfiguration}
 */
