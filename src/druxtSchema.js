import { DruxtRouter } from 'druxt-router'

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
      auth: {
        type: false
      },
      schema: {
        filter: [],
      },

      ...options
    }

    // Setup Druxt Router.
    this.druxtRouter = new DruxtRouter(baseURL, this.options)

    // Process authentication.
    // @TODO - druxt-router
    if (this.options.auth.type) {
      switch (this.options.auth.type) {
        case 'oauth2':
          this.druxtRouter.axios.interceptors.request.use(this.oauth2())
          break
      }
    }
  }

  /**
   * Get all available schemas, both View and Form.
   */
  async get() {
    const index = await this.druxtRouter.getIndex()
    const schemas = {}

    for (const schemaType of ['view', 'form']) {
      const resourceType = `entity_${schemaType}_display--entity_${schemaType}_display`
      const displays = await this.druxtRouter.getResources(resourceType)

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

  /**
   * @TODO - druxt-router
   */
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
