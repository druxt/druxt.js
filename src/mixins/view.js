import { DruxtEntityContextMixin } from 'druxt-entity'

const DruxtViewsViewMixin = {
  mixins: [DruxtEntityContextMixin],

  props: {
    results: {
      type: Array,
      require: true,
    },

    view: {
      type: Object,
      require: true,
    },
  }
}

export { DruxtViewsViewMixin }
