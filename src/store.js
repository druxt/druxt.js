// @TODO - Add Vuex test coverage.
const DruxtRouterStore = ({ store }) => {
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
          // @TODO - Error?
          return
        }
        state.entities[entity.id] = entity
      },

      addRoute (state, { path, route }) {
        if (typeof path !== 'string' || typeof route === 'undefined') {
          // @TODO - Error?
          return
        }

        state.routes[path] = route
      },

      setRoute (state, path) {
        if (typeof path !== 'string' || typeof state.routes[path] === 'undefined') {
          // @TODO - Error?
          return
        }

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
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtRouterStore }
