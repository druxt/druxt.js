<script setup lang="ts">
// A site's component reading the languages with no import, as it reads useDruxtClient() and its siblings.
const { languages, defaultLangcode } = useDruxtLanguages()
</script>

<template>
  <p>{{ JSON.stringify({ languages, defaultLangcode: defaultLangcode ?? null }) }}</p>
</template>
