/**
 * Provides props and computed values for use with a DruxtBlockRegion Wrapper
 * component.
 *
 * @mixin
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
     * @type {objects[]}
     * @required
     */
    blocks: {
      type: Array,
      required: true,
    },

    /**
     * The Block regions machine name.
     *
     * @type {string}
     * @default content
     */
     name: {
      type: String,
      default: 'content'
    },

    /**
     * A Drupal theme machine name.
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
