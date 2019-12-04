import axios from 'axios'
import { Deserializer } from 'jsonapi-serializer'

class DruxtRouter {
  constructor (baseURL) {
    // Check for URL.
    if (!baseURL) {
      throw new Error('The \'baseURL\' parameter is required.')
    }

    // Setup Axios.
    this.axios = axios.create({ baseURL })

    // Setup JSON API Serializer.
    this.deserialize = data => new Deserializer().deserialize(data)
  }

  async get (path) {
    // Get router from API.
    // @TODO - Add validation/error handling.
    const urlRoute = `/router/translate-path?path=${path}`
    const respRoute = await this.axios.get(urlRoute)

    // Get entity from API.
    // @TODO - Add validation/error handling.
    const respEntity = await this.axios.get(respRoute.data.jsonapi.individual)
    const entity = await this.deserialize(respEntity.data)

    return {
      entity,
      route: respRoute.data
    }
  }
}

export default ({ app }, inject) => {
  inject('druxtRouter', () => new DruxtRouter('<%= options.baseUrl %>'))
}
