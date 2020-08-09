import { DruxtRouter } from 'druxt-router'

import { Schema } from './utils/schema'

/**
 * @typedef {object} SchemaConfiguration
 * @see {@link ./typedefs/schema_configuration|SchemaConfiguration}
 */

/**
 * The DruxtSchema class.
 *
 * Builds Druxt Schema objects using Drupal JSON:API Entity Form and View Display mode data.
 */
class DruxtSchema {
  /**
   * DruxtSchemaRouter constructor.
   *
   * - Validates module options.
   * - Sets up options.
   * - Sets up Druxt.js Router instance.
   * - (Optional) Sets up oauth2 authentication.
   *
   * @example @lang js
   * const schema = new DruxtSchema('https://example.com', {})
   *
   * @param {string} baseURL - The Drupal base URL.
   * @param {object} [options] - Druxt Router options.
   * @param {object} [options.axios] - Axios instance settings.
   * @param {string} [options.endpoint=jsonapi] - The JSON:API endpoint.
   *
   * @todo Document DruxtSchema authentication options.
   * @todo Document DruxtSchema filter options.
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
   * Gets all available schemas for Entitiy Views and Form modes.
   *
   * @returns {object} The JSON:API Resource index and processed schemas.
   *
   * @example @lang js
   * const { schemas } = await schema.get()
   *
   * @todo Rename the `get()` method to `getAll()`.
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
   * Gets a matching schema as per the provided configuration.
   *
   * @param {SchemaConfiguration} config - The Schema configuration object.
   * @param {string} config.entityType - The Drupal Entity type.
   * @param {string} config.bundle - The Entity bundle.
   * @param {object} [options] -
   *
   * @returns {Schema} The generated Schema.
   *
   * @example @lang js
   * const config = {
   *   entityType: 'node',
   *   bundle: 'page'
   * }
   * const schema = await schema.getSchema(config)
   *
   * @see {@link ./typedefs/schema|Schema}
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
   * Adds OAuth2 authentication via an Axios interceptor callback.
   *
   * @todo Move Authentication functionality to another module.
   *
   * @returns {Function} Axios interceptor callback.
   *
   * @private
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
