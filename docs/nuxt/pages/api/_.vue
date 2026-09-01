<template>
  <article>
    <AppBreadcrumbs :items="breadcrumbs" />

    <AppPageHeader :title="document.title" :badges="badges">
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
    /** The package the document belongs to, e.g. 'druxt-entity'. */
    module: ({ document }) => (document.dir || '').split('/')[3],

    badges: ({ module }) => (module ? [{ text: module }] : []),

    source: ({ document }) => (document.dir
      ? 'https://github.com/druxt/druxt.js/tree/develop' + document.dir.replace('/api/packages', '/packages')
      : null),

    /** 'src / packages / entity / …' rendered as links back up the tree. */
    breadcrumbs: ({ document }) => {
      const dirs = (document.dir || '').replace('/api/', 'src/').split('/')
      const last = dirs.length - 1
      return dirs.map((dir, index) => {
        let to
        if (index === 1) to = '/api'
        // Only the package root has a document; deeper directories (components/, mixins/) would 404.
        if (index === 2 && index < last) to = dirs.slice(0, index + 1).join('/').replace('src/', '/api/')
        return { text: index === last ? document.title : dir, to }
      })
    },
  },
}
</script>
