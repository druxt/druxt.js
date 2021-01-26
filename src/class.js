import axios from 'axios'
import { stringify } from 'querystring'

/**
 * Druxt utility class.
 */
class DruxtClass {
  /**
   * DruxtClass constructor.
   *
   * - Validates module options.
   * - Sets up Axios instance.
   * - Sets up options.
   *
   * @example @lang js
   * const DruxtClass = require('druxt').DruxtClass
   * const druxt = new DruxtClass('https://example.com', {})
   *
   * @param {string} baseUrl - The Drupal base URL.
   * @param {object} [options] - Druxt Router options.
   * @param {object} [options.axios] - Axios instance settings.
   * @param {string} [options.endpoint=jsonapi] - The JSON:API endpoint.
   */
  constructor(baseUrl, options = {}) {
    // Check for URL.
    if (!baseUrl) {
      throw new Error('The \'baseUrl\' parameter is required.')
    }

    // Setup Axios.
    let axiosSettings = { baseURL: baseUrl }
    if (typeof options.axios === 'object') {
      axiosSettings = Object.assign(axiosSettings, options.axios)
      delete options.axios
    }

    /**
     * Axios instance.
     * @see {@link https://github.com/axios/axios#instance-methods}
     * @type {object}
     */
    this.axios = axios.create(axiosSettings)

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
   * @param {string|object} [query] - A correctly formatted JSON:API query string or object.
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
   * @param {string} resourceType
   * @param {*} query
   * @param {object} options
   */
  async getCollection(resourceType, query, options = {}) {
    let resources = []

    const { href } = await this.getIndex(resourceType)
    if (!href) {
      return false
    }

    let url = this.buildQueryUrl(href, query)

    if (options.headers) {
      this.addHeaders(options.headers)
    }

    let loading = true
    while (loading) {
      const res = await this.axios.get(url)

      this.checkPermissions(res)

      resources = resources.concat(res.data)

      if (options.all && res.data && res.data.links && res.data.links.next) {
        url = res.data.links.next.href
      } else {
        loading = false
      }
    }

    return resources
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
   * const data = await this.$druxt.getResource({ type: 'node--article', id })
   *
   * @param {string} type - The JSON:API resource type.
   * @param {string} id - The Drupal resource UUID.
   *
   * @returns {object} The JSON:API resource data.
   */
  async getResource(query = {}) {
    const { id, type } = query
    if (!id || !type) {
      return false
    }

    let { href } = await this.getIndex(type)
    if (!href) {
      href = this.options.endpoint + '/' + type.replace('--', '/')
    }

    const url = `${href}/${id}`
    try {
      const resource = await this.axios.get(url)
      return resource.data
    } catch (e) {
      return false
    }
  }

  /**
   * Get component data from available options.
   *
   * @param {object} vm - The DruxtJS module Vue.js component.
   * @param {string[]} options - The component naming options.
   * @param {boolean} [all=false] - Returns all options if true, else only globally registered options.
   * @param {string} [prefix] - A string to prefix all components.
   *
   * @returns {WrapperComponents}
   */
  getComponents(vm, options, all = false, prefix) {
    const results = []
    const unique = {}

    options
      // Filter out incorrectly typed items.
      .filter(item => Array.isArray(item))

      // Process each item.
      .map(item => {
        const variants = []

        item.map(string => {
          const parts = variants.length ? [...variants[0].parts] : []
          parts.push(string)
          const clone = [...parts]

          // Attach prefix as required.
          if (typeof prefix !== 'string' && (prefix !== false || typeof prefix === 'undefined') && ((vm || {}).$options || {}).name) {
            prefix = vm.$options.name.match(/[A-Z][a-z]+/g).map(word => word.toLowerCase()).join('-')
          }

          if (prefix) {
            clone.unshift(prefix)
          }

          // Generate component name values.
          const kebab = clone.map(string => string.toLowerCase().replace(/--|_/g, '-')).join('-')
          const pascal = kebab.replace(/((\b|[^a-zA-Z0-9]+)[a-zA-Z0-9])/gi, (match, p1, p2) => match.toUpperCase().replace(p2, ''))

          // Check if component is globally registered.
          let global = false
          for (const name of [kebab, pascal]) {
            if (typeof (((vm || {}).$options || {}).components || {})[name] !== 'undefined') {
              global = true
              break
            }
          }

          variants.unshift({ global, kebab, parts, pascal, prefix })
        })

        // Add variants to results.
        variants.map(variant => {
          // Ensure unique results.
          if (unique[variant.pascal]) {
            return
          }
          unique[variant.pascal] = true

          results.push(variant)
        })
      })

    // Return globally registered components or all.
    return results
      .filter(option => option.global || !!all)
      .sort((a, b) => b.parts.length - a.parts.length)
  }

  /**
   * Get the Druxt module data from the referenced component.
   *
   * @returns {ModuleData}
   */
  async getModuleData(vm) {
    if (typeof ((vm || {}).$options || {}).druxt !== 'function') {
      return false
    }

    const moduleData = await vm.$options.druxt({ vm })

    if ((vm.$options || {}).name) {
      moduleData.name = vm.$options.name.match(/[A-Z][a-z]+/g).map(word => word.toLowerCase()).join('-')
    }

    return moduleData
  }
}

export { DruxtClass }

/**
 * @typedef {object} ModuleData
 * @property {Array.<string[]>} componentOptions - An array of arrays of strings for component naming.
 * @property {object} propsData - Property data to bind to the wrapper component.
 *
 * @example @lang js
 * {
 *   componentOptions: [['wrapper', 'component']],
 *   propsData: {},
 * }
 */

 /**
  * @typedef {object[]} WrapperComponents
  * @property {boolean} global - Component global registration state.
  * @property {string} kebab - The component name in kebab case.
  * @property {string[]} parts - The component naming parts.
  * @property {string} pascal - The component name in pascal case.
  * @property {string} prefix - The component name prefix.
  *
  * @example @lang js
  * [{
  *   global: true,
  *   kebab: 'druxt-test-module-wrapper',
  *   parts: ['wrapper'],
  *   pascal: 'DruxtTestModuleWrapper',
  *   prefix: 'druxt-test-module',
  * }]
  */
