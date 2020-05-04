class Schema {
  constructor(config, { druxtSchema, data }) {
    this.config = {
      entityType: 'node',
      bundle: null,
      mode: 'default',
      schemaType: 'view',

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

    this.displayId = [this.config.entityType, this.config.bundle, this.config.mode].join('.')
    this.resourceType = [this.config.entityType, this.config.bundle].join('--')

    this.data = {}
    if (typeof data !== 'undefined') {
      this.data[data.type] = data
    }

    this.fields = {}

    this.druxtSchema = druxtSchema
  }

  async generate() {
    return this[this.config.schemaType]()
  }

  async getResources(resource, query) {
    if (this.data[resource]) return this.data[resource]

    this.data[resource] = await this.druxtSchema.getResources(resource, query)
    return this.data[resource]
  }

  async form() {
    const entityFormDisplay = await this.getResources('entity_form_display--entity_form_display', { 'filter[drupal_internal__id]': this.displayId }).then(res => Array.isArray(res) ? res[0] : res)
    if (!entityFormDisplay) return false

    const fieldConfig = await this.getResources('field_config--field_config', { 'filter[entity_type]': this.config.entityType, 'filter[bundle]': this.config.bundle })
    if (!fieldConfig) return false

    const fieldStorageConfig = await this.getResources('field_storage_config--field_storage_config', { 'filter[entity_type]': this.config.entityType })
    if (!fieldStorageConfig) return false

    for (const field in entityFormDisplay.attributes.content) {
      const display = {
        id: null,
        type: null,
        weight: null,
        settings: {},
        third_party_settings: {},

        ...entityFormDisplay.attributes.content[field]
      }

      let config = { attributes: {}, ...fieldConfig.find(element => element.attributes.field_name === field) }
      config = {
        description: null,
        required: false,
        settings: {},

        ...config.attributes
      }

      let storage = { attributes: {}, ...fieldStorageConfig.find(element => element.attributes.field_name === field) }
      storage = {
        cardinality: null,
        settings: {},

        ...storage.attributes
      }

      this.fields[field] = {
        id: field,
        description: config.description,
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

  async view() {
    const entityViewDisplay = await this.getResources('entity_view_display--entity_view_display', { 'filter[drupal_internal__id]': this.displayId }).then(res => Array.isArray(res) ? res[0] : res)
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

      let config = { attributes: {}, ...fieldConfig.find(element => element.attributes.field_name === field) }
      config = {
        description: null,
        label: null,
        required: false,
        settings: {},

        ...config.attributes
      }

      this.fields[field] = {
        id: field,
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
