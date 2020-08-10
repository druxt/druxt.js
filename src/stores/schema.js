const DruxtSchemaStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxtSchema'

  /**
   * The druxtSchema Vuex module.
   *
   * Provides a Vuex state object, mutations and actions for interacting with the Druxt Schemas.
   *
   * @name druxtSchema
   * @module druxtSchema
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
       * @param {object} data - Schema object and ID to be committed.
       *
       * @example @lang js
       * this.$store.commit('druxtSchema/addSchema', { id, schema }})
       */
      addSchema(state, { id, schema }) {
        state.schemas[id] = schema
      }
    },

    /**
     * Vuex Actions.
     */
    actions: {
      /**
       * Get a schema.
       *
       * @name get
       * @action get=schema
       * @param {SchemaConfiguration} resource The requested resource schema configuration object.
       * @returns {Schema} The Druxt Schema object.
       *
       * @example @lang js
       * const schema = await this.$store.dispatch('druxtRouter/get', '/')
       */
      async get({ state, commit }, resource = {}) {
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

        // Only load if we don't have this schema in the store.
        if (!state.schemas[resource.id]) {
          const schema = await this.$druxtSchema.import(resource.id)
          commit('addSchema', { id: resource.id, schema })
        }

        return state.schemas[resource.id]
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
 * @property {object} schemas - Druxt Schemas, keyed by Schema ID.
 */

/**
 * @typedef {object} Schema
 * @see {@link ../typedefs/schema|Schema}
 */

/**
 * @typedef {object} SchemaConfiguration
 * @see {@link ../typedefs/schemaConfiguration|SchemaConfiguration}
 */
