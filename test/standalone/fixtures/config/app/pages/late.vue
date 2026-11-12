<script setup lang="ts">
defineOptions({ name: 'ConfigLatePage' })
// Read first, then a fetcher sets the public tier later in the same render.
const settings = useDruxtSettings()
await Promise.resolve()
setDrupalSettings('default', { public: { late: 'set-after-read' } })
</script>

<template>
  <p id="late">{{ settings.late ?? 'stale' }}</p>
</template>
