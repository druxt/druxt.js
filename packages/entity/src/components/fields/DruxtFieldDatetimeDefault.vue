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
    <p
      v-for="(item, key) of items"
      :key="key"
    >
      {{ item }}
    </p>
  </component>
</template>

<script>
import { DruxtFieldMixin } from 'druxt-entity'

/**
 * Renders a datetime field's values as plain text.
 * @deprecated in druxt-entity:0.16.0 and is removed from druxt-entity:2.0.0.
 *   Use a field wrapper component resolved by the component suggestion system instead.
 * @see https://druxtjs.org/modules/entity/deprecations
 */
export default {
  name: 'DruxtFieldDatetimeDefault',
  mixins: [DruxtFieldMixin],
  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`)
  },
}
</script>
