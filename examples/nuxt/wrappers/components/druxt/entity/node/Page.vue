<template>
  <div>
    <h3>This is a theme component: DruxtEntityNodePage.vue</h3>
    <slot />
  </div>
</template>

<script>
export default {
  druxt: {
    query: {
      schema: true
    }
  }
}
</script>
