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
    <div
      v-for="(item, key) of items"
      :key="key"
      v-html="item"
    />
    <!-- eslint-enable vue/no-v-html -->
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * Basic String field.
 * @deprecated
 */
export default {
  name: 'DruxtFieldBasicString',
  mixins: [DruxtFieldMixin],
  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`)
  },
}
</script>
