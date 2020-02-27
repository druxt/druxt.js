export default ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  const namespace = 'druxtRouter'
  const module = {
    namespaced: true,

    state: () => ({
      entities: {},
      route: {},
      routes: {},
      schema: {}
    }),

    mutations: {
      addEntity (state, entity) {
        if (typeof entity.id === 'undefined') {
          return
        }
        state.entities[entity.id] = entity
      },

      addRoute (state, { path, route }) {
        state.routes[path] = route
      },

      setRoute (state, path) {
        state.route = state.routes[path]
      }
    },

    actions: {
      async getEntityByRouter ({ commit, dispatch, state }, path) {
        try {
          const { entity, route } = await this.$druxtRouter().get(path)

          commit('addRoute', { path, route })
          commit('setRoute', path)

          commit('addEntity', entity)

          return entity
        } catch (err) {
          if (typeof err.response === 'undefined') {
            throw err
          }

          return this.app.context.error({
            statusCode: err.response.status,
            message: err.response.statusText
          })
        }
      },

      async getEntity ({ commit, state }, query) {
        if (typeof state.entities[query.id] !== 'undefined') {
          return state.entities[query.id]
        }

        const entity = await this.$druxtRouter().getResource(query)

        commit('addEntity', entity)

        return entity
      }

      // async set ({ commit, dispatch, state }, path) {
      //   await dispatch('get', path)
      //   commit('setRoute', path)

      //   if (typeof state.route !== 'undefined') {
      //     const uuid = state.route.entity.uuid
      //     if (typeof state.entities[uuid] !== 'undefined') {
      //       commit('setEntity', state.entities[uuid])
      //     }
      //   }
      // }
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}
