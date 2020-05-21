const DruxtEntityMixin = {
  props: {
    entity: {
      type: Object,
      require: true,
    },

    fields: {
      type: Object,
      required: true,
    },

    schema: {
      type: Object,
      required: true,
    }
  },

  computed: {
    classes() {
      const classes = []

      classes.push(this.schema.id)
      classes.push(this.schema.resourceType)
      classes.push(this.schema.config.entityType)
      classes.push(this.schema.config.bundle)
      classes.push(this.schema.config.mode)
      classes.push(this.schema.config.schemaType)

      return classes.join(' ')
    }
  }
}

export { DruxtEntityMixin }
