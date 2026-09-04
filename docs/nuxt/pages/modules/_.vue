<template>
  <div>
    <!-- docgen lifts the README's h1 into frontmatter, so without this the
         page has no h1 at all and its outline starts at h2. -->
    <AppPageHeader v-if="document" :title="document.title" :description="document.description" :icon="icon" :mono="mono" />

    <!-- Every module README opens with a screenshot; it becomes the hero. -->
    <AppFigure v-if="hero" :src="hero.src" :alt="hero.alt" class="mb-8" />

    <AppProse v-if="document" :document="document" />

    <AppApiIndex v-if="pkg" :pkg="pkg" class="mt-12" />

    <AppDocFooter :edit-path="editPath" />
  </div>
</template>

<script>
import { seoHead } from '~/utils/seo'
import { documentDescription, extractHero } from '~/utils/content'
import { moduleIcon, moduleName } from '~/components/app/icon/module'

export default {
  name: 'AppModuleDocument',

  // Supplied by pages/modules.vue via <NuxtChild>.
  props: {
    pkg: { type: String, default: null },
  },

  async asyncData({ $content, error, params, store, route }) {
    // Trailing slashes are trimmed first: `/modules/entity/` arrives as
    // `entity/`, which the `includes('/')` test below read as "already a
    // sub-page path" and queried verbatim, so the route 404'd while
    // `/modules/entity` resolved.
    const match = (params.pathMatch || '').replace(/\/+$/, '')
    const slug = match
      ? (match.includes('/') ? match : match + '/README')
      : 'README'

    let document
    try {
      document = await $content('modules/', slug).fetch()
      // A directory-index target (e.g. `readme/index.md`) resolves
      // ambiguously and returns the directory listing instead of the
      // document; retry against the index file explicitly.
      if (Array.isArray(document)) {
        document = await $content('modules/', slug + '/index').fetch()
      }
    } catch (e) {
      return error({ statusCode: 404, message: 'Document not found' })
    }

    const { hero, body } = extractHero(document)

    store.commit('addRecent', { text: document.title, to: route.path })
    store.commit('setToc', document.toc || [])

    return { document: { ...document, body }, hero, slug }
  },

  head() {
    return seoHead({
      title: this.document.title,
      description: documentDescription(this.document),
      path: this.$route.path,
    })
  },

  computed: {
    editPath: ({ slug }) => 'modules/' + slug + '.md',

    // The module's icon and npm name, matching its card on the index pages.
    icon: ({ pkg }) => (pkg ? moduleIcon(pkg) : null),
    mono: ({ pkg }) => (pkg ? moduleName(pkg) : null),
  },
}
</script>
