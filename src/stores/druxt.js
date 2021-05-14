import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import merge from 'deepmerge'
import md5 from 'md5'
import Vue from 'vue'

const getDrupalJsonApiParams = (query) => {
  const apiParams = new DrupalJsonApiParams()
  if (!query) {
    return apiParams
  }

  return typeof query === 'object'
    ? apiParams.initializeWithQueryObject(typeof query.getQueryObject === 'function' ? query.getQueryObject() : query)
    : apiParams.initializeWithQueryString(query)
}

const DruxtStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxt'

  /**
   * The DruxtStore Vuex module.
   *
   * Provides a Vuex state object, mutations and actions for interacting with the DruxtClient.
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
     * @property {DruxtClientCollections} collections - JSON:API resource collections store.
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
       * @name addCollection
       * @mutator {object} addCollection=collections Adds a JSON:API collection to the Vuex state object.
       * @param {addCollectionContext} context
       *
       * @example @lang js
       * this.$store.commit('druxt/addCollection', { collection, type, hash })
       */
      addCollection (state, { collection, type, hash }) {
        if (!state.collections[type]) Vue.set(state.collections, type, {})

        collection = {
          ...collection,
          data: collection.data.map((resource) => ({ id: resource.id, type: resource.type }))
        }

        Vue.set(state.collections[type], hash, collection)
      },

      /**
       * @name addResource
       * @mutator {object} addResource=resources Adds a JSON:API resource to the Vuex state object.
       * @param {addResourceContext} context
       *
       * @example @lang js
       * this.$store.commit('druxt/addResource', { resource })
       */
      addResource (state, { resource }) {
        const { id, type } = (resource || {}).data || {}
        if (!id || !type) {
          // @TODO - Error?
          return
        }

        if (!state.resources[type]) Vue.set(state.resources, type, {})

        resource = merge(state.resources[type][id] || {}, resource)
        Vue.set(state.resources[type], id, resource)
      },
    },

    /**
     * Vuex Actions.
     */
    actions: {
      /**
       * Get collection of resources.
       *
       * @name getCollection
       * @action getCollection
       * @param {getCollectionContext} context
       * @return {object[]} Array of Drupal JSON:API resource data.
       *
       * @example @lang js
       * // Load all currently published Articles.
       * const resources = await this.$store.dispatch('druxt/getCollection', {
       *   type: 'node--article',
       *   query: new DrupalJsonApiParams().addFilter('status', '1'),
       * })
       */
      async getCollection ({ commit, state }, { type, query }) {
        // Generate a hash using query data excluding the 'fields'.
        const hashData = getDrupalJsonApiParams(query).getQueryObject()
        const hash = query ? md5(JSON.stringify({ ...hashData, fields: {} })) : '_default'

        // If collection hash exists, re-hydrate and return the data.
        if ((state.collections[type] || {})[hash]) {
          return {
            ...state.collections[type][hash],
            data: state.collections[type][hash].data.map(({ id, type }) => (state.resources[type][id] || {}).data)
          }
        }

        const collection = await this.$druxt.getCollection(type, query)
        commit('addCollection', { collection, type, hash })

        // Add data to the resource store.
        for (const resource of (collection || {}).data || []) {
          commit('addResource', { resource: { data: resource }, hash })
        }

        return collection
      },

      /**
       * Get JSON:API Resource.
       *
       * - Executes query against Drupal JSON:API.
       * - Caches result in the Vuex store.
       * - Returns cached result from Vuex store when available.
       *
       * @name getResource
       * @action getResource=resources
       * @param {getResourceContext} context
       * @return {object} The Drupal JSON:API resource.
       *
       * @example @lang js
       * const resource = await this.$store.dispatch('druxt/getResource', { type: 'node--article', id })
       */
      async getResource ({ commit, state }, { type, id, query }) {
        // Get the resource from the store if it's avaialble.
        let resource = (state.resources[type] || {})[id] || null

        // Parse the query.
        query = getDrupalJsonApiParams(query).getQueryObject()

        // @todo includes?

        // Determine if we have all the requested field data.
        let fields = (query.fields || {})[type] || true
        if (typeof fields === 'string') {
          const queryFields = fields.split(',')
          const resourceFields = [
            ...Object.keys(((resource || {}).data || {}).attributes || {}),
            ...Object.keys(((resource || {}).data || {}).relationships || {}),
          ]
          const missingFields = queryFields.filter((key) => !resourceFields.includes(key))
          fields = !!missingFields.length

          // Modify query to load additional fields, if required.
          query.fields[type] = (missingFields || []).join(',') || undefined
        }

        // Request the resource from the DruxtClient if required.
        if (!resource || fields) {
          resource = await this.$druxt.getResource(type, id, getDrupalJsonApiParams(query))
          commit('addResource', { resource })
        }

        // Return stored resource.
        return state.resources[type][id]
      },
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtStore }

/**
 * Parameters for the `addCollection` mutation.
 *
 * @typedef {object} addCollectionContext
 *
 * @param {object} collection - A collection of JSON:API resources.
 * @param {string} type - The JSON:API collection resource type.
 * @param {string} hash - An md5 hash of the query string.
 *
 * @example @lang js
 * {
 *   collection: {
 *     jsonapi: {},
 *     data: [{}],
 *     links: {}
 *   },
 *   type: 'node--page',
 *   hash: '_default'
 * }
 */

/**
 * Parameters for the `addResource` mutation.
 *
 * @typedef {object} addResourceContext
 *
 * @param {object} resource - The JSON:API resource.
 * @param {string} hash - An md5 hash of the query string.
 *
 * @example @lang js
 * {
 *   resource: {
 *     jsonapi: {},
 *     data: {},
 *     links: {}
 *   },
 *   hash: '_default'
 * }
 */

/**
 * Parameters for the `getCollection` action.
 *
 * @typedef {object} getCollectionContext
 *
 * @param {string} type - The JSON:API collection resource type.
 * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
 *
 * @example @lang js
 * {
 *   type: 'node--page',
 *   query: new DrupalJsonApiParams().addFilter('status', '1')
 * }
 */

/**
 * Parameters for the `getResource` action.
 *
 * @typedef {object} getResourceContext
 *
 * @param {string} type - The JSON:API Resource type.
 * @param {string} id - The Drupal resource UUID.
 * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
 *
 * @example @lang js
 * {
 *   type: 'node--page',
 *   id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd'
 * }
 */

/**
 * @typedef {string|object} DruxtClientQuery
 *
 * A correctly formatted JSON:API query string or object.
 *
 * @example
 * page[limit]=5&page[offset]=5
 *
 * @example @lang js
 * new DrupalJsonApiParams().addPageLimit(5)
 *
 * @see {@link https://www.npmjs.com/package/drupal-jsonapi-params}
 */
