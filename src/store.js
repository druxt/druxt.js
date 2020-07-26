/**
 * @vuepress
 * ---
 * title: DruxtStore
 * headline: The Vuex store
 * ---
 */

/**
 * Druxt Vuex store.
 *
 * @param {*} param0
 */
const DruxtStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  const namespace = 'druxt'
  const module = {
    namespaced: true,

    state: () => ({
      settings: {}
    }),

    mutations: {},

    actions: {}
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtStore }
