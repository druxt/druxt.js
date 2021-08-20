<template>
  <NuxtContent :document="document" />
</template>

<script>
export default {
  async asyncData({ $content, params, error }) {
    let document
    try {
      document = await $content('api/', params.pathMatch || 'index').fetch();
    } catch (e) {
      return error({ message: 'Document not found' })
    }

    return {
      document
    }
  },
}
</script>