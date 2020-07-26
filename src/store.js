/**
 * @vuepress
 * ---
 * title: DruxtStore
 * headline: The Vuex store
 * ---
 */

/**
 * Register the Druxt Vuex store with the Nuxt.js.
 */
const DruxtStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  const namespace = 'druxt'
  const module = {
    namespaced: true,

    /**
     * @name State
     * @type {object}
     * @property {object} settings
     */
    state: () => ({
      settings: {}
    }),

    /**
     * @name Mutations
     * @type {object}
     */
    mutations: {},

    /**
     * @name Actions
     * @type {object}
     */
    actions: {}
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtStore }
