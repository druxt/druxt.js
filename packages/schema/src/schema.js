import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient } from 'druxt'

import { Schema } from './utils/schema'
import { parseSchemaId } from './utils/hold'

/**
 * Druxt Schema configuration object.
 *
 * @typedef {object} SchemaConfiguration
 * @see {@link ./typedefs/schemaConfiguration|SchemaConfiguration}
 */

/**
 * The DruxtSchema class.
 *
 * Builds Druxt Schema objects using Drupal JSON:API Entity Form and View Display mode data.
 */
class DruxtSchema {
  /**
   * DruxtSchema constructor.
   *
   * - Validates module options.
   * - Sets up options.
   * - Sets up a DruxtClient instance.
   *
   * @example @lang js
   * const schema = new DruxtSchema('https://example.com', {})
   *
   * @param {string} baseUrl - The Drupal base URL.
   * @param {object} [options] - Druxt Router options.
   * @param {object} [options.axios] - Axios instance settings.
   * @param {string} [options.endpoint=jsonapi] - The JSON:API endpoint.
   *
   * @todo Document DruxtSchema authentication options.
   * @todo Document DruxtSchema filter options.
   */
  constructor(baseUrl, options = {}) {
    // Check for URL.
    if (!baseUrl) throw new Error('The \'baseUrl\' parameter is required.')

    this.options = {
      auth: {
        type: false
      },
      schema: {
        filter: [],
      },

      ...options
    }

    /**
     * Instance of the Druxt Client.
     *
     * @type {DruxtClient}
     * @see {@link https://druxtjs.org/api/packages/druxt/client|DruxtClient}
     */
    this.druxt = new DruxtClient(baseUrl, this.options)
  }

  /**
   * Gets all available schemas for Entity Views and Form modes.
   *
   * @returns {object} The JSON:API Resource index and processed schemas.
   *
   * @example @lang js
   * const { schemas } = await schema.get()
   *
   * @todo Rename the `get()` method to `getAll()`.
   */
  async get() {
    const index = await this.druxt.getIndex()

    const displays = (await Promise.all([
      ...['view', 'form'].map(async (schemaType) => {
        const resourceType = `entity_${schemaType}_display--entity_${schemaType}_display`
        const query = new DrupalJsonApiParams().addSort('drupal_internal__id')
        const result = await this.druxt.getCollectionAll(resourceType, query)

        // Check permissions.
        try {
          result.forEach((collection) => this.druxt.checkPermissions({ data: collection }))
        } catch(err) {
          this.druxt.error(err)
        }

        return result
          .map((collection) =>
            collection.data
              .filter((data) => !!data.attributes.status)
              .map((data) => ({
                entityType: data.attributes.targetEntityType,
                bundle: data.attributes.bundle,
                mode: data.attributes.mode,
                schemaType,
                filter: this.options.schema.filter,
                ...index[[data.attributes.targetEntityType, data.attributes.bundle].join('--')]
              })))
      })
    ])).flat(2)

    const schemas = Object.fromEntries(
      (await Promise.all(displays.map((config) => this.getSchema(config))))
        .filter((o) => o)
        .map((schema) => ([schema.id, schema.schema]))
    )

    return { index, schemas }
  }

  /**
   * Generates one schema by its ID.
   *
   * The ID's entity type and bundle must be a resource type in the JSON:API index,
   * so only schemas the build could have generated are generated.
   *
   * @example @lang js
   * const schema = await this.$druxtSchema.getSchemaById('node--page--default--view')
   *
   * @param {string} id - The schema ID, `<entity type>--<bundle>--<mode>--<view|form>`.
   *
   * @returns {Promise<object|boolean>} The schema, or false when the ID or its display is unavailable.
   */
  async getSchemaById(id) {
    const parts = parseSchemaId(id)
    if (!parts) return false

    const index = await this.druxt.getIndex()
    const resource = index[[parts.entityType, parts.bundle].join('--')]
    if (!resource) return false

    const schema = await this.getSchema({ ...parts, filter: this.options.schema.filter, ...resource })
    return (schema && schema.schema) || false
  }

  /**
   * Gets a matching schema as per the provided configuration.
   *
   * @param {SchemaConfiguration} config - The Schema configuration object.
   * @param {string} config.entityType - The Drupal Entity type.
   * @param {string} config.bundle - The Entity bundle.
   * @param {object} [options] - (Optional) Additional Schema generation options, e.g. preloaded JSON:API resource data.
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
}

export { DruxtSchema }
