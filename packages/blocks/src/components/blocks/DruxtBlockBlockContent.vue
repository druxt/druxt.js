<template>
  <div>
    <DruxtEntity
      v-if="!$fetchState.pending"
      v-bind="propsData"
    />
  </div>
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtBlocksBlockMixin } from 'druxt-blocks'

/**
 * Block Content block.
 *
 * _This component is intended to be rendered by the `<DruxtBlock />` component._
 *
 * - Renders Block Content JSON:API resources via the DruxtEntity component.
 *
 * @example
 * <DruxtBlock
 *   uuid="baefa4d3-9517-4413-8b9e-975c8affb8ac"
 * />
 *
 * @see {@link ../DruxtBlock|DruxtBlock}
 */
export default {
  name: 'DruxtBlockBlockContent',

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../../mixins/DruxtBlocksBlockMixin|DruxtBlocksBlockMixin}
   */
  mixins: [DruxtBlocksBlockMixin],

  async fetch() {
    await this.$store.dispatch('druxt/getResource', {
      type: this.block.type,
      id: this.block.id,
      query: new DrupalJsonApiParams().addFields(this.block.type, ['dependencies']),
    })
  },

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * Properties to pass through to Druxt for the Entity module.
     *
     * @type {object}
     *
     * @see {@link https://druxt.github.io/druxt-entity/api/components/DruxtEntity|DruxtEntity}
     */
    propsData: ({ $fetchState, $store, block }) => {
      if ($fetchState.pending) return false

      const resource = $store.state.druxt.resources[block.type][block.id]
      if (!resource.data.attributes.dependencies) return false

      const parts = resource.data.attributes.dependencies.content[0].split(':')

      return {
        key: resource.data.attributes.dependencies.content[0],
        type: `${parts[0]}--${parts[1]}`,
        uuid: parts[2]
      }
    },
  },
}
</script>
