<template>
  <article>

    <AppPageHeader :title="document.title">
      <a
        v-if="source"
        class="mt-5 inline-flex items-center gap-2 text-sm text-base-content/70 hover:text-primary-focus"
        :href="source"
        target="_blank"
        rel="noopener"
      >
        <AppIconExternal class="w-4 h-4" /> View source on GitHub
      </a>
    </AppPageHeader>

    <NuxtContent class="prose" :document="document" />
  </article>
</template>

<script>
import { seoHead } from '~/utils/seo'
import { documentDescription } from '~/utils/content'
export default {
  name: 'AppApiDocument',

  async asyncData({ $content, error, params, store, route }) {
    let path = params.pathMatch || 'README'
    if (path.endsWith('/')) path += 'index'

    let document
    try {
      document = await $content('api/', path).fetch()
      if (Array.isArray(document)) {
        document = await $content('api/', params.pathMatch + '/index').fetch()
      }
    } catch (e) {
      return error({ statusCode: 404, message: 'Document not found' })
    }

    store.commit('addRecent', { text: document.title, to: route.path })
    store.commit('setToc', document.toc || [])

    return { document }
  },

  head() {
    return seoHead({
      title: this.document.title,
      description: documentDescription(this.document),
      path: this.$route.path,
    })
  },

  computed: {
    source: ({ document }) => (document.dir
      ? 'https://github.com/druxt/druxt.js/tree/develop' + document.dir.replace('/api/packages', '/packages')
      : null),

  },
}
</script>
