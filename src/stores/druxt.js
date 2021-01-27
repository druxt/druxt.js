import md5 from 'md5'

const DruxtStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxt'

  /**
   * The druxt Vuex module.
   *
   * Provides a Vuex state object, mutations and actions for interacting with the Drupal JSON:API.
   *
   * @name druxt
   * @module druxt
   */
  const module = {
    namespaced: true,

    /**
     * Vuex State object.
     *
     * @name state
     * @type {object}
     * @property {object} collections - JSON:API resource collections store.
     * @property {object} resources - JSON:API resources store.
     * @readonly
     */
    state: () => ({
      collections: {},
      resources: {}
    }),

    /**
     * Vuex Mutations.
     */
    mutations: {
      /**
       * @name addResource
       * @mutator {object} addResource=resources Adds a JSON:API resource to the Vuex state object.
       * @param {object} resource - The JSON:API resource.
       *
       * @example @lang js
       * this.$store.commit('druxt/addResource', resource)
       */
      addResource (state, resource) {
        const { id, type } = (resource || {}).data || {}
        if (!id || !type) {
          // @TODO - Error?
          return
        }

        if (!state.resources[type]) state.resources[type] = {}
        state.resources[type][id] = resource
      },

      /**
       * @name addCollection
       * @mutator {object} addCollection=collections Adds a JSON:API collection to the Vuex state object.
       * @param {object} collection - The JSON:API collection.
       *
       * @example @lang js
       * const collection = await this.$druxt.getCollection(resourceType, query, options)
       * this.$store.commit('druxt/addCollection', { collection })
       */
      addCollection (state, { collection, resourceType, hash }) {
        if (!state.collections[resourceType]) state.collections[resourceType] = {}
        state.collections[resourceType][hash] = collection
      }
    },

    /**
     * Vuex Actions.
     */
    actions: {
      /**
       * Get JSON:API Resource.
       *
       * - Executes query against Drupal JSON:API.
       * - Caches result in the Vuex store.
       * - Returns cached result from Vuex store when available.
       *
       * @name getResource
       * @action getResource=resources
       * @param {object} query
       * @return {object} The Drupal JSON:API resource.
       *
       * @example @lang js
       * const resource = await this.$store.dispatch('druxt/getResource', { type: 'node--article', id })
       */
      async getResource ({ commit, state }, query) {
        if (typeof (state.resources[query.type] || {})[query.id] !== 'undefined') {
          return state.resources[query.type][query.id]
        }

        const resource = await this.$druxt.getResource(query)

        commit('addResource', resource)

        return resource
      },

      /**
       * Get colleciton of resources.
       *
       * @name getCollection
       * @action getCollection
       * @param {object} context Object containing `druxt.getCollection()` parameters.
       * @param {string} context.resourceType - The JSON:API resource type.
       * @param {string|object} context.query - A JSON:API query string or object.
       * @param {object} [context.options]
       * @param {boolean} [context.options.all=false] - Load all results.
       * @return {object[]} Array of Drupal JSON:API resource data.
       *
       * @example @lang js
       * // Load all currently published Articles.
       * const query = new DrupalJsonApiParams()
       * query.addFilter('status', '1')
       * const resources = await this.$store.dispatch('druxt/getCollection', {
       *   resourceType: 'node--article',
       *   query,
       *   options: { all: true }
       * })
       */
      async getCollection ({ commit, state }, { resourceType, query, options }) {
        const hash = md5(this.$druxt.buildQueryUrl('', query))
        if ((state.collections[resourceType] || {})[hash]) {
          return state.collections[resourceType][hash]
        }

        const collection = await this.$druxt.getCollection(resourceType, query, options)
        commit('addCollection', { collection, resourceType, hash })

        // @TODO - Store individual resources.

        return collection
      },
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtStore }
