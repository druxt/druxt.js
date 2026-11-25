import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtClient, getLanguages } from 'druxt'

import { Schema } from './utils/schema'
import { parseLabelsId, parseSchemaId } from './utils/hold'

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
   * Reads every display of one kind: entity view or entity form displays.
   *
   * The collection is read as `getConfigAll()` reads one.
   *
   * @param {string} resourceType - The display resource type, such as `entity_view_display--entity_view_display`.
   *
   * @returns {object[]} The collection responses.
   */
  async getDisplays(resourceType) {
    return this.getConfigAll(
      resourceType,
      () => new DrupalJsonApiParams().addSort('drupal_internal__id'),
      { entityType: 'targetEntityType', bundle: 'bundle' }
    )
  }

  /**
   * Reads every item of a configuration collection, such as displays or field config.
   *
   * The collection is read page by page. When a page after the first fails,
   * it is read again filtered by entity type, and by bundle for an entity type
   * with more than one page of items, so that every request asks for a
   * first page. Drupal Canvas 1.12.0 answers 500 to any page of a
   * configuration collection after the first. A bundle with more than one
   * page of items of its own is still read to its last page, so on such a
   * site it fails the build rather than leaving items out.
   *
   * @private
   * @param {string} resourceType - The configuration resource type.
   * @param {Function} query - Returns a new query for the collection.
   * @param {object} filters - The collection's attributes for the entity type and the bundle.
   * @param {string} filters.entityType - The entity type attribute, such as `targetEntityType`.
   * @param {string} filters.bundle - The bundle attribute.
   * @param {string} [prefix] - (Optional) The langcode or URL prefix to read the collection under.
   *
   * @returns {object[]} The collection responses.
   */
  async getConfigAll(resourceType, query, filters, prefix) {
    try {
      return await this.druxt.getCollectionAll(resourceType, query(), prefix)
    } catch (err) {
      // A first page that fails is an error of its own, such as a permission
      // the site has not granted, and it is thrown from here.
      await this.druxt.getCollection(resourceType, query(), prefix)
    }

    const index = await this.druxt.getIndex()
    const bundles = {}
    for (const key of Object.keys(index || {})) {
      const [entityType, bundle] = key.split('--')
      if (entityType && bundle) (bundles[entityType] = bundles[entityType] || []).push(bundle)
    }

    return (await Promise.all(Object.keys(bundles).map(async (entityType) => {
      const byType = await this.druxt.getCollection(
        resourceType,
        query().addFilter(filters.entityType, entityType),
        prefix
      )
      if (!((byType.links || {}).next || {}).href) return [byType]

      return (await Promise.all(bundles[entityType].map((bundle) => this.druxt.getCollectionAll(
        resourceType,
        query().addFilter(filters.entityType, entityType).addFilter(filters.bundle, bundle),
        prefix
      )))).flat()
    }))).flat()
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
        const result = await this.getDisplays(resourceType)

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
   * The IDs of every enabled display, as the build reads them.
   *
   * Read once for the life of this instance, which the schema refresh replaces on
   * each cache clear.
   *
   * @returns {Promise<Set<string>>} Schema IDs, `<entity type>--<bundle>--<mode>--<view|form>`.
   */
  getDisplayIds() {
    if (!this.displayIds) {
      this.displayIds = Promise.all(['view', 'form'].map(async (schemaType) => {
        const resourceType = `entity_${schemaType}_display--entity_${schemaType}_display`
        const result = await this.getDisplays(resourceType)
        return result.flatMap((collection) => (collection.data || [])
          .filter((data) => !!data.attributes.status)
          .map((data) => [data.attributes.targetEntityType, data.attributes.bundle, data.attributes.mode, schemaType].join('--')))
      })).then((ids) => new Set(ids.flat()))
      // A failed read is not kept, so the next call tries again.
      this.displayIds.catch(() => { this.displayIds = null })
    }
    return this.displayIds
  }

  /**
   * Generates one schema by its ID, or a language's field labels by a labels ID.
   *
   * The ID's entity type and bundle must be a resource type in the JSON:API index,
   * so only schemas the build could have generated are generated.
   *
   * @example @lang js
   * const schema = await this.$druxtSchema.getSchemaById('node--page--default--view')
   * const labels = await this.$druxtSchema.getSchemaById('labels/es')
   *
   * @param {string} id - The schema ID, `<entity type>--<bundle>--<mode>--<view|form>`, or `labels/<langcode>`.
   *
   * @returns {Promise<object|boolean>} The schema or labels, or false when the ID or its display is unavailable.
   */
  async getSchemaById(id) {
    const langcode = parseLabelsId(id)
    if (langcode) return this.getLabels(langcode)

    const parts = parseSchemaId(id)
    if (!parts) return false

    const index = await this.druxt.getIndex()
    const resource = index[[parts.entityType, parts.bundle].join('--')]
    if (!resource) return false

    // Only a display that exists and is enabled, so an invented mode never reaches Drupal.
    if (!(await this.getDisplayIds()).has(id)) return false

    const schema = await this.getSchema({ ...parts, filter: this.options.schema.filter, ...resource })
    return (schema && schema.schema) || false
  }

  /**
   * Each language's URL prefix, from the `prefixes` option, else read from Drupal once.
   *
   * @param {object} [options] - The options.
   * @param {object} [options.build] - The build reading them, so its modules share one read, as `getLanguages()` takes it.
   *
   * @returns {Promise<object>} The URL prefix of each langcode, empty for a site with one language.
   */
  async getPrefixes({ build } = {}) {
    if (!this.druxt.options.prefixes) {
      const languages = await getLanguages(this.druxt, { endpoint: this.druxt.options.endpoint, build })
      this.druxt.options.prefixes = Object.fromEntries(languages.map((language) => [language.langcode, language.prefix]))
    }
    return this.druxt.options.prefixes
  }

  /**
   * The field labels each of the site's languages translates, as `getLabels()` gives them.
   *
   * @example @lang js
   * const { es } = await schema.getAllLabels()
   *
   * @param {object} [options] - The options.
   * @param {object} [options.build] - The build reading the languages, as `getLanguages()` takes it.
   *
   * @returns {Promise<object>} The labels of each langcode.
   */
  async getAllLabels({ build } = {}) {
    const langcodes = Object.keys(await this.getPrefixes({ build }))
    const labels = await Promise.all(langcodes.map((langcode) => this.getLabels(langcode)))
    return Object.fromEntries(langcodes.map((langcode, index) => [langcode, labels[index]]))
  }

  /**
   * The field labels and descriptions a language translates, read from Drupal under the language's URL prefix.
   *
   * Drupal applies config translations to the field config it serves under a language's prefix. A label or
   * description is given where it differs from the default language's, which the schemas are built in.
   *
   * @example @lang js
   * const labels = await schema.getLabels('es')
   * // { 'node--recipe': { field_preparation_time: { label: 'Tiempo de preparación', description: null } } }
   *
   * @param {string} langcode - The langcode.
   *
   * @returns {Promise<object|boolean>} Each translated field's `label` and `description`, by resource type and field
   *   name, empty for a language served without a prefix. False for a langcode the site doesn't have.
   */
  async getLabels(langcode) {
    const prefixes = await this.getPrefixes()
    if (!Object.prototype.hasOwnProperty.call(prefixes, langcode)) return false
    if (!this.druxt.urlPrefix(langcode)) return {}

    const type = 'field_config--field_config'
    const query = () => new DrupalJsonApiParams().addFields(type, ['entity_type', 'bundle', 'field_name', 'label', 'description'])
    const read = async (prefix) => (await this.getConfigAll(type, query, { entityType: 'entity_type', bundle: 'bundle' }, prefix) || [])
      .flatMap((collection) => (collection || {}).data || [])
      .map(({ attributes = {} }) => attributes)
    const [index, built, translated] = await Promise.all([this.druxt.getIndex(), read(), read(langcode)])

    const key = ({ entity_type, bundle, field_name }) => [entity_type, bundle, field_name].join('.')
    const defaults = Object.fromEntries(built.map((field) => [key(field), field]))

    const labels = {}
    for (const field of translated) {
      const original = defaults[key(field)] || {}
      if (field.label === original.label && field.description === original.description) continue

      const resourceType = [field.entity_type, field.bundle].join('--')
      const resourceField = (((index || {})[resourceType] || {}).resourceFields || {})[field.field_name] || {}
      labels[resourceType] = labels[resourceType] || {}
      labels[resourceType][resourceField.publicName || field.field_name] = {
        label: field.label,
        description: field.description,
      }
    }
    return labels
  }

  /**
   * Gets a matching schema as per the provided configuration.
   *
   * @param {SchemaConfiguration} config - The Schema configuration object.
   * @param {string} config.entityType - The Drupal Entity type.
   * @param {string} config.bundle - The Entity bundle.
   * @param {object} [options] - (Optional) Additional Schema generation options, e.g. preloaded JSON:API resource data.
   *
   * @returns {Schema|boolean} The generated Schema, or false when the configuration is invalid or has no display.
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

    // No display for the bundle and mode.
    if (!(await schema.generate())) {
      return false
    }

    return schema
  }
}

export { DruxtSchema }
