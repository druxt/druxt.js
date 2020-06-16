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
    <druxt-entity
      v-for="item of items"
      :key="item.uuid"
      v-bind="item"
    />
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldEntityReferenceRevisionsEntityView',

  mixins: [DruxtFieldMixin],
}
</script>
