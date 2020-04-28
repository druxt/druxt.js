const DruxtMenuStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  const namespace = 'druxtMenu'
  const module = {
    namespaced: true,

    state: () => ({
      entities: {}
    }),

    mutations: {
      addEntities (state, entities) {
        for (const index in entities) {
          const entity = entities[index]
          state.entities[entity.id] = entity
        }
      }
    },

    actions: {
      async get ({ commit, dispatch }, name) {
        const { entities } = await this.$druxtMenu.get(name)

        commit('addEntities', entities)
      }
    },

    getters: {
      getEntitiesByFilter: state => filter => {
        const keys = Object.keys(state.entities).filter(key => filter(key))
        if (!keys.length) return {}

        return Object.assign(
          ...keys.map(key => ({ [key]: state.entities[key] }))
        )
      }
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtMenuStore }
