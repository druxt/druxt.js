export default ({ store }) => {
  const namespace = 'druxtRouter'
  const module = {
    namespaced: true,

    state: () => ({
      entity: {},
      entities: {},
      route: {},
      routes: {}
    }),

    mutations: {
      addEntity (state, { entity }) {
        if (typeof entity.id === 'undefined') {
          return
        }
        state.entities[entity.id] = entity
      },

      addRoute (state, { path, route }) {
        state.routes[path] = route
      },

      setEntity (state, entity) {
        state.entity = entity
      },

      setRoute (state, path) {
        state.route = state.routes[path]
      }
    },

    actions: {
      async get ({ commit }, path) {
        try {
          const { entity, route } = await this.$druxtRouter().get(path)
          commit('addEntity', { entity })
          commit('addRoute', { path, route })
        } catch ({ response }) {
          return this.app.context.error({
            statusCode: response.status,
            message: response.statusText
          })
        }
      },

      async set ({ commit, dispatch, state }, path) {
        await dispatch('get', path)
        commit('setRoute', path)

        if (typeof state.route !== 'undefined') {
          const uuid = state.route.entity.uuid
          if (typeof state.entities[uuid] !== 'undefined') {
            commit('setEntity', state.entities[uuid])
          }
        }
      }
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}
