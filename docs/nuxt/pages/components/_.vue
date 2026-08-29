<template>
  <article>
    <AppBreadcrumbs :items="breadcrumbs" />

    <AppPageHeader :title="document.title" :description="document.description" />

    <NuxtContent class="prose" :document="document" />

    <AppDocFooter :edit-path="editPath" :prev="prev" :next="next" />
  </article>
</template>

<script>
export default {
  name: 'AppComponentsDocument',

  async asyncData({ $content, error, params, store, route }) {
    const slug = params.pathMatch || 'README'

    let document
    try {
      document = await $content('components/', slug).fetch()
    } catch (e) {
      return error({ statusCode: 404, message: 'Document not found' })
    }

    // Siblings, for the prev/next footer.
    const index = await $content('components')
      .sortBy('weight')
      .only(['path', 'title'])
      .fetch()

    store.commit('addRecent', { text: document.title, to: route.path })
    store.commit('setToc', document.toc || [])

    return { document, slug, index }
  },

  head() {
    return {
      title: this.document.title,
      meta: [{ hid: 'description', name: 'description', content: this.document.description || '' }],
    }
  },

  computed: {
    breadcrumbs: ({ document }) => [
      { text: 'Components', to: '/components' },
      { text: document.title },
    ],

    editPath: ({ document }) => 'components' + document.path.replace('/components', '') + '.md',

    position: ({ index, document }) => index.findIndex((o) => o.path === document.path),

    prev: ({ index, position }) => (position > 0 ? link(index[position - 1]) : null),

    next: ({ index, position }) => (position > -1 && position < index.length - 1 ? link(index[position + 1]) : null),
  },
}

const link = (item) => (item ? { text: item.title, to: item.path.replace('/README', '') } : null)
</script>
