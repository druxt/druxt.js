<template>
  <div>
    <Druxt
      module="custom-module"
      :wrapper="{ component: 'marquee' }"
      v-model="model"
    />

    <input v-model="model" />
  </div>
</template>

<script>
export default {
  data: () => ({
    model: 'Hello Custom Module'
  }),
}
</script>
