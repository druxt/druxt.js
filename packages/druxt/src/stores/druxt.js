import merge from 'deepmerge'
import md5 from 'md5'
import Vue from 'vue'

import { getDrupalJsonApiParams } from '../utils/getDrupalJsonApiParams'

const dehydrateResources = ({ commit, queryObject, resources, prefix }) => {
  return (resources || []).map((data) => {
    // Generate a query link for included resources.
    // This is used to determine if the resource is a partial.
    const link = decodeURI(((data.links || {}).self || {}).href || '')
    const href = typeof (queryObject.fields || {})[data.type] === 'string'
      ? [link.split('?')[0], `fields[${data.type}]=${queryObject.fields[data.type]}`].join('?')
      : link

    // Commit the included resource.
    commit('druxt/addResource', {
      prefix,
      resource: {
        data,
        links: { self: { href } },
      },
    })

    return { id: data.id, type: data.type }
  })
}

// The key a collection is stored under: its query without the fields and includes.
const collectionHash = (query) => {
  if (!query) return '_default'
  const queryObject = getDrupalJsonApiParams(query).getQueryObject()
  return md5(JSON.stringify({ ...queryObject, fields: {}, include: [] }))
}

// Removes the entries a flush names from a keyed tree, and nothing when they were never stored.
const flush = (tree, key, keys, leaf) => {
  const byKey = tree[key]
  if (!byKey) return
  // An empty string is a real key, so only an omitted selector widens the flush.
  if (!keys.length && leaf === undefined) return Vue.delete(tree, key)
  for (const k of keys.length ? keys : Object.keys(byKey)) {
    if (!byKey[k]) continue
    if (leaf !== undefined) Vue.delete(byKey[k], leaf)
    else Vue.delete(byKey, k)
  }
}

const DruxtStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxt'

  // In-flight requests for this store, kept out of the reactive state. A flush
  // drops them and moves the generation on, so a request started before it is
  // neither joined by a later dispatch nor stored when it resolves.
  const inFlight = new Map()
  const generation = { value: 0 }
  const flushInFlight = () => {
    inFlight.clear()
    generation.value += 1
  }
  const share = (key, request) => {
    if (!inFlight.has(key)) {
      const promise = request()
      const clear = () => { if (inFlight.get(key) === promise) inFlight.delete(key) }
      inFlight.set(key, promise)
      promise.then(clear, clear)
    }
    return inFlight.get(key)
  }

  /**
   * The DruxtStore Vuex module.
   *
   * Provides a Vuex state object, mutations and actions for interacting with the DruxtClient.
   *
   * @name druxt
   * @module druxt
   *
   * @see https://druxtjs.org/explanation/druxt-store
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
       * @param {object} state - The Vuex state object.
       * @param {addCollectionPayload} payload - The mutation payload.
       *
       * @example @lang js
       * this.$store.commit('druxt/addCollection', { collection, type, hash })
       */
      addCollection (state, { collection, type, hash, prefix }) {
        if (!state.collections[type]) Vue.set(state.collections, type, {})
        if (!state.collections[type][hash]) Vue.set(state.collections[type], hash, {})

        // Parse the query.
        const link = decodeURI((((collection || {}).links || {}).self || {}).href || '')
        const query = link.split('?')[1] || ''
        const queryObject = getDrupalJsonApiParams(query).getQueryObject()

        // Store and dehydrate collection resources.
        collection.data = dehydrateResources({ commit: this.commit, prefix, queryObject, resources: collection.data })

        // Keep the dehydrated refs (don't delete) so a cache hit in
        // getCollection can re-hydrate `included`, same as `data`.
        if (collection.included) {
          collection.included = dehydrateResources({ commit: this.commit, prefix, queryObject, resources: collection.included })
        }

        // Recursively merge new collection data into stored collection.
        // The hash ignores `include`, so queries that differ only by their
        // includes share a slot. deepmerge keeps a key the incoming response
        // does not carry, which would leave the previous query's `included`
        // refs behind for getCollection to hydrate and return unasked for.
        const hadIncluded = !!collection.included
        collection = merge(state.collections[type][hash][prefix] || {}, collection, { arrayMerge: (dst, src) => src })
        if (!hadIncluded) delete collection.included

        Vue.set(state.collections[type][hash], prefix, collection)
      },

      /**
       * @name addResource
       * @mutator {object} addResource=resources Adds a JSON:API resource to the Vuex state object.
       * @param {object} state - The Vuex state object.
       * @param {addResourcePayload} payload - The mutation payload.
       *
       * @example @lang js
       * this.$store.commit('druxt/addResource', { resource })
       */
      addResource (state, { prefix, resource, hash }) {
        if (hash) {
          console.warn('[druxt] The `hash` argument for `druxt/addResource` has been deprecated, see https://druxtjs.org/modules/druxt/deprecations#druxtstore-addresource-hash')
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
        if (!state.resources[type][id]) Vue.set(state.resources[type], id, {})

        // Extract and store included data.
        if (resource.included) {
          dehydrateResources({ commit: this.commit, prefix, queryObject, resources: resource.included })
          delete resource.included
        }

        // Recursively merge new resource data into stored resource.
        resource = merge(state.resources[type][id][prefix] || {}, resource, { arrayMerge: (dst, src) => src })

        Vue.set(state.resources[type][id], prefix, resource)
      },

      /**
       * @name flushCollection
       * @mutator {object} flushCollection=collections Removes JSON:API collections from the Vuex state object.
       * @param {object} state - The Vuex state object.
       * @param {flushCollectionPayload} payload - The mutation payload.
       *
       * @example @lang js
       * // Flush all collections.
       * this.$store.commit('druxt/flushCollection', {})
       *
       * // Flush target collection, by the query it was fetched with.
       * this.$store.commit('druxt/flushCollection', { type, query, prefix })
       *
       * // Flush every collection of a type in one language.
       * this.$store.commit('druxt/flushCollection', { type, prefix })
       */
      flushCollection (state, { type, hash, query, prefix } = {}) {
        flushInFlight()
        if (!type) return Vue.set(state, 'collections', {})
        const key = hash !== undefined ? hash : (query !== undefined ? collectionHash(query) : undefined)
        flush(state.collections, type, key !== undefined ? [key] : [], prefix)
      },

      /**
       * @name flushResource
       * @mutator {object} flushResource=resources Removes JSON:API resources from the Vuex state object.
       * @param {object} state - The Vuex state object.
       * @param {flushResourcePayload} payload - The mutation payload.
       *
       * @example @lang js
       * // Flush all resources.
       * this.$store.commit('druxt/flushResource', {})
       *
       * // Flush target resource.
       * this.$store.commit('druxt/flushResource', { id, type, prefix })
       */
      flushResource (state, { type, id, prefix } = {}) {
        flushInFlight()
        if (!type) return Vue.set(state, 'resources', {})
        flush(state.resources, type, id !== undefined ? [id] : [], prefix)
      }
    },

    /**
     * Vuex Actions.
     */
    actions: {
      /**
       * Clear every Druxt cache.
       *
       * Clears the DruxtClient's caches and the server's process cache, and
       * flushes each registered Druxt store.
       *
       * @name clearCache
       * @action clearCache
       * @param {object} context - The Vuex action context.
       * @param {Function} context.commit - Commits mutations to the store.
       *
       * @example @lang js
       * await this.$store.dispatch('druxt/clearCache')
       */
      clearCache ({ commit }) {
        if (this.$druxt && typeof this.$druxt.clearCache === 'function') this.$druxt.clearCache()

        commit('flushCollection', {})
        commit('flushResource', {})
        // Stores from other Druxt modules, flushed only when the site uses them.
        for (const mutation of ['druxt/views/flushResults', 'druxtMenu/flushEntities', 'druxtRouter/flushRoutes']) {
          if (this._mutations[mutation]) commit(mutation, {}, { root: true })
        }
      },

      /**
       * Get collection of resources.
       *
       * @name getCollection
       * @action getCollection=collections
       * @param {object} context - The Vuex action context.
       * @param {Function} context.commit - Commits mutations to the store.
       * @param {object} context.state - The Vuex module state.
       * @param {getCollectionContext} payload - The action parameters.
       * @return {object[]} Array of Drupal JSON:API resource data.
       *
       * @example @lang js
       * // Load all currently published Articles.
       * const resources = await this.$store.dispatch('druxt/getCollection', {
       *   type: 'node--article',
       *   query: new DrupalJsonApiParams().addFilter('status', '1'),
       *   bypassCache: false
       * })
       */
      async getCollection ({ commit, state }, { type, query, prefix, bypassCache = false }) {
        const hash = collectionHash(query)

        // If collection hash exists, re-hydrate and return the data.
        if (!bypassCache && ((state.collections[type] || {})[hash] || {})[prefix]) {
          const cached = state.collections[type][hash][prefix]
          const hydrate = (o) => (((state.resources[o.type] || {})[o.id] || {})[prefix] || {}).data
          const data = cached.data.map(hydrate)
          const included = cached.included ? cached.included.map(hydrate) : undefined
          // A ref with no resource behind it means flushResource ran since the
          // collection was stored; treat the hit as a miss and fetch again.
          if (data.every((o) => o) && (included || []).every((o) => o)) {
            return {
              ...cached,
              data,
              ...(included ? { included } : {}),
            }
          }
        }

        // Identical concurrent dispatches share one request and one commit.
        const key = JSON.stringify(['collection', prefix, type, hash, getDrupalJsonApiParams(query).getQueryObject()])
        return share(key, async () => {
          const since = generation.value
          // Get the collection using the DruxtClient instance.
          const collection = await this.$druxt.getCollection(type, query, prefix)

          // Store the collection in the DruxtStore, unless a flush happened meanwhile.
          if (since === generation.value) commit('addCollection', { collection: { ...collection }, type, hash, prefix })

          return collection
        })
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
       * @param {object} context - The Vuex action context.
       * @param {Function} context.commit - Commits mutations to the store.
       * @param {Function} context.dispatch - Dispatches other store actions.
       * @param {object} context.state - The Vuex module state.
       * @param {getResourceContext} payload - The action parameters.
       * @return {object} The full JSON:API document for the resource; the resource itself is
       *   on the `data` property, e.g. `resource.data.attributes`.
       *
       * @example @lang js
       * const resource = await this.$store.dispatch('druxt/getResource', {
       *   type: 'node--article',
       *   id,
       *   bypassCache: false
       * })
       */
      async getResource ({ commit, dispatch, state }, { type, id, query, prefix, bypassCache = false }) {
        // Get the resource from the store if it's available.
        const storedResource = ((state.resources[type] || {})[id] || {})[prefix] ?
          { ...state.resources[type][id][prefix] }
          : null

        // Parse the query.
        const queryObject = getDrupalJsonApiParams(query).getQueryObject()
        queryObject.include = Array.isArray(queryObject.include)
          ? queryObject.include.join(',')
          : queryObject.include

        // Ensure that includes are in the fields filter.
        if (queryObject.include && typeof (queryObject.fields || {})[type] === 'string') {
          const fields = queryObject.fields[type].split(',').filter((s) => s)
          const includes = queryObject.include.split(',').filter((s) => s && !s.includes('.'))
          queryObject.fields[type] = Array.from(
            new Set([...fields, ...includes])
          ).filter((s) => s).join(',')
        }

        // Hydrate included data based on the include query. A bypass takes its includes from the fresh response.
        let included = []
        if (queryObject.include && storedResource && !bypassCache) {
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
                    id: o.id,
                    prefix,
                    type: o.type,
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
        if (!bypassCache && (storedResource || {})._druxt_full) {
          return storedResource
        }
        const isFull = typeof (queryObject.fields || {})[type] !== 'string'

        // Determine if we have all the requested field data.
        let fields = isFull ? true : (queryObject.fields || {})[type]
        if (storedResource && !isFull && fields && !bypassCache) {
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
        const since = generation.value
        if (bypassCache || !storedResource || fields) {
          try {
            // Identical concurrent dispatches share one request and one commit.
            const key = JSON.stringify(['resource', prefix, type, id, queryObject])
            resource = await share(key, async () => {
              const started = generation.value
              const response = await this.$druxt.getResource(type, id, getDrupalJsonApiParams(queryObject), prefix)
              // Stored unless a flush happened meanwhile.
              if (started === generation.value) commit('addResource', { prefix, resource: { ...response } })
              return response
            })
          } catch(e) {
            // Do nothing, just don't error.
          }
        }

        // Build resource to be returned: the stored entry, or the response when
        // a flush during the wait kept it out of the store and may have left a stale entry.
        const stored = ((state.resources[type] || {})[id] || {})[prefix]
        const result = { ...(since === generation.value && stored ? stored : (resource || stored)) }

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
 * @typedef {object} addCollectionPayload
 *
 * @param {object} collection - A collection of JSON:API resources.
 * @param {string} type - The JSON:API collection resource type.
 * @param {string} hash - An md5 hash of the query string.
 * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
 *
 * @example @lang js
 * {
 *   collection: {
 *     jsonapi: {},
 *     data: [{}],
 *     links: {}
 *   },
 *   type: 'node--page',
 *   hash: '_default',
 *   prefix: 'en'
 * }
 */

/**
 * Parameters for the `addResource` mutation.
 *
 * @typedef {object} addResourcePayload
 *
 * @param {string} [hash] - (Deprecated) The Vuex cache hash, ignored by the mutation. See {@link https://druxtjs.org/modules/druxt/deprecations|deprecations}.
 * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
 * @param {object} resource - The JSON:API resource.
 *
 * @example @lang js
 * {
 *   prefix: 'en',
 *   resource: {
 *     jsonapi: {},
 *     data: {},
 *     links: {}
 *   },
 * }
 */

/**
 * Parameters for the `flushCollection` mutation.
 *
 * @typedef {object} flushCollectionPayload
 *
 * @param {string} [type] - (Optional) The JSON:API collection resource type. Every collection when omitted.
 * @param {DruxtClientQuery} [query] - (Optional) The query the collection was fetched with.
 * @param {string} [hash] - (Optional) The stored key of one query, in place of `query`.
 * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode. Every prefix when omitted.
 *
 * @example @lang js
 * {
 *   type: 'node--page',
 *   query: new DrupalJsonApiParams().addFilter('status', '1'),
 *   prefix: 'en'
 * }
 */

/**
 * Parameters for the `flushResource` mutation.
 *
 * @typedef {object} flushResourcePayload
 *
 * @param {string} [type] - The JSON:API Resource type.
 * @param {string} [id] - The Drupal resource UUID.
 * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
 *
 * @example @lang js
 * {
 *   type: 'node--page',
 *   id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
 *   prefix: 'en'
 * }
 */

/**
 * Parameters for the `getCollection` action.
 *
 * @typedef {object} getCollectionContext
 *
 * @param {string} type - The JSON:API collection resource type.
 * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
 * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
 * @param {boolean} [bypassCache] - (Optional) Bypass the Vuex cached collection.
 *
 * @example @lang js
 * {
 *   type: 'node--page',
 *   query: new DrupalJsonApiParams().addFilter('status', '1'),
 *   bypassCache: false
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
 * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
 * @param {boolean} [bypassCache] - (Optional) Bypass the Vuex cached resource.
 *
 * @example @lang js
 * {
 *   type: 'node--page',
 *   id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
 *   prefix: 'en',
 *   bypassCache: false
 * }
 */

/**
 * A correctly formatted JSON:API query string or object.
 *
 * @typedef {string|object} DruxtClientQuery
 *
 * @example @lang js
 * 'page[limit]=5&page[offset]=5'
 *
 * @example @lang js
 * new DrupalJsonApiParams().addPageLimit(5)
 *
 * @see {@link https://www.npmjs.com/package/drupal-jsonapi-params}
 */
