<template>
  <div>
    <DruxtMenu :name="name" />
  </div>
</template>

<script>
import { DruxtBlocksBlockMixin } from 'druxt-blocks/dist/mixins/index.mjs'

/**
 * Menu block.
 *
 * _This component is intended to be rendered by the `<DruxtBlock />` component._
 *
 * - Renders a Menu block component.
 *
 * @example @lang vue
 * <DruxtBlock
 *   uuid="d4efd803-94af-4742-bc94-ea4360085b74"
 * />
 *
 * @see {@link https://blocks.druxtjs.org/api/components/DruxtBlock.html|DruxtBlock}
 */
export default {
  name: 'DruxtBlockSystemMenuBlock',

  /**
   * Vue.js Mixins.
   *
   * @see {@link https://blocks.druxtjs.org/api/mixins/block.html|DruxtBlocksBlockMixin}
   */
  mixins: [DruxtBlocksBlockMixin],

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * The menu name.
     *
     * @type string
     */
    name() {
      return this.settings.id.split(':')[1]
    },
  },
}
</script>
