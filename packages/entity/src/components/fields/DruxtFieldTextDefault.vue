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
 * @deprecated
 */
export default {
  name: 'DruxtFieldTextDefault',

  mixins: [DruxtFieldMixin],

  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`)
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
