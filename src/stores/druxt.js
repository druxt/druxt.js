import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import merge from 'deepmerge'
import md5 from 'md5'
import Vue from 'vue'

const getDrupalJsonApiParams = (query) => {
  const apiParams = new DrupalJsonApiParams()
  if (!query) {
    return apiParams
  }

  typeof query === 'object'
    ? apiParams.initializeWithQueryObject(typeof query.getQueryObject === 'function' ? query.getQueryObject() : query)
    : apiParams.initializeWithQueryString(query)
  return apiParams
}

const dehydrateResources = ({ commit, queryObject, resources }) => {
  return resources.map((data) => {
    // Generate a query link for included resources.
    // This is used to determine if the resource is a partial.
    const link = decodeURI(((data.links || {}).self || {}).href || '')
    const href = typeof (queryObject.fields || {})[data.type] === 'string'
      ? [link.split('?')[0], `fields[${data.type}]=${queryObject.fields[data.type]}`].join('?')
      : link

    // Commit the included resource.
    commit('druxt/addResource', {
      resource: {
        data,
        links: { self: { href } },
      }
    })

    return { id: data.id, type: data.type }
  })
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

        // Parse the query.
        const link = decodeURI((((collection || {}).links || {}).self || {}).href || '')
        const query = link.split('?')[1] || ''
        const queryObject = getDrupalJsonApiParams(query).getQueryObject()

        // Store and dehydrate collection resources.
        collection.data = dehydrateResources({ commit: this.commit, queryObject, resources: collection.data })

        // Extract and store included resources.
        if (collection.included) {
          collection.included = dehydrateResources({ commit: this.commit, queryObject, resources: collection.included })
          delete collection.included
        }

        // Recursively merge new collection data into stored collection.
        collection = merge(state.collections[type][hash] || {}, collection, { arrayMerge: (dst, src) => src })

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

        // Parse the query.
        const link = decodeURI((((resource || {}).links || {}).self || {}).href || '')
        const query = link.split('?')[1] || ''
        const queryObject = getDrupalJsonApiParams(query).getQueryObject()

        // Add cache flag to resource.
        const flag = typeof (queryObject.fields || {})[((resource || {}).data || {}).type] === 'string' ? '_druxt_partial' : '_druxt_full'
        resource[flag] = Date.now()

        // Ensure Resource type array is reactive.
        if (!state.resources[type]) Vue.set(state.resources, type, {})
        
        // Extract and store included data.
        if (resource.included) {
          dehydrateResources({ commit: this.commit, queryObject, resources: resource.included })
          delete resource.included
        }

        // Recursively merge new resource data into stored resource.
        resource = merge(state.resources[type][id] || {}, resource, { arrayMerge: (dst, src) => src })

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
        if ((state.collections[type] || {})[hash]) {
          return {
            ...state.collections[type][hash],
            // Hydrate resource data.
            data: state.collections[type][hash].data.map((o) => (state.resources[o.type][o.id] || {}).data)
          }
        }

        // Get the collection using the DruxtClient instance.
        const collection = await this.$druxt.getCollection(type, query)

        // Store the collection in the DruxtStore.
        commit('addCollection', { collection: { ...collection }, type, hash })

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
      async getResource ({ commit, dispatch, state }, { type, id, query }) {
        // Get the resource from the store if it's avaialble.
        const storedResource = (state.resources[type] || {})[id] ?
          { ...state.resources[type][id] }
          : null

        // Parse the query.
        const queryObject = getDrupalJsonApiParams(query).getQueryObject()

        // Ensure that includes are in the fields filter.
        if (queryObject.include && typeof (queryObject.fields || {})[type] === 'string') {
          const fields = queryObject.fields[type].split(',')
          const includes = queryObject.include.split(',').filter((s) => !s.includes('.'))
          queryObject.fields[type] = Array.from(
            new Set([...fields, ...includes])
          ).filter((s) => typeof s === 'string').join(',')
        }

        // Hydrate included data based on the include query.
        let included = []
        if (queryObject.include && storedResource) {
          // Request included resources from druxt/getResource.
          const resources =
            await Promise.all(queryObject.include.split(',')
              .filter((s) => Object.keys((storedResource.data.relationships || {})).includes(s))
              .map((key) => {
                let { data } = storedResource.data.relationships[key]
                data = Array.isArray(data) ? data : [data]

                // Get any sub-includes, e.g., `media,media.image` becomes `image`.
                const include = queryObject.include.split(',')
                  .filter((s) => s.startsWith(`${key}.`))
                  .map((s) => s.slice(key.length + 1))
                  .join(',')

                return data.filter((o) => typeof o === 'object' && o).map((o) => {
                  return dispatch('getResource', {
                    type: o.type,
                    id: o.id,
                    query: { ...queryObject, include },
                  })
                })
              })
              .flat()
            )

          // Merge all nested, included resources.
          for (const include of resources) {
            included = [...included, include.data, ...include.included || []]
          }
          storedResource.included = included
        }

        // Return if we have the full resource.
        if ((storedResource || {})._druxt_full) {
          return storedResource
        }
        const isFull = typeof (queryObject.fields || {})[type] !== 'string'

        // Determine if we have all the requested field data.
        let fields = isFull ? true : (queryObject.fields || {})[type]
        if (storedResource && !isFull && fields) {
          const queryFields = fields.split(',')
          const resourceFields = [
            ...Object.keys(((storedResource || {}).data || {}).attributes || {}),
            ...Object.keys(((storedResource || {}).data || {}).relationships || {}),
          ]
          const missingFields = queryFields.filter((key) => !resourceFields.includes(key))
          fields = !!missingFields.length

          // Modify query to load additional fields, if required.
          queryObject.fields[type] = (missingFields || []).join(',') || undefined
        }

        // Request the resource from the DruxtClient if required.
        let resource
        if (!storedResource || fields) {
          resource = await this.$druxt.getResource(type, id, getDrupalJsonApiParams(queryObject))
          commit('addResource', { resource: { ...resource } })
        }

        // Build resource to be returned.
        const result = { ...state.resources[type][id] }

        // Merge included resources into resource.
        if (queryObject.include && ((resource || {}).included || (storedResource || {}).included)) {
          included = [
            ...(resource || {}).included || [],
            ...(storedResource || {}).included || [],
          ]
          result.included = Array.from(new Set(included.filter((o) => (o || {}).id).map((o) => o.id)))
            .map((id) => included.find((o) => o.id === id))
        }

        return result
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
