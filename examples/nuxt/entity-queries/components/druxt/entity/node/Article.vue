<template>
  <div>
    <slot />
  </div>
</template>

<script>
export default {
  druxt: {
    query: {
      // Filter only Schema fields.
      schema: true,
    }
  }
}
</script>
