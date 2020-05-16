import axios from 'axios'
import { stringify } from 'querystring'

import { Schema } from './schema'

/**
 * DruxtSchema class.
 */
class DruxtSchema {
  /**
   * Constructor.
   *
   * @param url
   * @param options
   */
  constructor(baseURL, options = {}) {
    // Check for URL.
    if (!baseURL) throw new Error('The \'baseURL\' parameter is required.')

    this.options = {
      baseUrl: baseURL,
      auth: {
        type: false
      },
      schema: {
        filter: [],
      },
      ...options
    }

    this.index = null

    // Setup Axios.
    this.axios = axios.create({ baseURL })

    // Process authentication.
    if (this.options.auth.type) {
      switch (this.options.auth.type) {
        case 'oauth2':
          this.axios.interceptors.request.use(this.oauth2())
          break
      }
    }
  }

  /**
   * Get all available schemas, both View and Form.
   */
  async get() {
    const index = await this.getIndex()
    const schemas = {}

    for (const schemaType of ['view', 'form']) {
      const resourceType = `entity_${schemaType}_display--entity_${schemaType}_display`
      const displays = await this.getResources(resourceType)

      for (const display of displays) {
        const resource = index[[display.attributes.targetEntityType, display.attributes.bundle].join('--')]

        const config = {
          entityType: display.attributes.targetEntityType,
          bundle: display.attributes.bundle,
          mode: display.attributes.mode,
          schemaType,
          filter: this.options.schema.filter,

          ...resource
        }

        const schema = await this.getSchema(config, { data: display })
        if (schema) {
          schemas[schema.id] = schema.schema
        }
      }
    }

    return { index, schemas }
  }

  /**
   * Get index of all available resources.
   */
  async getIndex() {
    if (this.index) return this.index

    const index = await this.axios.get('/api')

    this.index = index.data.links

    // Use JSON API resource config to decorate the index.
    if (this.index['jsonapi_resource_config--jsonapi_resource_config']) {
      const resources = await this.axios.get(this.index['jsonapi_resource_config--jsonapi_resource_config'].href)
      for (const resource of resources.data.data) {
        const internal = resource.attributes.drupal_internal__id.split('--')
        // @TODO: Determine a use for resourceFields.
        const item = {
          resourceType: resource.attributes.resourceType,
          entityType: internal[0],
          bundle: internal[1]
        }

        const id = [item.entityType, item.bundle].join('--')
        this.index[id] = {
          ...item,
          ...this.index[id]
        }
      }
    }

    return this.index
  }

  /**
   * Get all resources based on resource and query.
   *
   * @todo Add pagination.
   *
   * @param {*} resource
   * @param {*} query
   */
  async getResources(resource, query = {}) {
    const index = await this.getIndex()
    if (!index[resource]) return false

    let url = index[resource].href
    if (Object.keys(query).length) {
      url = [url, stringify(query)].join('?')
    }

    const res = await this.axios.get(url)

    // Error handling: Required permissions.
    if (res.data.meta && res.data.meta.omitted) {
      const permissions = {}
      delete res.data.meta.omitted.links.help
      for (const link of Object.values(res.data.meta.omitted.links)) {
        const match = link.meta.detail.match(/\'(.*?)\'/)
        if (match[1]) {
          permissions[match[1]] = true
        }
      }
      throw new TypeError(`${res.data.meta.omitted.detail}\n\n Required permissions: ${Object.keys(permissions).join(', ')}.`)
    }

    return res.data.data
  }

  /**
   * Get schema.
   *
   * @param {*} config
   * @param {*} options
   */
  async getSchema(config, options = {}) {
    const schema = new Schema(config, { druxtSchema: this, ...options })

    if (!schema.isValid) {
      return false
    }

    await schema.generate()
    return schema
  }

  oauth2() {
    const credentials = this.options.auth.credentials
    return async (request) => {
      const config = {
        auth: {
          tokenHost: this.options.baseUrl
        },
        client: {
          id: credentials.clientId,
          secret: credentials.clientSecret
        },
        token: {
          username: credentials.username,
          password: credentials.password
        }
      }

      const oauth2 = require('simple-oauth2').create({
        client: config.client,
        auth: config.auth
      })

      try {
        const token = await oauth2.ownerPassword.getToken(config.token)

        request.headers['Authorization'] = [token.token_type, token.access_token].join(' ')

        return request
      } catch (err) {
        throw new Error(`Access Token Error: ${err.message}`)
      }
    }
  }
}

export { DruxtSchema }
