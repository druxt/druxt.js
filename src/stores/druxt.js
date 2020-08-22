const DruxtStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxt'

  /**
   * The druxt Vuex module.
   *
   * Provides a Vuex state object, mutations and actions for common Druxt.js functionality.
   *
   * @name druxt
   * @module druxt
   * 
   * @todo Add Druxt.js common settings functionality to Vuex store.
   */
  const module = {
    namespaced: true,

    /**
     * Vuex State object.
     *
     * @name state
     * @type {object}
     * @property {object} settings - Druxt.js settings.
     */
    state: () => ({
      settings: {}
    }),

    /**
     * Vuex Mutations.
     */
    mutations: {},

    /**
     * Vuex Actions.
     */
    actions: {}
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtStore }
