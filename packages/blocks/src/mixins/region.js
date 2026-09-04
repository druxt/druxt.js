/**
 * Provides props and computed values for use with a DruxtBlockRegion Wrapper
 * component.
 *
 * @mixin
 * @see https://druxtjs.org/modules/blocks
 *
 * @example @lang vue
 * <template>
 *   <DruxtDebug :json="blocks" />
 * </template>
 *
 * <script>
 * import { DruxtBlocksRegionMixin } from 'druxt-blocks'
 * export default {
 *   mixins: [DruxtBlocksRegionMixin]
 * }
 * </script>
 */
 const DruxtBlocksRegionMixin = {
  /** */
  props: {
    /**
     * The Block JSON:API resources.
     *
     * @type {object[]}
     * @required
     */
    blocks: {
      type: Array,
      required: true,
    },

    /**
     * The JSON:API resource language code.
     *
     * @type {string}
     */
    langcode: {
       type: String,
       default: undefined,
    },

    /**
     * A region machine name from the Drupal theme's block layout
     * (/admin/structure/block).
     *
     * @type {string}
     * @default content
     */
     name: {
      type: String,
      default: 'content'
    },

    /**
     * The machine name of the Drupal theme that provides the block layout.
     *
     * @type {string}
     * @required
     */
    theme: {
      type: String,
      required: true
    },
  },
}

export { DruxtBlocksRegionMixin }
