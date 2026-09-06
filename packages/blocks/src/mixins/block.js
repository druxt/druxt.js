/**
 * Provides props and computed values for use with a DruxtBlock Wrapper
 * component.
 *
 * @mixin
 * @see https://druxtjs.org/modules/blocks
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

    /**
     * The JSON:API resource language code.
     *
     * @type {string}
     */
    langcode: {
      type: String,
      default: undefined,
    }
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
