const DruxtWrapperMixin = {
  props: {
    wrapper: {
      type: Object,
      default: () => ({
        component: undefined,
        propsData: {},
      })
    },
  }
}

export { DruxtWrapperMixin }
