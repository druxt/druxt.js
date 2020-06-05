<template>
  <div v-if="results">
    <druxt-entity
      v-for="result of results"
      :key="result.id"
      :type="result.type"
      :uuid="result.id"
    />
  </div>
</template>

<script>
export default {
  name: 'DruxtView',

  props: {
    display: {
      type: String,
      default: 'default',
    },

    view: {
      type: String,
      required: true
    }
  },

  data: () => ({
    results: false
  }),

  created() {
    const query = { type: `views--${this.view}`, id: this.display }

    this.$druxtRouter().getResource(query).then(results => {
      this.results = results
    })
  }
}
</script>
