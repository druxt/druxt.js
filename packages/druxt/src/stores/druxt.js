import merge from 'deepmerge'
import md5 from 'md5'

import { getDrupalJsonApiParams } from '../utils/getDrupalJsonApiParams'


/**
 * The DruxtStore contains methods and utility functions to be utilized by a
 * specific store implementation, e.g., Vuex, Pinia.
 */
class DruxtStore {
  constructor(options = {}) {
    // Setup the method for writting the state values.
    if (options.setState) this.setState = options.setState
    else this.setState = (root, key, value) => root[key] = value
  }

  commit(mutator, payload = {}, app = {}) {
    if (typeof this[mutator] === 'function') this[mutator](payload, app)
    else throw new Error('Mutator is not a function')
  }

  dehydrateResources({ queryObject, resources, prefix, state }) {
    return resources?.map((data) => {
      // Generate a query link for included resources.
      // This is used to determine if the resource is a partial.
      const link = decodeURI(data.links?.self?.href || '')
      const href = typeof queryObject.fields?.[data.type] === 'string'
        ? [link.split('?')[0], `fields[${data.type}]=${queryObject.fields[data.type]}`].join('?')
        : link

      // Commit the included resource.
      this.commit('addResource', {
        prefix,
        resource: {
          data,
          links: { self: { href } },
        },
      }, { state })

      return { id: data.id, type: data.type }
    })
  }

  state() {
    return {
      collections: {},
      resources: {}
    }
  }

  /**
   * @name addCollection
   * @mutator {object} addCollection=collections Adds a JSON:API collection to the Vuex state object.
   * @param {addCollectionContext} context
   */
  addCollection({ collection, type, hash, prefix }, { state }) {
    if (!state.collections[type]) this.setState(state.collections, type, {})
    if (!state.collections[type][hash]) this.setState(state.collections[type], hash, {})

    // Parse the query.
    const link = decodeURI(collection?.links?.self?.href || '')
    const query = link.split('?')[1] || ''
    const queryObject = getDrupalJsonApiParams(query).getQueryObject()

    // Store and dehydrate collection resources.
    collection.data = this.dehydrateResources({ prefix, queryObject, resources: collection.data, state })

    // Extract and store included resources.
    if (collection.included) {
      collection.included = this.dehydrateResources({ prefix, queryObject, resources: collection.included, state })
      delete collection.included
    }

    // Recursively merge new collection data into stored collection.
    collection = merge(state.collections[type][hash][prefix] || {}, collection, { arrayMerge: (dst, src) => src })

    this.setState(state.collections[type][hash], prefix, collection)
  }

  /**
   * @name addResource
   * @mutator {object} addResource=resources Adds a JSON:API resource to the Vuex state object.
   * @param {addResourceContext} context
   *
   * @example @lang js
   * this.$store.commit('druxt/addResource', { resource })
   */
  addResource ({ prefix, resource, hash }, { state }) {
    if (hash) {
      console.warn('[druxt] The `hash` argument for `druxt/addResource` has been deprecated, see https://druxtjs.org/guide/deprecations.html#druxtstore-addresource-hash')
    }

    const { id, type } = resource?.data || {}
    if (!id || !type) {
      // @TODO - Error?
      return
    }

    // Parse the query.
    const link = decodeURI(resource?.links?.self?.href || '')
    const query = link.split('?')[1] || ''
    const queryObject = getDrupalJsonApiParams(query).getQueryObject()

    // Add cache flag to resource.
    const flag = typeof queryObject.fields?.[resource?.data?.type] === 'string' ? '_druxt_partial' : '_druxt_full'
    resource[flag] = Date.now()

    // Ensure Resource type array is reactive.
    if (!state.resources[type]) this.setState(state.resources, type, {})
    if (!state.resources[type][id]) this.setState(state.resources[type], id, {})

    // Extract and store included data.
    if (resource.included) {
      this.dehydrateResources({ prefix, queryObject, resources: resource.included, state })
      delete resource.included
    }

    // Recursively merge new resource data into stored resource.
    resource = merge(state.resources[type][id][prefix] || {}, resource, { arrayMerge: (dst, src) => src })

    this.setState(state.resources[type][id], prefix, resource)
  }

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
   *   bypassCache: false
   * })
   */
  async getCollection ({ type, query, prefix, bypassCache = false }, { $druxt, state }) {
    // Generate a hash using query data excluding the 'fields' and 'include' data.
    const queryObject = getDrupalJsonApiParams(query).getQueryObject()
    const hash = query ? md5(JSON.stringify({ ...queryObject, fields: {}, include: [] })) : '_default'

    // If collection hash exists, re-hydrate and return the data.
    if (!bypassCache && state.collections?.[type]?.[hash]?.[prefix]) {
      // return {
      //   ...state.collections[type][hash][prefix],
      //   // Hydrate resource data.
      //   data: state.collections[type][hash][prefix].data.map((o) => state.resources[o.type][o.id]?.[prefix]?.data)
      // }
    }


    // Get the collection using the DruxtClient instance.
    const collection = await $druxt.getCollection(type, query, prefix)

    // Store the collection in the DruxtStore.
    this.commit('addCollection', { collection: { ...collection }, type, hash, prefix }, { state })

    return collection
  }

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
   * const resource = await this.$store.dispatch('druxt/getResource', {
   *   type: 'node--article',
   *   id,
   *   bypassCache: false
   * })
   */
  async getResource ({ type, id, query, prefix, bypassCache = false }, { $druxt, state }) {
    // Get the resource from the store if it's avaialble.
    const storedResource = state.resources[type]?.[id]?.[prefix] ?
      { ...state.resources[type][id][prefix] }
      : null

    // Parse the query.
    const queryObject = getDrupalJsonApiParams(query).getQueryObject()
    queryObject.include = Array.isArray(queryObject.include)
      ? queryObject.include.join(',')
      : queryObject.include

    // Ensure that includes are in the fields filter.
    if (queryObject.include && typeof queryObject.fields?.[type] === 'string') {
      const fields = queryObject.fields[type].split(',').filter((s) => s)
      const includes = queryObject.include.split(',').filter((s) => s && !s.includes('.'))
      queryObject.fields[type] = Array.from(
        new Set([...fields, ...includes])
      ).filter((s) => s).join(',')
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
              // @TODO - Reimplement this!!!
              console.log('@TODO - Hydrate included data', o, include)
    //           return dispatch('getResource', {
    //             id: o.id,
    //             prefix,
    //             type: o.type,
    //             query: { ...queryObject, include },
    //           })
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
    if (!bypassCache && storedResource?._druxt_full) {
      return storedResource
    }
    const isFull = typeof queryObject.fields?.[type] !== 'string'

    // Determine if we have all the requested field data.
    let fields = isFull ? true : queryObject.fields?.[type]
    if (storedResource && !isFull && fields) {
      const queryFields = fields.split(',')
      const resourceFields = [
        ...Object.keys(storedResource?.data?.attributes || {}),
        ...Object.keys(storedResource?.data?.relationships || {}),
      ]
      const missingFields = queryFields.filter((key) => !resourceFields.includes(key))
      fields = !!missingFields.length

      // Modify query to load additional fields, if required.
      queryObject.fields[type] = missingFields?.join(',') || undefined
    }

    // Request the resource from the DruxtClient if required.
    let resource
    if (bypassCache || !storedResource || fields) {
      try {
        resource = await $druxt.getResource(type, id, getDrupalJsonApiParams(queryObject), prefix)
        this.commit('addResource', { prefix, resource: { ...resource } }, { state })
      } catch(e) {
        // Do nothing, just don't error.
      }
    }

    // Build resource to be returned.
    const result = { ...state.resources[type]?.[id]?.[prefix] }

    // Merge included resources into resource.
    if (queryObject.include && (resource?.included || storedResource?.included)) {
      included = [
        ...resource?.included || [],
        ...storedResource?.included || [],
      ]
      result.included = Array.from(new Set(included.filter((o) => o?.id).map((o) => o.id)))
        .map((id) => included.find((o) => o.id === id))
    }

    return result
  }

  /**
   * @name flushCollection
   * @mutator {object} flushCollection=collections Removes JSON:API collections from the Vuex state object.
   * @param {flushCollectionContext} context
   *
   * @example @lang js
   * // Flush all collections.
   * this.$store.commit('druxt/flushCollection', {})
   *
   * // Flush target collection.
   * this.$store.commit('druxt/flushCollection', { type, hash, prefix })
   */
  flushCollection ({ type, hash, prefix }, { state }) {
    if (!type) this.setState(state, 'collections', {})
    else if (type && !hash && !prefix) this.setState(state.collections, type, {})
    else if (type && hash && !prefix) this.setState(state.collections[type], hash, {})
    else if (type && hash && prefix) this.setState(state.collections[type][hash], prefix, {})
  }

  /**
   * @name flushResource
   * @mutator {object} flushResource=resources Removes JSON:API resources from the Vuex state object.
   * @param {flushResourceContext} context
   *
   * @example @lang js
   * // Flush all resources.
   * this.$store.commit('druxt/flushResource', {})
   *
   * // Flush target resource.
   * this.$store.commit('druxt/flushResource', { id, type, prefix, hash })
   */
  flushResource ({ type, id, prefix }, { state }) {
    if (!type) this.setState(state, 'resources', {})
    else if (type && !id && !prefix) this.setState(state.resources, type, {})
    else if (type && id && !prefix) this.setState(state.resources[type], id, {})
    else if (type && id && prefix) this.setState(state.resources[type][id], prefix, {})
  }

  // @TODO - Note about deprecated method.
  // DruxtStore: () => {
  //   console.error('@TODO - Deprecation warning and upgrade path.')
  // }
}

export { DruxtStore }
