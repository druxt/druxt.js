import axios from 'axios'
import { Deserializer } from 'jsonapi-serializer'

class DruxtRouter {
  constructor (baseURL, options = {}, context) {
    // Check for URL.
    if (!baseURL) {
      throw new Error('The \'baseURL\' parameter is required.')
    }

    // Setup Axios.
    this.axios = axios.create({ baseURL })

    this.context = context

    // Setup JSON API Serializer.
    this.deserialize = data => new Deserializer().deserialize(data)

    // Setup schema support.
    this.schema = {}
    if (typeof options.schema !== 'undefined') {
      this.schema = options.schema
    }
  }

  async get (path) {
    const route = await this.getRoute(path)

    // Get entity from API.
    // @TODO - Add validation/error handling.
    const entity = await this.getRouteEntity(route)

    return { entity, route }
  }

  getEntitySchema (entityType, bundle, type = 'view', mode = 'default') {
    if (typeof this.schema === 'function') {
      return this.schema(entityType, bundle, type, mode, this.context)
    }
    return {}
  }

  // Get router from API.
  async getRoute (path) {
    // @TODO - Add validation/error handling.
    const url = `/router/translate-path?path=${path}`
    const response = await this.axios.get(url)
    return response.data
  }

  async getRouteEntity (route) {
    const url = route.jsonapi.individual

    // const query = '?fields[tutorials]=title'
    const entity = await this.axios.get(url)
    return this.deserialize(entity.data)
  }
}

export default (context, inject) => {
  const router = new DruxtRouter('<%= options.baseUrl %>', { schema: <%= options.schema %> }, context)
  inject('druxtRouter', () => router)
}
