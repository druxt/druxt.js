<template>
  <span>{{ value }}</span>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldString',

  mixins: [DruxtFieldMixin],

  props: {
    value: {
      type: String,
      required: true
    }
  }
}
</script>
