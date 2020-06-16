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
  },

  computed: {
    wrapperElement() {
      return 'div'
    }
  }
}

export { DruxtFieldMixin }
