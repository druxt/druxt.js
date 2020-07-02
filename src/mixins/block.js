import { DruxtEntityContextMixin } from 'druxt-entity'

const DruxtBlocksBlockMixin = {
  mixins: [DruxtEntityContextMixin],

  props: {
    block: {
      type: Object,
      require: true,
    },
  },

  computed: {
    settings() {
      return this.block.attributes.settings
    }
  }
}

export { DruxtBlocksBlockMixin }
