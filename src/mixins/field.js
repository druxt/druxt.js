const DruxtFieldMixin = {
  props: {
    items: {
      type: Array,
      required: true
    },

    schema: {
      type: Object,
      required: true
    }
  }
}

export { DruxtFieldMixin }
