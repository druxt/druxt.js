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
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldListDefault',

  mixins: [DruxtFieldMixin]
}
</script>
