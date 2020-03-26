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
      redirect: false,
      route: {},
      routes: {}
    }),

    mutations: {
      addEntity (state, entity) {
        if (typeof entity.id === 'undefined') {
          // @TODO - Error?
          return
        }
        state.entities[entity.id] = entity
      },

      setRedirect (state, redirect) {
        state.redirect = redirect
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
      // @TODO - Change this to use the 'getRoute' and 'getEntity' actions.
      async get ({ commit, state }, path) {
        // Return cached data, if present.
        // @TODO - Handle cache busting.
        if (typeof state.routes[path] !== 'undefined' && typeof state.entities[state.routes[path].entity.uuid] !== 'undefined') {
          const route = state.entities[state.routes[path].entity.uuid]
          const redirect = this.$druxtRouter().getRedirect(path, route)
          const entity = state.entities[state.routes[path].entity.uuid]

          commit('setRoute', path)
          commit('setRedirect', redirect)

          return { entity, redirect, route }
        }

        // Get data from router.
        try {
          const { entity, redirect, route } = await this.$druxtRouter().get(path)

          commit('addRoute', { path, redirect, route })
          commit('setRoute', path)

          commit('setRedirect', redirect)

          commit('addEntity', entity)

          return { entity, redirect, route }

        // Handle errors.
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
      },

      async getRoute ({ commit, state }, path) {
        if (typeof state.routes[path] !== 'undefined') {
          return state.routes[path]
        }

        const route = await this.$druxtRouter().getRoute(path)

        commit('addRoute', { path, route })

        return route
      }
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtRouterStore }
