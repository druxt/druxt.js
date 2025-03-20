class DruxtSchemaStore {

  commit(mutator, payload = {}, app = {}) {
    if (typeof this[mutator] === 'function') this[mutator](payload, app)
    else throw new Error('Mutator is not a function')
  }

  /**
   * The State object.
   *
   * @name state
   * @type {state}
   */
  state() {
    return {
      schemas: {}
    }
  }

  /**
   * @name addSchema
   * @mutator {object} addSchema=schemas
   * @param {state} state - The Vuex State object.
   * @param {object} data - Schema object and ID to be committed.
   *
   * @example @lang js
   * this.$store.commit('druxtSchema/addSchema', { id, schema }})
   */
  addSchema({ id, schema }, { state }) {
    state.schemas[id] = schema
  }

  /**
   * Get a schema.
   *
   * @name get
   * @action get=schema
   * @param {SchemaConfiguration} resource The requested resource schema configuration object.
   * @returns {Schema} The Druxt Schema object.
   *
   * @example @lang js
   * const schema = await this.$store.dispatch('druxtSchema/get', { bundle: 'page' })
   */
  async get(resource = {}, { $druxtSchema, state }) {
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
      const schema = await $druxtSchema.import(resource.id)
      this.commit('addSchema', { id: resource.id, schema }, { state })
    }

    return state.schemas[resource.id]
  }

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
