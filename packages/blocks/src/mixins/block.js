/**
 * Provides props and computed values for use with a DruxtBlock Wrapper
 * component.
 *
 * @mixin
 *
 * @example @lang vue
 * <template>
 *   <DruxtDebug :json="block" />
 * </template>
 *
 * <script>
 * import { DruxtBlocksBlockMixin } from 'druxt-blocks'
 *
 * export default {
 *   mixins: [DruxtBlocksBlockMixin],
 * }
 * </script>
 */
const DruxtBlocksBlockMixin = {
  /** */
  props: {
    /**
     * The Block JSON:API resource.
     *
     * @type {object}
     */
    block: {
      type: Object,
      require: true,
    },
  },

  /** */
  computed: {
    /**
     * Block settings.
     *
     * @type {object}
     */
    settings() {
      return this.block.attributes.settings
    }
  }
}

export { DruxtBlocksBlockMixin }
