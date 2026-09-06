<template>
  <div>
    <slot />
  </div>
</template>

<script>
export default {
  druxt: {
    query: {
      fields: ['field_summary', 'langcode', 'path'],
    }
  }
}
</script>
