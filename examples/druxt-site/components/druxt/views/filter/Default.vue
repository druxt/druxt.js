<template>
  <div>
    {{ filter.expose.label }}
    <input v-if="filter.plugin_id === 'string'" v-model="model" />
    <select v-else />
  </div>
</template>

<script>
export default {
  props: {
    filter: {
      type: Object,
      required: true
    },
    value: {
      type: String,
      default: '',
    }
  },

  data: ({ value }) => ({
    model: value
  }),

  watch: {
    model() {
      this.$emit('input', this.model)
    }
  }
}
</script>
