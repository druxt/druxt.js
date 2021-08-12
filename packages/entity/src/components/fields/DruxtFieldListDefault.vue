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
    <ul>
      <li
        v-for="(item, key) of items"
        :key="key"
      >
        {{ item }}
      </li>
    </ul>
  </component>
</template>

<script>
import { DruxtFieldMixin } from 'druxt-entity'

/**
 * List Default field.
 * @deprecated
 */
export default {
  name: 'DruxtFieldListDefault',
  mixins: [DruxtFieldMixin],
  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`)
  },
}
</script>
