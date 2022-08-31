<template>
  <div class="card">
    <h2 v-text="title" />
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    }
  }
}
</script>

<style scoped>
.card {
  cursor: pointer;
  display: block;
  border: 1px solid lightgray;
  padding: 1rem;
  margin: 1rem 0;
}
</style>
