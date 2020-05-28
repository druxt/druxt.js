<template>
  <div>
    <druxt-entity
      v-for="item of items"
      :key="item.uuid"
      v-bind="item"
    />
  </div>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldEntityReferenceEntityView',

  mixins: [DruxtFieldMixin]
}
</script>
