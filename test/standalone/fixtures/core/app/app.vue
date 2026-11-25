<script setup lang="ts">
const druxt = useDruxtClient()
const { data } = await useAsyncData("recipes", async () => {
  const collection = await druxt.getCollection("node--recipe", { "fields[node--recipe]": "title" })
  return collection ? collection.data.map((recipe) => String(recipe.attributes?.title)) : []
})
</script>

<template>
  <ul>
    <li v-for="title in data" :key="title">{{ title }}</li>
  </ul>
</template>
