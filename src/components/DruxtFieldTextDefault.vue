<template>
  <div v-html="value" />
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldTextDefault',

  mixins: [DruxtFieldMixin],

  props: {
    format: {
      type: String,
      required: true
    },

    processed: {
      type: String,
      required: true
    },

    summary: {
      type: String,
      default: null
    },

    value: {
      type: String,
      required: true
    }
  }
}
</script>
