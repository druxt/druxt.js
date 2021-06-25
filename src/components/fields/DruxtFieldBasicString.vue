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
    <div
      v-for="(item, key) of items"
      :key="key"
      v-html="item"
    />
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
}
</script>
