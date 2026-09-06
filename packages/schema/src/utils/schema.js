/**
 * The Schema generator utility.
 *
 * Generates a Druxt Schema object for a single Drupal Entity display mode,
 * using Entity Form and View Display configuration data from the Drupal
 * JSON:API.
 *
 * Used by the DruxtSchema class to build the schema files consumed by the
 * DruxtEntity module; it is not typically used directly.
 *
 * @class
 *
 * @example @lang js
 * const schema = new Schema({ entityType: 'node', bundle: 'page' }, { druxtSchema })
 * const data = await schema.generate()
 *
 * @see {@link https://druxtjs.org/modules/schema|Schema module guide}
 */
class Schema {
  /**
   * Schema constructor.
   *
   * @param {SchemaConfiguration} config - The Schema configuration object.
   * @param {object} context - Additional Schema generation context.
   * @param {DruxtSchema} context.druxtSchema - A DruxtSchema instance, used to fetch the display and field configuration.
   * @param {object} [context.data] - Preloaded JSON:API resource data.
   */
  constructor(config, { druxtSchema, data }) {
    if (config.resourceFields) {
      this.resourceFields = config.resourceFields
      delete config.resourceFields
    }

    this.config = {
      entityType: 'node',
      bundle: null,
      mode: 'default',
      schemaType: 'view',
      filter: [],

      ...config
    }

    // Build ID from resource type.
    if (!this.id && this.config.resourceType) {
      this.id = [this.config.resourceType, this.config.mode, this.config.schemaType].join('--')
    }

    // Build ID from entity and bundle types.
    if (!this.id && this.config.bundle) {
      this.id = [this.config.entityType, this.config.bundle, this.config.mode, this.config.schemaType].join('--')
    }

    // Filter required schemas.
    this.isValid = true
    if ((this.config.filter || []).length > 0) {
      this.isValid = false

      for (const filter of this.config.filter) {
        const match = this.id.match(filter)
        if (match) {
          this.isValid = true
          break
        }
      }
    }

    this.displayId = [this.config.entityType, this.config.bundle, this.config.mode].join('.')
    this.resourceType = [this.config.entityType, this.config.bundle].join('--')

    this.data = {}
    if (typeof data !== 'undefined') {
      this.data[data.type] = data
    }

    this.fields = {}

    this.druxtSchema = druxtSchema
  }

  /**
   * Generates the schema, as per the configured schema type ('view' or 'form').
   *
   * @example @lang js
   * const data = await schema.generate()
   *
   * @returns {object|boolean} The generated schema, or false if the display configuration is unavailable.
   */
  async generate() {
    return this[this.config.schemaType]()
  }

  /**
   * Gets a collection of JSON:API resources, using preloaded data where available.
   *
   * @param {string} resource - The JSON:API resource type.
   * @param {string|object} query - A correctly formatted JSON:API query string or object.
   *
   * @returns {object} The JSON:API collection data.
   */
  async getResources(resource, query) {
    if (this.data[resource]) return this.data[resource]

    this.data[resource] = await this.druxtSchema.druxt.getCollection(resource, query)
    return this.data[resource]
  }

  /**
   * Generates the Form schema fields, using the Entity Form Display, Field Config and Field Storage Config resources.
   *
   * @returns {object|boolean} The generated schema, or false if the display configuration is unavailable.
   */
  async form() {
    const entityFormDisplay = await this.getResources('entity_form_display--entity_form_display', { 'filter[drupal_internal__id]': this.displayId }).then(res => Array.isArray(res.data) ? res.data[0] : res)
    if (!entityFormDisplay) return false

    const fieldConfig = await this.getResources('field_config--field_config', { 'filter[entity_type]': this.config.entityType, 'filter[bundle]': this.config.bundle })
    if (!fieldConfig) return false

    const fieldStorageConfig = await this.getResources('field_storage_config--field_storage_config', { 'filter[entity_type]': this.config.entityType })
    if (!fieldStorageConfig) return false

    for (const field in entityFormDisplay.attributes.content) {
      const display = {
        id: null,
        label: null,
        type: null,
        weight: null,
        settings: {},
        third_party_settings: {},

        ...entityFormDisplay.attributes.content[field]
      }

      let config = { attributes: {}, ...fieldConfig.data.find(element => element.attributes.field_name === field) }
      config = {
        description: null,
        label: null,
        required: false,
        settings: {},

        ...config.attributes
      }

      let storage = { attributes: {}, ...fieldStorageConfig.data.find(element => element.attributes.field_name === field) }
      storage = {
        cardinality: null,
        settings: {},

        ...storage.attributes
      }

      // Allow field name substitution via the JSON API Resource config.
      let fieldName = field
      if (this.resourceFields && this.resourceFields[field] && this.resourceFields[field].publicName !== field) {
        fieldName = this.resourceFields[field].publicName
      }

      this.fields[fieldName] = {
        id: fieldName,
        description: config.description,
        label: {
          text: config.label,
          position: display.label,
        },
        cardinality: storage.cardinality,
        required: config.required,
        type: display.type,
        weight: display.weight,
        settings: {
          config: config.settings,
          display: display.settings,
          storage: storage.settings
        },
        thirdPartySettings: display.third_party_settings
      }
    }

    this.schema = {
      id: this.id,
      resourceType: this.resourceType,
      fields: Object.values(this.fields).sort((a, b) => a.weight - b.weight),
      groups: [],
      config: this.config
    }

    return this.schema
  }

  /**
   * Generates the View schema fields, using the Entity View Display and Field Config resources.
   *
   * @returns {object|boolean} The generated schema, or false if the display configuration is unavailable.
   */
  async view() {
    const entityViewDisplay = await this.getResources('entity_view_display--entity_view_display', { 'filter[drupal_internal__id]': this.displayId }).then(res => Array.isArray(res.data) ? res.data[0] : res)
    if (!entityViewDisplay) return false

    const fieldConfig = await this.getResources('field_config--field_config', { 'filter[entity_type]': this.config.entityType, 'filter[bundle]': this.config.bundle })
    if (!fieldConfig) return false

    for (const field in entityViewDisplay.attributes.content) {
      const display = {
        id: null,
        label: null,
        type: null,
        weight: null,
        settings: {},
        third_party_settings: {},

        ...entityViewDisplay.attributes.content[field]
      }

      let config = { attributes: {}, ...fieldConfig.data.find(element => element.attributes.field_name === field) }
      config = {
        description: null,
        label: null,
        required: false,
        settings: {},

        ...config.attributes
      }

      // Allow field name substitution via the JSON API Resource config.
      let fieldName = field
      if (this.resourceFields && this.resourceFields[field] && this.resourceFields[field].publicName !== field) {
        fieldName = this.resourceFields[field].publicName
      }

      this.fields[fieldName] = {
        id: fieldName,
        description: config.description,
        label: {
          text: config.label,
          position: display.label,
        },
        required: config.required,
        type: display.type,
        weight: display.weight,
        settings: {
          config: config.settings,
          display: display.settings
        },
        thirdPartySettings: display.third_party_settings
      }
    }

    this.schema = {
      id: this.id,
      resourceType: this.resourceType,
      fields: Object.values(this.fields).sort((a, b) => a.weight - b.weight),
      groups: [],
      config: this.config
    }

    return this.schema
  }
}

export { Schema }

/**
 * Druxt Schema configuration object.
 *
 * @typedef {object} SchemaConfiguration
 * @see {@link ../typedefs/schemaConfiguration|SchemaConfiguration}
 */
