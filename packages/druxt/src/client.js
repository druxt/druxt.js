import axios from 'axios'
import { stringify } from 'querystring'
import consola from 'consola'

/**
 * The Druxt JSON:API client.
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
    // Consola logger.
    this.log = consola.create({ defaults: {
      tag: 'DruxtClient'
    }})

    // Check for URL.
    if (!baseUrl) {
      throw new Error('The \'baseUrl\' parameter is required.')
    }

    /**
     * The Axios instance.
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
        // Set baseURL if proxy is not enabled.
        baseURL: baseUrl && !(options.proxy || {}).api ? baseUrl : undefined
      })
    }

    // If Debug mode is enabled, add an Axios interceptor to log out all
    // requests and errors.
    if (options.debug) {
      const log = this.log
      // @TODO - Add test coverage.
      this.axios.interceptors.request.use((config) => {
        log.info(config.url)
        return config
      }, (error) => {
        log.error(error)
        return Promise.reject(error)
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

    /**
     * JSON:API Index.
     * @type {object}
     */
    this.index = {}
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
    if (typeof query === 'object' && typeof query.getQueryString === 'function' && (query = query.getQueryString())) {
      return [url, query].join('?')
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
        const err = {
          response: {
            statusText: res.data.meta.omitted.detail,
            data: {
              errors: [{ detail: `Required permissions:\n - ${Object.keys(permissions).join('\n - ')}` }]
            }
          }
        }
        throw err
      }
    }
  }

  /**
   * Create a JSON:API resource.
   *
   * @example @lang js
   * await this.$druxt.createResource(
   *   {
   *     type: 'node--page',
   *     attributes: {},
   *     relationships: {}
   *   },
   *   'en'
   * )
   *
   * @param {object} resource - The JSON:API resource object
   * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
   *
   * @returns {object} The response data
   */
  async createResource(resource, prefix = '') {
    if (resource.id) {
      return this.updateResource(resource, prefix)
    }

    const { href } = await this.getIndex(resource.type, prefix)
    if (!href) {
      return false
    }

    let response
    try {
      response = await this.axios.post(
        href,
        { data: resource },
        {
          headers: {
            'Content-Type': 'application/vnd.api+json'
          }
        }
      )
    } catch (err) {
      this.error(err, { url: href })
    }

    return response
  }

  /**
   * Throw a formatted error.
   *
   * @param {object} err - The error object
   *
   * @throws {Error} A formatted error.
   */
  error(err, context = {}) {
    let { url } = context
    if (!url && ((err.response || {}).config || {}).url) {
      url = err.response.config.url
    }

    const title = [
      (err.response || {}).status,
      (err.response || {}).statusText || err.message
    ].filter((s) => s).join(': ')
    const meta = { url: url && [this.options.baseUrl, url].join('') }

    // Build message.
    let message = [title]

    // Add meta information.
    if (Object.values(meta).filter((o) => o).length) {
      message.push(Object.entries(meta).filter(([, v]) => v).map(([key, value]) => `${key.toUpperCase()}: ${value}`).join('\n'))
    }

    // Add main error details.
    if (((((err.response || {}).data || {}).errors || [])[0] || {}).detail) {
      message.push(err.response.data.errors[0].detail)
    }

    const error = Error(message.join('\n\n'))
    error.response = err.response
    error.druxt = context
    throw error
  }

  /**
   * Execute an Axios GET request, with permission checking and error handling.
   *
   * @param {string} url - The URL to GET.
   * @param {object} options - An Axios options object.
   *
   * @returns {object} The Axios response.
   */
  async get(url, options) {
    try {
      const res = await this.axios.get(url, options)

      // Check that the response hasn't omitted data due to missing permissions.
      this.checkPermissions(res)

      return res
    } catch(err) {
      // Throw formatted error.
      this.error(err, { url })
    }
  }

  /**
   * Get a collection of resources from the JSON:API server.
   *
   * @param {string} type - The JSON:API Resource type.
   * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
   * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
   *
   * @returns {object} The JSON:API collection response.
   *
   * @example @lang js
   * const collection = await this.$druxt.getCollection(
   *   'node--recipe',
   *   undefined,
   *   'en'
   * )
   */
  async getCollection(type, query, prefix) {
    const { href } = await this.getIndex(type, prefix)
    if (!href) {
      return false
    }

    const url = this.buildQueryUrl(href, query)

    const { data } = await this.get(url)
    return data
  }

  /**
   * Get all resources of a collection.
   *
   * @param {string} type - The JSON:API Resource type.
   * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
   * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
   *
   * @returns {object[]} An array of JSON:API collections.
   *
   * @example @lang js
   * const collections = await this.$druxt.getCollectionAll(
   *   'node--recipe',
   *   'fields[node--recipe]=title',
   *   'en'
   * )
   */
  async getCollectionAll(type, query, prefix) {
    const collections = []

    let res = await this.getCollection(type, query, prefix)
    collections.push(res)

    while (((res.links || {}).next || {}).href) {
      query = res.links.next.href.split('?')[1]
      res = await this.getCollection(type, query, prefix)
      collections.push(res)
    }

    return collections
  }

  /**
   * Get index of all available resources, or the optionally specified resource.
   *
   * @example @lang js
   * const { href } = await this.$druxt.getIndex('node--article', 'en')
   *
   * @param {string} [resource] - (Optional) A specific resource to query.
   * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
   *
   * @returns {object} The resource index object or the specified resource.
   */
  async getIndex(resource, prefix) {
    if ((this.index || {})[prefix] && !resource) {
      return this.index[prefix]
    }

    if ((this.index || {})[prefix] && resource) {
      return this.index[prefix][resource] ? this.index[prefix][resource] : false
    }

    const url = [prefix, this.options.endpoint].join('')
    const { data } = await this.get(url)
    let index = data.links

    // Throw error if index is invalid.
    if (typeof index !== 'object') {
      const err = { response: { statusText: 'Invalid JSON:API endpoint' }}
      this.error(err, { url })
    }

    // Remove Base URL from the resource URL.
    const baseUrl = this.options.baseUrl
    index = Object.fromEntries(Object.entries(index).map(([key, value]) => {
      value.href = value.href.replace(baseUrl, '')
      return [key, value]
    }))

    // Use JSON:API resource config to decorate the index.
    // @TODO - Add test coverage.
    if (index[this.options.jsonapiResourceConfig]) {
      let resources = []

      // Get JSON:API resource config if permissions setup correctly.
      try {
        resources = (await this.get(index[this.options.jsonapiResourceConfig].href)).data.data
      } catch(err) {
        this.log.warn(err.message)
      }

      for (const resourceType in resources) {
        const resource = resources[resourceType]
        const internal = resource.attributes.drupal_internal__id.split('--')

        const item = {
          resourceType: resource.attributes.resourceType,
          entityType: internal[0],
          bundle: internal[1],
          resourceFields: resource.attributes.resourceFields
        }

        const id = [item.entityType, item.bundle].join('--')
        index[id] = {
          ...item,
          ...index[id]
        }
      }
    }

    // Set index.
    this.index[prefix] = index

    return resource ? this.index[prefix][resource] || false : this.index[prefix]
  }

  /**
   * Get the related resources from a specified JSON:API resource.
   *
   * @example @lang js
   * const related = this.$druxt.getRelated(
   *   'node--page',
   *   id, 'uid',
   *   undefined,
   *   'en'
   * )
   *
   * @param {string} type - The JSON:API Resource type.
   * @param {string} id - The Drupal resource UUID.
   * @param {string} related - The relationship name.
   * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
   * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
   *
   * @returns {object} The related JSON:API resource(s).
   */
  async getRelated(type, id, related, query, prefix = '') {
    if (!id || !type || !related) {
      return false
    }

    let { href } = await this.getIndex(type, prefix)
    if (!href) {
      href = this.options.endpoint + '/' + type.replace('--', '/')
    }

    const url = this.buildQueryUrl(`${href}/${id}/${related}`, query)
    const { data } = await this.get(url)
    return data
  }

  /**
   * Get a JSON:API resource by type and ID.
   *
   * @example @lang js
   * const data = await this.$druxt.getResource(
   *   'node--article',
   *   id,
   *   undefined,
   *   'en'
   * )
   *
   * @param {string} type - The JSON:API Resource type.
   * @param {string} id - The Drupal resource UUID.
   * @param {DruxtClientQuery} [query] - A correctly formatted JSON:API query string or object.
   * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
   *
   * @returns {object} The JSON:API resource data.
   * @todo update method to take a context object instead of 4 parameters.
   */
  async getResource(type, id, query, prefix) {
    if (!id || !type) {
      return false
    }

    let { href } = await this.getIndex(type, prefix)
    // @TODO - Add test coverage.
    if (!href) {
      href = this.options.endpoint + '/' + type.replace('--', '/')
    }

    const url = this.buildQueryUrl([href, id].join('/'), query)
    const { data } = await this.get(url)
    return data
  }

  /**
   * Update a JSON:API resource.
   *
   * @example @lang js
   * await this.$druxt.updateResource(
   *   {
   *     type: 'node--page',
   *     id,
   *     attributes: {},
   *     relationships: {}
   *   },
   *   'en'
   * )
   *
   * @param {object} resource - The JSON:API resource object
   * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
   *
   * @returns {object} The response data
   */
   async updateResource(resource, prefix) {
    const { href } = await this.getIndex(resource.type, prefix)
    if (!href) {
      return false
    }
    const url = [href, resource.id].join('/')

    let response
    try {
      response = await this.axios.patch(
        url,
        { data: resource },
        {
          headers: {
            'Content-Type': 'application/vnd.api+json'
          }
        }
      )
    } catch (err) {
      this.error(err)
    }

    // @TODO - Add test coverage.
    return response
  }
}

export { DruxtClient }

 /**
  * DruxtClient options object.
  *
  * @typedef {object} DruxtClientOptions
  *
  * @param {object} [axios] - Axios instance settings.
  * @param {boolean} [debug=false] - Enable Debug mode for verbose console log messages.
  * @param {string} [endpoint=jsonapi] - The JSON:API endpoint.
  * @param {string} [jsonapiResourceConfig=jsonapi_resource_config--jsonapi_resource_config] -
  *   The JSON:API resource config type, used for [JSON:API Extras](https://www.drupal.org/project/jsonapi_extras) support.
  *
  * @see {@link https://github.com/axios/axios#request-config}
  *
  * @example @lang js
  * {
  *   // Axios instance settings.
  *   axios: {
  *     // Set axios headers.
  *     headers: { 'X-Custom-Header': true },
  *   },
  *   // Enable debug console log messages.
  *   debug: true,
  *   // JSON:API endpoint.
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
