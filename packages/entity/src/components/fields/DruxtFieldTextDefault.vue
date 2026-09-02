<template>
  <component
    :is="wrapper.component"
    v-bind="wrapper.props"
  >
    <!-- Label: Above -->
    <div v-if="$scopedSlots['label-above']">
      <slot name="label-above" />
    </div>

    <!-- Label: Inline -->
    <slot
      v-if="$scopedSlots['label-inline']"
      name="label-inline"
    />

    <!-- Items -->
    <!-- eslint-disable vue/no-v-html -->
    <span
      v-for="(item, key) of items"
      :key="key"
      v-html="format(item)"
    />
    <!-- eslint-enable vue/no-v-html -->
  </component>
</template>

<script>
import { DruxtFieldMixin } from 'druxt-entity'

/**
 * Text Default field.
 * @deprecated in druxt-entity:0.16.0 and is removed from druxt-entity:2.0.0.
 *   Use a field wrapper component resolved by the component suggestion system instead.
 * @see https://druxtjs.org/modules/entity/deprecations
 */
export default {
  name: 'DruxtFieldTextDefault',

  mixins: [DruxtFieldMixin],

  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://druxtjs.org/modules/entity/deprecations`)
  },

  methods: {
    /**
     * Formats the item output.
     *
     * @param {object} item - The field item.
     *
     * @return {string}
     */
    format: (item) => item.processed
  }
}
</script>
