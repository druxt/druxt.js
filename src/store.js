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
        if (!entity || typeof entity.id === 'undefined') {
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
      async get ({ commit, dispatch, state }, path) {
        // Get route by path from 'getRoute'.
        const route = await dispatch('getRoute', path)

        // Handle route errors.
        if (route.error && typeof route.error.statusCode !== 'undefined') {
          return this.app.context.error(route.error)
        }

        commit('setRoute', path)

        const redirect = this.$druxtRouter().getRedirect(path, route)
        commit('setRedirect', redirect)

        return { redirect, route }
      },

      // @TODO - Move this into druxt-entity.
      async getEntity ({ commit, state }, query) {
        if (typeof state.entities[query.id] !== 'undefined') {
          return state.entities[query.id]
        }

        const entity = await this.$druxtRouter().getResource(query)

        commit('addEntity', entity)

        return entity
      },

      async getResources ({ commit, state }, { resource, query }) {
        const resources = await this.$druxtRouter().getResources(resource, query)

        return resources
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
