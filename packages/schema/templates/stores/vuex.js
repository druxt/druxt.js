import { DruxtSchemaStore } from 'druxt-schema'

const druxtSchemaStore = new DruxtSchemaStore()

export default ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxtSchema'

  /**
   * The DruxtSchemaStore Vuex module.
   *
   * Provides a Vuex state object, mutations and actions for interacting with the Druxt Schemas.
   *
   * @name druxtSchema
   * @module druxtSchema
   */
  const module = {
    namespaced: true,

    state: druxtSchemaStore.state,

    actions: {
      async get ($store, context = {}) {
        return await druxtSchemaStore.get(context, {
          $druxtSchema: this.$druxtSchema,
          state: $store.state
        })
      }
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}
