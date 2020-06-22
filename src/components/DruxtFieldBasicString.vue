<template>
  <component :is="wrapper.component" v-bind="wrapper.props">
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
    <div
      v-for="(item, key) of items"
      :key="key"
      v-html="item"
    />
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldBasicString',

  mixins: [DruxtFieldMixin],
}
</script>
