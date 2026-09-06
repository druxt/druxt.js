<template>
  <span v-text="entity.attributes.display_name" />
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'

export default {
  mixins: [DruxtEntityMixin],
  druxt: {
    query: {
      fields: ['display_name'],
    },
  },
}
</script>
