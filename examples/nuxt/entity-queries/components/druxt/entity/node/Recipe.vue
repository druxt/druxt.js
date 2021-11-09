<template>
  <div>
    <slot />
  </div>
</template>

<script>
export default {
  druxt: {
    query: {
      // Filter specific fields.
      fields: ['field_summary', 'langcode', 'path'],
    }
  }
}
</script>
