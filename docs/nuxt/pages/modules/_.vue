<template>
  <div>
    <!-- The page's own title, for the tab pages under a module. Skipped on
         the module's own route, where the layout's module header is already
         the page header: rendering both printed the identity block twice,
         icon and package name included. -->
    <AppPageHeader v-if="document && !inModuleHeader" :title="document.title" :description="document.description" />

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
import { isPackageRoot } from '~/components/app/icon/module'

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

    /**
     * Whether the layout's module header is already serving as this page's
     * header, in which case repeating it here prints the module identity
     * twice.
     *
     * @param {object} vm - The component ViewModel.
     * @param {object} vm.$route - The current route.
     * @returns {boolean} True when the header above already names this page.
     */
    inModuleHeader: ({ $route }) => isPackageRoot($route.path),
  },
}
</script>
