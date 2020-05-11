import axios from 'axios'
import Url from 'url-parse'

class DruxtRouter {
  /**
   * Constructor.
   *
   * @param string baseURL
   * @param object options
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
    }
    this.axios = axios.create(axiosSettings)

    // Setup options.
    this.setOptions(options)
  }

  setOptions (options = {}) {
    // Setup entity preprocess callback.
    if (typeof options.preprocessEntity === 'function') {
      this.preprocessEntity = options.preprocessEntity
    }
  }

  /**
   * Returns Drupal entity and route for given path.
   *
   * @param string path
   */
  async get (path) {
    const { data: route, error: routeError } = await this.getRoute(path)
    if (routeError) {
      return { route, error: routeError }
    }

    const redirect = this.getRedirect(path, route)

    // Get entity from API.
    // @TODO - Add validation/error handling.
    const entity = await this.getResourceByRoute(route)

    return { entity, redirect, route }
  }

  /**
   * @param object route
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
    if (typeof route.resolved === 'string') {
      const url = new Url(route.resolved)

      if (path !== url.pathname) {
        return url.pathname
      }
    }

    return false
  }

  /**
   * Get a JSON:API resource by type and ID.
   *
   * @param string type
   * @param string id
   */
  async getResource (query = {}) {
    const { id, type } = query
    if (!id || !type) {
      return false
    }

    const url = `/api/${type.replace('--', '/')}/${id}`
    const response = await this.axios.get(url)

    const resource = { id, type, data: response.data }

    // Process entity before it's stored.
    if (this.preprocessEntity) {
      resource._raw = resource.data
      resource.data = await this.preprocessEntity(response)
    }

    return resource
  }

  /**
   * Get a JSON:API resource by Drupal route.
   *
   * @param object route
   */
  getResourceByRoute (route) {
    return this.getResource({ id: route.entity.uuid, type: route.jsonapi.resourceName })
  }

  /**
   * Get routing data from Decoupled Router.
   *
   * @param string path
   */
  async getRoute (path) {
    // @TODO - Add validation/error handling.
    const url = `/router/translate-path?path=${path}`

    const response = await this.axios.get(url, {
      // Prevent invalid routes (404) from throwing validation errors.
      validateStatus: status => status < 500
    })
    const data = response.data

    // Process Axios error.
    let error = false
    if (!(response.status >= 200 && response.status < 300)) {
      error = {
        statusCode: response.status,
        message: response.statusText
      }
    }

    return { data, error }
  }
}

export { DruxtRouter }
