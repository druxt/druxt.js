<template>
  <component :is="wrapperElement">
    <!-- Label: Above -->
    <div v-if="$slots['label-above']">
      <slot name="label-above" />
    </div>

    <!-- Label: Inline -->
    <slot
      v-if="$slots['label-inline']"
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
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldString',

  mixins: [DruxtFieldMixin]
}
</script>
