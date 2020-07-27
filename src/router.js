/**
 * @vuepress
 * ---
 * title: DruxtRouter
 * ---
 */

import { stringify } from 'querystring'
import axios from 'axios'
import Url from 'url-parse'

/**
 * DruxtRouter class.
 *
 * Provides core Drupal JSON:API query functionality.
 */
class DruxtRouter {
  /**
   * DruxtRouter constructor.
   *
   * - Validates module options.
   * - Sets up Axios instance.
   * - Sets up options.
   *
   * @example
   * const router = new DruxtRouter('https://example.com', {})
   *
   * @param {string} baseURL - The Drupal base URL.
   * @param {object} [options] - Druxt Router options.
   * @param {object} [options.axios] - Axios instance settings.
   * @param {string} [options.endpoint=jsonapi] - The JSON:API endpoint.
   * @param {array} [options.types] - Array of Druxt Router type definitions.
   */
  constructor (baseURL, options = {}) {
    // Check for URL.
    if (!baseURL) {
      throw new Error('The \'baseURL\' parameter is required.')
    }

    // Setup Axios.
    let axiosSettings = { baseURL }
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
     * Druxt router options.
     * @type {object}
     * @private
     */
    this.options = {
      endpoint: '/jsonapi',
      jsonapiResourceConfig: 'jsonapi_resource_config--jsonapi_resource_config',
      types: [
        {
          type: 'entity',
          canonical: route => route.entity.canonical,
          component: 'druxt-entity',
          property: 'entity',
          props: route => ({
            type: route.jsonapi.resourceName,
            uuid: route.entity.uuid
          })
        },
        {
          type: 'views',
          canonical: route => route.resolved,
          component: 'druxt-view',
          property: 'view',
          props: route => ({
            displayId: route.view.display_id,
            type: route.jsonapi.resourceName,
            uuid: route.view.uuid,
            viewId: route.view.view_id
          })
        }
      ],

      ...options
    }

    /**
     * Drupal JSON:API index.
     * @type {object}
     * @private
     */
    this.index = null
  }

  /**
   * Add headers to the Axios instance.
   *
   * @example
   * router.addHeaders({ 'Authorization': `Basic ${token}` })
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
   * @example
   * const query = new DrupalJsonApiParams()
   * query.addFilter('status', '1')
   * const queryUrl = router.buildQueryUrl(resourceUrl, query)
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
        if (match[1]) {
          permissions[match[1]] = true
        }
      }

      throw new TypeError(`${res.data.meta.omitted.detail}\n\n Required permissions: ${Object.keys(permissions).join(', ')}.`)
    }
  }

  /**
   * Returns route and redirect data for a given path.
   *
   * @example
   * const { redirect, route } = await router.get('/node/1')
   *
   * @param {string} path - The route path.
   *
   * @returns {object} The route and redirect data.
   */
  async get (path) {
    const route = await this.getRoute(path)
    if (route.error) {
      return { route }
    }

    const redirect = this.getRedirect(path, route)

    return { redirect, route }
  }

  /**
   * Get index of all available resources, or the optionally specified resource.
   *
   * @example
   * const { href } = await router.getIndex('node--article')
   *
   * @param {string} resource - (Optional) A specific resource to query.
   *
   * @returns {object} The resource index object or the specified resource.
   */
  async getIndex (resource) {
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
   * Get redirect data for a given route.
   *
   * @example
   * const route = await router.getRoute(path)
   * const redirect = router.getRedirect(path, route)
   *
   * @todo Move this to a DruxtRouterRedirect class.
   * @todo Remove the path parameter.
   *
   * @param {sring} path - The route path.
   * @param {object} route - Druxt route object.
   *
   * @returns {boolean|string} The redirect path or false.
   */
  getRedirect (path, route) {
    // Redirect to route provided redirect.
    if (Array.isArray(route.redirect) && typeof route.redirect[0].to !== 'undefined') {
      return route.redirect[0].to
    }

    // Redirect to root if route is home path but path isn't root.
    if (route.isHomePath) {
      if (path !== '/') {
        return '/'
      }

      return false
    }

    // Redirect if path does not match resolved clean url path.
    if (typeof route.canonical === 'string') {
      const url = new Url(route.canonical)

      if (path !== url.pathname) {
        return url.pathname
      }
    }

    return false
  }

  /**
   * Get a JSON:API resource by type and ID.
   *
   * @example
   * const data = await router.get({ type: 'node--article', id })
   *
   * @param {string} type - The JSON:API resource type.
   * @param {string} id - The Drupal resource UUID.
   *
   * @returns {object} The JSON:API resource data.
   */
  async getResource (query = {}) {
    const { id, type } = query
    if (!id || !type) {
      return false
    }

    let { href } = await this.getIndex(type)
    if (!href) {
      href = this.options.endpoint + '/' + type.replace('--', '/')
    }

    const url = `${href}/${id}`
    const resource = await this.axios.get(url)

    return resource.data.data
  }

  /**
   * Gets a collection of resources.
   *
   * @todo Add granular pagination.
   *
   * @example
   * // Load all currently published Articles.
   * const query = new DrupalJsonApiParams()
   * query.addFilter('status', '1')
   * const resources = await router.getResources('node--article', query, { all: true })
   *
   * @param {string} resource - The JSON:API resource type.
   * @param {string|object} query - A JSON:API query string or object.
   * @param {object} [options]
   * @param {boolean} [options.all=false] - Load all results.
   */
  async getResources (resource, query, options = {}) {
    let resources = []

    const { href } = await this.getIndex(resource)
    if (!href) {
      return false
    }

    let url = this.buildQueryUrl(href, query)

    this.addHeaders(options.headers)

    let loading = true
    while (loading) {
      const res = await this.axios.get(url)

      this.checkPermissions(res)

      resources = resources.concat(res.data.data)

      if (options.all && res.data && res.data.links && res.data.links.next) {
        url = res.data.links.next.href
      } else {
        loading = false
      }
    }

    return resources
  }

  /**
   * Get a JSON:API resource by Drupal route.
   *
   * @example
   * const route = await router.getRoute('/')
   * const data = await router.getResourceByRoute(route)
   *
   * @param {object} route - Druxt Router route object.
   *
   * @returns {object} The JSON:API resource data.
   */
  getResourceByRoute (route) {
    return this.getResource({ id: route.entity.uuid, type: route.jsonapi.resourceName })
  }

  /**
   * Get routing data from Decoupled Router.
   *
   * @example
   * const route = await router.getRoute('/')
   *
   * @param {string} path - The route path.
   *
   * @returns {object} The route object.
   */
  async getRoute (path) {
    // @TODO - Add validation/error handling.
    const url = `/router/translate-path?path=${path}`

    const response = await this.axios.get(url, {
      // Prevent invalid routes (404) from throwing validation errors.
      validateStatus: status => status < 500
    })

    const data = {
      isHomePath: false,
      jsonapi: {},
      label: false,
      redirect: false,

      ...response.data
    }

    let route = {
      error: false,
      type: false,
      canonical: false,
      component: false,
      isHomePath: data.isHomePath,
      jsonapi: data.jsonapi,
      label: data.label,
      props: false,
      redirect: data.redirect,
      resolvedPath: Url(data.resolved).pathname
    }

    // Determine route type by configuration.
    // @TODO - Move type to Decoupled router.
    // @SEE  - https://www.drupal.org/project/decoupled_router/issues/3146024
    for (const key in this.options.types) {
      const type = {
        ...this.options.types[key]
      }

      if (typeof type.property !== 'string' || typeof data[type.property] === 'undefined') {
        continue
      }
      delete type.property

      // Construct canonical link.
      if (typeof type.canonical === 'function') {
        type.canonical = type.canonical(data)
      }

      // Construct props.
      if (typeof type.props === 'function') {
        type.props = type.props(data)
      }

      // Merge type
      route = {
        ...route,
        ...type
      }
      break
    }

    // Process Axios error.
    if (!(response.status >= 200 && response.status < 300)) {
      route.error = {
        statusCode: response.status,
        message: response.statusText
      }
    }

    return route
  }
}

export { DruxtRouter }
