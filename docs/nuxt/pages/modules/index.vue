<template>
  <div>
    <NuxtContent v-if="document.body" class="prose mb-10" :document="document" />

    <div class="grid gap-4 sm:grid-cols-2">
      <AppModuleCard v-for="module of modules" :key="module.title" :module="module" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppModulesIndex',

  async asyncData({ $content, error, store, route }) {
    let document
    try {
      document = await $content('modules/', 'README').fetch()
    } catch (e) {
      return error({ statusCode: 404, message: 'Document not found' })
    }

    store.commit('addRecent', { text: document.title, to: route.path })
    store.commit('setToc', document.toc || [])

    return { document }
  },

  head() {
    return { title: this.document.title }
  },

  computed: {
    modules: ({ $store }) => $store.state.modules,
  },
}
</script>
