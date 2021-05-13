import axios from 'axios'
import { stringify } from 'querystring'

/**
 * Druxt JSON:API client.
 */
class DruxtClient {
  /**
   * DruxtClient constructor.
   *
   * - Validates module options.
   * - Sets up Axios instance.
   * - Sets up options.
   *
   * @example @lang js
   * const DruxtClient = require('druxt').DruxtCllient
   * const druxt = new DruxtClient('https://demo-api.druxtjs.org', {})
   *
   * @param {string} baseUrl - The Drupal base URL.
   * @param {DruxtClientOptions} [options] - The DruxtClient options object.
   */
  constructor(baseUrl, options = {}) {
    // Check for URL.
    if (!baseUrl) {
      throw new Error('The \'baseUrl\' parameter is required.')
    }

    /**
     * Axios instance.
     *
     * @see {@link https://github.com/axios/axios#instance-methods}
     * @type {object}
     */
    this.axios = {}

    // Use Axios instance if provided.
    if (typeof options.axios === 'function') {
      this.axios = options.axios
    }

    // Else, setup new instance of Axios.
    else {
      this.axios = axios.create({
        ...options.axios || {},
        baseURL: baseUrl,
      })
    }

    /**
     * Druxt base options.
     * @type {object}
     * @private
     */
    this.options = {
      endpoint: '/jsonapi',
      jsonapiResourceConfig: 'jsonapi_resource_config--jsonapi_resource_config',

      ...options
    }
  }

  /**
   * Add headers to the Axios instance.
   *
   * @example @lang js
   * this.$druxt.addHeaders({ 'Authorization': `Basic ${token}` })
   *
   * @param {object} headers - An object containing HTTP headers.
   */
  addHeaders (headers) {
    if (typeof headers === 'undefined') {
      return false
    }

    for (const name in headers) {
      this.axios.defaults.headers.common[name] = headers[name]
    }
  }

  /**
   * Build query URL.
   *
   * @example @lang js
   * const query = new DrupalJsonApiParams()
   * query.addFilter('status', '1')
   * const queryUrl = this.$druxt.buildQueryUrl(resourceUrl, query)
   *
   * @param {string} url - The base query URL.
   * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
   *
   * @return {string} The URL with query string.
   */
  buildQueryUrl (url, query) {
    if (!query) {
      return url
    }

    // If Query is string...
    if (typeof query === 'string') {
      return query.charAt(0) === '?' ? url + query : [url, query].join('?')
    }

    // If Query is object with 'getQueryString' function, (e.g., drupal-jsonapi-params)...
    if (typeof query === 'object' && typeof query.getQueryString === 'function') {
      return [url, query.getQueryString()].join('?')
    }

    // If query is object...
    if (typeof query === 'object' && Object.keys(query).length) {
      return [url, stringify(query)].join('?')
    }

    // Else...
    return url
  }

  /**
   * Check response for permissions.
   *
   * @todo - Move this to utils?
   *
   * @param {object} res - Axios GET request response object.
   *
   * @private
   */
  checkPermissions (res) {
    // Error handling: Required permissions.
    if (res.data.meta && res.data.meta.omitted) {
      const permissions = {}

      delete res.data.meta.omitted.links.help
      for (const key in res.data.meta.omitted.links) {
        const link = res.data.meta.omitted.links[key]
        const match = link.meta.detail.match(/'(.*?)'/)
        if (match && match[1]) {
          permissions[match[1]] = true
        }
      }

      if (Object.keys(permissions).length) {
        throw new TypeError(`${res.data.meta.omitted.detail}\n\n Required permissions: ${Object.keys(permissions).join(', ')}.`)
      }
    }
  }

  /**
   * Get a collection of resources from the JSON:API server.
   *
   * @param {string} type - The JSON:API Resource type.
   * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
   *
   * @returns {object} The JSON:API collection response.
   *
   * @example @lang js
   * const collection = await this.$druxt.getCollection('node--recipe')
   */
  async getCollection(type, query) {
    const { href } = await this.getIndex(type)
    if (!href) {
      return false
    }

    const url = this.buildQueryUrl(href, query)

    const res = await this.axios.get(url)

    this.checkPermissions(res)

    return res.data
  }

  /**
   * Get all resources of a collection.
   *
   * @param {string} type - The JSON:API Resource type.
   * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
   *
   * @returns {object[]} An array of JSON:API collections.
   *
   * @example @lang js
   * const collections = await this.$druxt.getCollectionAll('node--recipe', 'fields[node--recipe]=title')
   */
  async getCollectionAll(type, query) {
    const collections = []

    let res = await this.getCollection(type, query)
    collections.push(res)

    while (((res.links || {}).next || {}).href) {
      query = res.links.next.href.split('?')[1]
      res = await this.getCollection(type, query)
      collections.push(res)
    }

    return collections
  }

  /**
   * Get index of all available resources, or the optionally specified resource.
   *
   * @example @lang js
   * const { href } = await this.$druxt.getIndex('node--article')
   *
   * @param {string} resource - (Optional) A specific resource to query.
   *
   * @returns {object} The resource index object or the specified resource.
   */
  async getIndex(resource) {
    if (this.index && !resource) {
      return this.index
    }

    if (this.index && resource) {
      return this.index[resource] ? this.index[resource] : false
    }

    const index = await this.axios.get(this.options.endpoint)
    this.index = index.data.links

    // Use JSON API resource config to decorate the index.
    if (this.index[this.options.jsonapiResourceConfig]) {
      const resources = await this.axios.get(this.index[this.options.jsonapiResourceConfig].href)
      for (const resourceType in resources.data.data) {
        const resource = resources.data.data[resourceType]
        const internal = resource.attributes.drupal_internal__id.split('--')

        const item = {
          resourceType: resource.attributes.resourceType,
          entityType: internal[0],
          bundle: internal[1],
          resourceFields: resource.attributes.resourceFields
        }

        const id = [item.entityType, item.bundle].join('--')
        this.index[id] = {
          ...item,
          ...this.index[id]
        }
      }
    }

    if (resource) {
      return this.index[resource] ? this.index[resource] : false
    }

    return this.index
  }

  /**
   * Get a JSON:API resource by type and ID.
   *
   * @example @lang js
   * const data = await this.$druxt.getResource('node--article', id)
   *
   * @param {string} type - The JSON:API Resource type.
   * @param {string} id - The Drupal resource UUID.
   * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
   *
   * @returns {object} The JSON:API resource data.
   */
  async getResource(type, id, query) {
    if (!id || !type) {
      return false
    }

    let { href } = await this.getIndex(type)
    if (!href) {
      href = this.options.endpoint + '/' + type.replace('--', '/')
    }

    const url = this.buildQueryUrl(`${href}/${id}`, query)
    try {
      const resource = await this.axios.get(url)
      return resource.data
    } catch (e) {
      return false
    }
  }
}

export { DruxtClient }

 /**
  * DruxtClient options object.
  *
  * @typedef {object} DruxtClientOptions
  *
  * @param {object} [axios] - Axios instance settings.
  * @param {string} [endpoint=jsonapi] - The JSON:API endpoint.
  * @param {string} [jsonapiResourceConfig=jsonapi_resource_config--jsonapi_resource_config] -
  *   The JSON:API resource config type, used for [JSON:API Extras](https://www.drupal.org/project/jsonapi_extras) support.
  *
  * @see {@link https://github.com/axios/axios#request-config}
  *
  * @example @lang js
  * {
  *   axios: {
  *     headers: { 'X-Custom-Header': true },
  *   },
  *   endpoint: 'api',
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
