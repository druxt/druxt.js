<template>
  <component :is="wrapperElement">
    <!-- Label: Above -->
    <div v-if="$slots['label-above']">
      <slot #label-above />
    </div>

    <!-- Label: Inline -->
    <slot
      v-if="$slots['label-inline']"
      #label-inline
    />

    <!-- Items -->
    <span
      v-for="(item, key) of items"
      :key="key"
      v-html="item.processed"
    />
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldTextDefault',

  mixins: [DruxtFieldMixin]
}
</script>
