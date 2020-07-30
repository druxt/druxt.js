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
   * @todo Replace 'entit(y|ies)' with 'resource(s)'
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
       * @name addEntity
       * @mutator {object} addEntity=entities Adds specified Drupal entity JSON:API resource data to the Vuex state object.
       * @param {object} entity - The Drupal entity JSON:API resource data.
       *
       * @example
       * this.$store.commit('druxtRouter/addEntity', entity)
       */
      addEntity (state, entity) {
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
       * @example
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
       * @example
       * this.$store.commit('druxtRouter/addRoute', { path, route })
       */
      addRoute (state, { path, route }) {
        if (typeof path !== 'string' || typeof route === 'undefined') {
          // @TODO - Error?
          return
        }

        state.routes[path] = route
      },

      /**
       * @name setRoute
       * @mutator {string} setRoute=route Sets the active route by path.
       * @param {string} path - The route path
       *
       * @example
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
       * @example
       * const { redirect, route } = await this.$store.dispatch('druxtRouter/get', '/')
       */
      async get ({ commit, dispatch, state }, path) {
        // Get route by path from 'getRoute'.
        const route = await dispatch('getRoute', path)

        // Handle route errors.
        if (route.error && typeof route.error.statusCode !== 'undefined') {
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
       * @name getEntity
       * @action getEntity=entities
       * @param {object} query
       * @return {object} The Drupal entity JSON:API resource data.
       *
       * @example
       * const entity = await this.$store.dispatch('druxtRouter/getEntity', { type: 'node--article', id })
       *
       * @todo Rename getEntity to getResource.
       */
      async getEntity ({ commit, state }, query) {
        if (typeof state.entities[query.id] !== 'undefined') {
          return state.entities[query.id]
        }

        const entity = await this.$druxtRouter().getResource(query)

        commit('addEntity', entity)

        return entity
      },

      /**
       * Get multiple resources.
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
       * @example
       * // Load all currently published Articles.
       * const query = new DrupalJsonApiParams()
       * query.addFilter('status', '1')
       * const resources = await this.$store.dispatch('druxtRouter/getResources', {
       *   resource: 'node--article',
       *   query,
       *   options: { all: true }
       * })
       *
       * @todo Add Vuex store caching for getResources.
       */
      async getResources ({ commit, state }, { resource, query, options }) {
        const resources = await this.$druxtRouter().getResources(resource, query, options)

        return resources
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
       * @example
       * const route = await this.$store.dispatch('druxtRouter/getRoute', '/')
       */
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
