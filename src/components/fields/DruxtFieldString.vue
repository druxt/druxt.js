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
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * String field.
 * @deprecated
 */
export default {
  name: 'DruxtFieldString',
  mixins: [DruxtFieldMixin],
}
</script>
