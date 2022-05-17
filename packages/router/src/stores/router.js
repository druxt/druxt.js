import Vue from 'vue'

const DruxtRouterStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxtRouter'

  /**
   * The druxtRouter Vuex module.
   *
   * Provides a Vuex state object, mutations and actions for interacting with the Drupal JSON:API.
   *
   * @name druxtRouter
   * @module druxtRouter
   *
   * @todo Change namespace to `druxt/router`.
   */
  const module = {
    namespaced: true,

    /**
     * Vuex State object.
     *
     * @name state
     * @type {object}
     * @property {object} entities - Drupal entity store.
     * @property {boolean|object} redirect - Active redirect.
     * @property {object} route - Active route.
     * @property {object} routes - Route store.
     * @readonly
     */
    state: () => ({
      entities: {},
      redirect: false,
      route: {},
      routes: {}
    }),

    /**
     * Vuex Mutations.
     */
    mutations: {
      /**
       * @deprecated
       * @see {@link https://druxtjs.org/api/stores/druxt}
       *
       * @name addEntity
       * @mutator {object} addEntity=entities Adds specified Drupal entity JSON:API resource data to the Vuex state object.
       * @param {object} entity - The Drupal entity JSON:API resource data.
       *
       * @example @lang js
       * this.$store.commit('druxtRouter/addEntity', entity)
       */
      addEntity (state, entity) {
        console.warn('[druxt-router] `druxtRouter/addEntity` is deprecated. See http://druxtjs.org/api/stores/druxt.')
        if (!entity || typeof entity.id === 'undefined') {
          // @TODO - Error?
          return
        }
        state.entities[entity.id] = entity
      },

      /**
       * @name setRedirect
       * @mutator {object} setRedirect=redirect Sets the active redirect.
       * @param {object} redirect - The Redirect object.
       *
       * @example @lang js
       * this.$store.commit('druxtRouter/setRedirect', redirect)
       */
      setRedirect (state, redirect) {
        state.redirect = redirect
      },

      /**
       * @name addRoute
       * @mutator {object} addRoute=routes Adds the supplied route to the Vuex state object.
       * @param {object} context
       * @param {string} context.path - The route path.
       * @param {object} context.route - The route object.
       *
       * @example @lang js
       * this.$store.commit('druxtRouter/addRoute', { path, route })
       */
      addRoute (state, { path, route }) {
        if (typeof path !== 'string' || typeof route === 'undefined') {
          // @TODO - Error?
          return
        }

        Vue.set(state.routes, path, route)
      },

      /**
       * @name setRoute
       * @mutator {string} setRoute=route Sets the active route by path.
       * @param {string} path - The route path
       *
       * @example @lang js
       * this.$store.commit('druxtRouter/setRoute', '/')
       */
      setRoute (state, path) {
        if (typeof path !== 'string' || typeof state.routes[path] === 'undefined') {
          // @TODO - Error?
          return
        }

        state.route = state.routes[path]
      }
    },

    /**
     * Vuex Actions.
     */
    actions: {
      /**
       * Get route and redirect information.
       *
       * - Dispatches `druxtRouter/getRoute` action.
       * - Sets the active route.
       * - Sets the active redirect.
       *
       * @name get
       * @action get=route
       * @param {string} path The router path.
       * @return {object} The route and redirect information.
       *
       * @example @lang js
       * const { redirect, route } = await this.$store.dispatch('druxtRouter/get', '/')
       */
      async get ({ commit, dispatch }, path) {
        // Get route by path from 'getRoute'.
        const route = await dispatch('getRoute', path)

        // Handle route errors.
        if (route.error && typeof route.error.statusCode !== 'undefined' && ((this.app || {}).context || {}).error) {
          return this.app.context.error(route.error)
        }

        // Set active route.
        commit('setRoute', path)

        // Set active redirect.
        const redirect = this.$druxtRouter().getRedirect(path, route)
        commit('setRedirect', redirect)

        return { redirect, route }
      },

      /**
       * Get Entity.
       *
       * - Executes query against Drupal JSON:API.
       * - Caches result in the Vuex store.
       * - Returns cached result from Vuex store when available.
       *
       * @deprecated
       * @see {@link https://druxtjs.org/api/stores/druxt}
       *
       * @name getEntity
       * @action getEntity=entities
       * @param {object} query
       * @return {object} The Drupal entity JSON:API resource data.
       *
       * @example @lang js
       * const entity = await this.$store.dispatch('druxtRouter/getEntity', { type: 'node--article', id })
       *
       * @todo Rename getEntity to getResource.
       */
      async getEntity ({ commit, state }, query) {
        console.warn('[druxt-router] `druxtRouter/getEntity` is deprecated. See http://druxtjs.org/api/stores/druxt.')
        if (typeof state.entities[query.id] !== 'undefined') {
          return state.entities[query.id]
        }

        const entity = await this.app.store.dispatch('druxt/getResource', query)

        commit('addEntity', entity.data)

        return entity.data
      },

      /**
       * Get multiple resources.
       *
       * @deprecated
       * @see {@link https://druxtjs.org/api/stores/druxt}
       *
       * @name getResources
       * @action getResources
       * @param {object} context Object containing `druxtRouter.getResources()` parameters.
       * @param {string} context.resource - The JSON:API resource type.
       * @param {string|object} context.query - A JSON:API query string or object.
       * @param {object} [context.options]
       * @param {boolean} [context.options.all=false] - Load all results.
       * @return {object[]} Array of Drupal JSON:API resource data.
       *
       * @example @lang js
       * // Load all currently published Articles.
       * const query = new DrupalJsonApiParams()
       * query.addFilter('status', '1')
       * const resources = await this.$store.dispatch('druxtRouter/getResources', {
       *   resource: 'node--article',
       *   query,
       *   options: { all: true }
       * })
       */
      async getResources (app, { resource, query }) {
        console.warn('[druxt-router] `druxtRouter/getResources` is deprecated. See http://druxtjs.org/api/stores/druxt.')
        const collection = await this.app.store.dispatch('druxt/getCollection', { type: resource, query })
        return collection.data || false
      },

      /**
       * Get Route.
       *
       * - Executes query against Drupal Decoupled router.
       * - Caches result in the Vuex store.
       * - Returns cached result from Vuex store when available.
       *
       * @name getRoute
       * @action getRoute=route
       * @param {string} path - The route path.
       * @return {object} The route object.
       *
       * @example @lang js
       * const route = await this.$store.dispatch('druxtRouter/getRoute', '/')
       */
      async getRoute ({ commit, state }, path) {
        if (typeof state.routes[path] !== 'undefined') {
          return state.routes[path]
        }

        let route
        try {
          route = await this.$druxtRouter().getRoute(path)
        } catch (err) {
          route = { error: { statusCode: err.response.status, message: err.response.data.message } }
        }

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
