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
          // Dehydrate resources.
          data: collection.data.map((o) => ({ id: o.id, type: o.type })),
        }

        // Dehydrate includesd resources.
        if (collection.included) {
          collection.included.map((o) => ({ id: o.id, type: o.type }))
        }

        // Recursively merge new collection data into stored collection.
        collection = merge(state.collections[type][hash] || {}, collection)

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
      addResource (state, { resource, hash }) {
        if (hash) {
          console.warn('[druxt] The `hash` argument for `druxt/addResource` has been deprecated, see https://druxtjs.org/guide/deprecations')
        }

        const { id, type } = (resource || {}).data || {}
        if (!id || !type) {
          // @TODO - Error?
          return
        }

        // Ensure Resource type array is reactive.
        if (!state.resources[type]) Vue.set(state.resources, type, {})
        
        // Dehydrate included data.
        if (resource.included) {
          resource.included.map((o) => ({ id: o.id, type: o.type }))
        }

        // Recursively merge new resource data into stored resource.
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
        // Generate a hash using query data excluding the 'fields' and 'include' data.
        const queryObject = getDrupalJsonApiParams(query).getQueryObject()
        const hash = query ? md5(JSON.stringify({ ...queryObject, fields: {}, include: [] })) : '_default'

        // If collection hash exists, re-hydrate and return the data.
        let collection
        if ((state.collections[type] || {})[hash]) {
          collection =  {
            ...state.collections[type][hash],
            // Hydrate resource data.
            data: state.collections[type][hash].data.map((o) => (state.resources[o.type][o.id] || {}).data)
          }

          // Hydrate included resources.
          // @todo only provide requested includes.
          if (collection.included) {
            collection.included = collection.included.map((o) => (state.resources[o.type][o.id] || {}).data)
          }

          return collection
        }

        // Get the collection using the DruxtClient instance.
        collection = await this.$druxt.getCollection(type, query)

        // Store the collection in the DruxtStore.
        commit('addCollection', { collection, type, hash })

        // Add data to the resource store.
        for (const resource of (collection || {}).data || []) {
          const flag = typeof (queryObject.fields || {})[resource.type] === 'string' ? '_druxt_partial' : '_druxt_full'
          commit('addResource', { resource: { [flag]: Date.now(), data: resource } })
        }

        // Add included data to resource store.
        if (Array.isArray(collection.included)) {
          for (const resource of collection.included) {
            const flag = typeof (queryObject.fields || {})[resource.type] === 'string' ? '_druxt_partial' : '_druxt_full'
            commit('addResource', { resource: { [flag]: Date.now(), data: resource } })
          }
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
        let resource = (state.resources[type] || {})[id] ? { ...state.resources[type][id] } : null

        // Parse the query.
        const queryObject = getDrupalJsonApiParams(query).getQueryObject()

        // Hydrate included resources.
        // @todo only provide requested includes.
        if (queryObject.include && (resource || {}).included) {
          resource.included = resource.included.map((o) => (state.resources[o.type][o.id] || {}).data)
        }

        // Return if we have the full resource.
        if ((resource || {})._druxt_full) {
          return resource
        }

        const isFull = typeof (queryObject.fields || {})[type] !== 'string'
        const isPartial = !isFull
        const flag = isFull ? '_druxt_full' : '_druxt_partial'

        // Determine if we have all the requested field data.
        let fields = isFull ? true : (queryObject.fields || {})[type]
        if (isPartial && fields) {
          const queryFields = fields.split(',')
          const resourceFields = [
            ...Object.keys(((resource || {}).data || {}).attributes || {}),
            ...Object.keys(((resource || {}).data || {}).relationships || {}),
          ]
          const missingFields = queryFields.filter((key) => !resourceFields.includes(key))
          fields = !!missingFields.length

          // Modify query to load additional fields, if required.
          queryObject.fields[type] = (missingFields || []).join(',') || undefined
        }

        // Request the resource from the DruxtClient if required.
        if (!resource || fields) {
          resource = await this.$druxt.getResource(type, id, getDrupalJsonApiParams(queryObject))
          resource[flag] = Date.now()
          commit('addResource', { resource })
        }

        // Add included data to resource store.
        if (Array.isArray(resource.included)) {
          for (const include of resource.included) {
            const flag = (queryObject.fields || {})[include.type] ? '_druxt_partial' : '_druxt_full'
            commit('addResource', { resource: { [flag]: Date.now(), data: include } })
          }
        }

        // Return stored resource.
        return (state.resources[type] || {})[id] || false
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
