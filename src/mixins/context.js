const DruxtEntityContextMixin = {
  props: {
    context: {
      type: Object,
      default: function() {
        return { ...this.$parent.context }
      },
    },
  },
}

export { DruxtEntityContextMixin }
