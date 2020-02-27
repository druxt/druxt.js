import axios from 'axios'

class DruxtRouter {
  /**
   * Constructor.
   *
   * @param string baseURL
   * @param object options
   * @param object context
   */
  constructor (baseURL, options = {}, context) {
    // Check for URL.
    if (!baseURL) {
      throw new Error('The \'baseURL\' parameter is required.')
    }

    // Setup Axios.
    this.axios = axios.create({ baseURL })

    // Setup schema support.
    this.schema = {}
    if (typeof options.schema !== 'undefined') {
      this.schema = options.schema
    }

    // Setup entity preprocess callback.
    if (typeof options.preprocessEntity === 'function') {
      this.preprocessEntity = options.preprocessEntity
    }

    this.context = context
  }

  /**
   * Returns Drupal entity, route and schema for given path.
   *
   * @param string path
   */
  async get (path) {
    const route = await this.getRoute(path)

    // Get entity from API.
    // @TODO - Add validation/error handling.
    const entity = await this.getResourceByRoute(route)

    // Get entity schema.
    const schema = this.getSchemaByResource(entity)

    return { entity, route, schema }
  }

  /**
   * Get a JSON:API resource by type and ID.
   *
   * @param string type
   * @param string id
   */
  async getResource (type, id) {
    const { entityType, bundle } = this.convertResourceToEntityBundle(type)

    const url = `/api/${entityType}/${bundle}/${id}`
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
    return this.getResource(route.jsonapi.resourceName, route.entity.uuid)
  }

  /**
   * Get routing data from Decoupled Router.
   *
   * @param string path
   */
  async getRoute (path) {
    // @TODO - Add validation/error handling.
    const url = `/router/translate-path?path=${path}`
    const response = await this.axios.get(url)

    return response.data
  }

  /**
   * Get Drupal schema for Drupal Entity / Bundle.
   *
   * @param string entityType
   * @param string bundle
   * @param string type
   * @param string mode
   */
  getSchemaByEntity (entityType, bundle, type = 'view', mode = 'default') {
    if (typeof this.schema === 'function') {
      return this.schema(entityType, bundle, type, mode, this.context)
    }
    return {}
  }

  /**
   * Get Drupal schema for JSON:API resource.
   *
   * @param string resource
   * @param string type
   * @param string mode
   */
  getSchemaByResource (resource, type = 'view', mode = 'default') {
    const { entityType, bundle } = this.convertResourceToEntityBundle(resource.type)
    return this.getSchemaByEntity(entityType, bundle, type, mode)
  }

  /**
   * Convert a JSON:API resource type to a Drupal Entity/Bundle.
   *
   * @todo Add support for JSON:API Extras.
   *
   * @param string type
   */
  convertResourceToEntityBundle (type) {
    const parts = type.split('--')

    return {
      entityType: parts[0],
      bundle: parts[1]
    }
  }
}

export default DruxtRouter
