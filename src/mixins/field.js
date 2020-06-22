const DruxtFieldMixin = {
  props: {
    inner: {
      type: Object,
      default: () => ({
        component: 'div',
        props: {}
      })
    },

    items: {
      type: Array,
      required: true
    },

    schema: {
      type: Object,
      required: true
    },

    wrapper: {
      type: Object,
      default: () => ({
        component: 'div',
        props: {}
      })
    }
  },
}

export { DruxtFieldMixin }
