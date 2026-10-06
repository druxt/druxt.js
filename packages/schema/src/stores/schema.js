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
       * @name flushSchemas
       * @mutator {object} flushSchemas=schemas Removes the stored schemas, so each is loaded again.
       * @param {state} state - The Vuex State object.
       *
       * @example @lang js
       * this.$store.commit('druxtSchema/flushSchemas')
       */
      flushSchemas(state) {
        generation.value += 1
        Vue.set(state, 'schemas', {})
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
       * const schema = await this.$store.dispatch('druxtSchema/get', { resourceType: 'node--page' })
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

        if (state.schemas[resource.id]) return state.schemas[resource.id]

        // A schema loaded across a flush may be stale, so it is loaded again.
        let schema
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const since = generation.value
          schema = await this.$druxtSchema.import(resource.id)
          if (since === generation.value) {
            commit('addSchema', { id: resource.id, schema })
            return state.schemas[resource.id]
          }
        }

        // Flushed during every attempt: the last schema is used but not stored.
        return schema
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
