const DruxtFieldMixin = {
  props: {
    items: {
      type: Array,
      required: true
    },

    schema: {
      type: Object,
      required: true
    },

    wrapperElement: {
      type: String,
      default: 'div'
    }
  },
}

export { DruxtFieldMixin }
