<template>
  <article>

    <AppPageHeader :title="document.title" :description="document.description" />

    <NuxtContent class="prose" :document="document" />

    <AppDocFooter :edit-path="editPath" :prev="prev" :next="next" />
  </article>
</template>

<script>
import { seoHead } from '~/utils/seo'
import { documentDescription } from '~/utils/content'
export default {
  name: 'AppHowToDocument',

  async asyncData({ $content, error, params, store, route }) {
    const slug = params.pathMatch || 'README'

    let document
    try {
      document = await $content('how-to/', slug).fetch()
    } catch (e) {
      return error({ statusCode: 404, message: 'Document not found' })
    }

    // Siblings, for the prev/next footer.
    const index = await $content('how-to')
      .sortBy('weight')
      .only(['path', 'title'])
      .fetch()

    store.commit('addRecent', { text: document.title, to: route.path })
    store.commit('setToc', document.toc || [])

    return { document, slug, index }
  },

  head() {
    return seoHead({
      title: this.document.title,
      description: documentDescription(this.document),
      path: this.$route.path,
    })
  },

  computed: {
    editPath: ({ document }) => 'how-to' + document.path.replace('/how-to', '') + '.md',

    position: ({ index, document }) => index.findIndex((o) => o.path === document.path),

    prev: ({ index, position }) => (position > 0 ? link(index[position - 1]) : null),

    next: ({ index, position }) => (position > -1 && position < index.length - 1 ? link(index[position + 1]) : null),
  },
}

const link = (item) => (item ? { text: item.title, to: item.path.replace('/README', '') } : null)
</script>
