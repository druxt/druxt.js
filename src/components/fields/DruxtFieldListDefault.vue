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
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * List Default field.
 * @deprecated
 */
export default {
  name: 'DruxtFieldListDefault',
  mixins: [DruxtFieldMixin]
}
</script>
