<template>
  <component
    :is="wrapper.component"
    v-if="!$fetchState.pending"
    class="block"
    v-bind="wrapper.propsData"
  >
    <component
      :is="component.is"
      v-bind="{
        ...component.propsData,
        ...$attrs
      }"
    />
  </component>
</template>

<script>
import { DruxtComponentMixin } from 'druxt'
import { DruxtRouterEntityMixin } from 'druxt-router'

/**
 * The `<DruxtBlock />` Vue.js component.
 *
 * - Loads the JSON:API Block resource from Drupal via the DruxtJS Router module.
 * - Renders the data via the DruxtComponentMixin.
 *
 * @example
 * <DruxtBlock
 *   uuid="59104acd-88e1-43c3-bd5f-35800f206394"
 * />
 */
export default {
  name: 'DruxtBlock',

  /**
   * Vue.js Mixins.
   *
   * @see {@link https://druxtjs.org/api/mixins/component.html|DruxtComponentMixin}
   * @see {@link https://router.druxtjs.org/api/mixins/entity.html|DruxtRouterEntityMixin}
   */
  mixins: [DruxtComponentMixin, DruxtRouterEntityMixin],

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * JSON:API Resource type.
     *
     * @type {string}
     * @default block--block
     */
    type: {
      type: String,
      default: 'block--block'
    },
  },

  async fetch() {
    // Fetch Block entity.
    await DruxtRouterEntityMixin.fetch.call(this)

    // Fetch theme component.
    await DruxtComponentMixin.fetch.call(this)
  },

  /**
   * Druxt module function.
   */
  druxt: ({ vm }) => {
    // Get Plugin and Plugin ID data.
    let plugin = vm.entity.attributes.plugin
    let pluginId
    if (plugin.includes(':')) {
      const pluginParts = plugin.split(':')
      plugin = pluginParts[0]
      pluginId = pluginParts[1]
    }

    // Construct component options.
    const componentOptions = []
    if (pluginId) {
      componentOptions.push([plugin, pluginId, vm.entity.attributes.region, vm.entity.attributes.theme])
      componentOptions.push([plugin, pluginId, vm.entity.attributes.theme])
    }
    componentOptions.push([plugin, vm.entity.attributes.region, vm.entity.attributes.theme])
    componentOptions.push([plugin, vm.entity.attributes.theme])

    // Return Druxt module data.
    return {
      componentOptions,
      propsData: {
        block: vm.entity
      }
    }
  },
}
</script>
