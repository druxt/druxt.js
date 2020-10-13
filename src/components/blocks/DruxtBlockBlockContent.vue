<template>
  <Druxt module="entity" :props-data="propsData" />
</template>

<script>
import { Druxt } from 'druxt'
import { DruxtBlocksBlockMixin } from '../../mixins/block'

/**
 * Block Content block.
 *
 * _This component is intended to be rendered by the `<druxt-block />` component._
 *
 * - Renders Block Content JSON:API resources via the DruxtEntity component.
 *
 * @example
 * <druxt-block
 *   uuid="baefa4d3-9517-4413-8b9e-975c8affb8ac"
 * />
 *
 * @see {@link ../DruxtBlock|DruxtBlock}
 */
export default {
  name: 'DruxtBlockBlockContent',

  components: { Druxt },

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../../mixins/DruxtBlocksBlockMixin|DruxtBlocksBlockMixin}
   */
  mixins: [DruxtBlocksBlockMixin],

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * Properties to pass through to the DruxtEntity component.
     *
     * @type {object}
     *
     * @see {@link https://druxt.github.io/druxt-entity/api/components/DruxtEntity.html|DruxtEntity}
     */
    propsData() {
      const parts = this.block.attributes.dependencies.content[0].split(':')

      return {
        type: `${parts[0]}--${parts[1]}`,
        uuid: parts[2]
      }
    }
  }
}
</script>
