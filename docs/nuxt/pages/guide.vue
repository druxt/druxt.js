<template>
  <!-- Parent route for /guide/*; the child renders the document. -->
  <div>
    <NuxtChild />
  </div>
</template>

<script>
export default {
  // Nuxt's default scrollBehavior only resets scroll for a nested route
  // (parent + child match) if some matched component opts in explicitly.
  scrollToTop: true,
}
</script>
