import { DruxtStore } from 'druxt'
import { set } from 'vue'

// Instantiate a new DruxtStore instance with a custom setState function for
// Vue 2.
const druxtStore = new DruxtStore({
  setState: (root, key, value) => set(root, key, value)
})

export default ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxt'

  /**
   * The DruxtStore Vuex module.
   *
   * Provides a Vuex state object, mutations and actions for interacting with the DruxtClient.
   *
   * @name druxt
   * @module druxt
   */
  const module = {
    namespaced: true,

    state: druxtStore.state,

    mutations: {
      addCollection: (state, context = {}) => druxtStore.addCollection(context, { state }),
      addResource: (state, context = {}) => druxtStore.addResource(context, { state }),
      flushCollection: (state, context = {}) => druxtStore.flushCollection(context, { state }),
      flushResource: (state, context = {}) => druxtStore.flushResource(context, { state }),
    },

    actions: {
      async getCollection ($store, context = {}) {
        return await druxtStore.getCollection(context, {
          $druxt: this.$druxt,
          state: $store.state
        })
      },

      async getResource ($store, context = {}) {
        return await druxtStore.getResource(context, {
          $druxt: this.$druxt,
          state: $store.state
        })
      },
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}
