<template>
  <!--
    Parent route for /modules/*. The existing site already used this NuxtChild
    pattern; it now carries the shared module chrome — breadcrumbs, the module
    header and the sub-page tabs — so /modules/entity and
    /modules/entity/deprecations keep their context instead of re-rendering it.
  -->
  <div>
    <AppBreadcrumbs :items="breadcrumbs" />

    <template v-if="module">
      <AppPageHeader :title="module.title" :description="module.description" :badges="badges">
        <div class="mt-5 flex flex-wrap gap-2">
          <a class="btn btn-sm btn-ghost gap-2" :href="repo" target="_blank" rel="noopener">
            <AppIconGithub class="w-4 h-4" /> Source
          </a>
          <NuxtLink class="btn btn-sm btn-ghost gap-2" :to="'/api/packages/' + pkg + '/CHANGELOG'">
            <AppIconApi class="w-4 h-4" /> Release notes
          </NuxtLink>
        </div>
      </AppPageHeader>

      <AppModuleNav :pkg="pkg" :pages="pages" class="mb-8" />
    </template>

    <!-- /modules itself: the index document's own title and description. -->
    <AppPageHeader v-else-if="index" :title="index.title" :description="index.description" />

    <NuxtChild :module="module" :pkg="pkg" />
  </div>
</template>

<script>
export default {
  name: 'AppModulesParent',

  // Nuxt's default scrollBehavior only resets scroll for a nested route
  // (parent + child match) if some matched component opts in explicitly.
  scrollToTop: true,

  data: () => ({ module: null, index: null, pages: [] }),

  // Nuxt's special fetch() hook, not a plain method — this is what makes SSR
  // await it before sending HTML. Previously this lived under `methods` and
  // was only ever invoked by the `pkg` watcher below, so Nuxt never waited
  // for it: the server shipped blank chrome (no header, no breadcrumb title,
  // no module nav) and it only appeared after the client re-fetched on
  // mount.
  async fetch() {
    if (!this.pkg) {
      this.module = null
      this.pages = []
      this.index = await this.$content('modules/README')
        .only(['title', 'description'])
        .fetch()
        .catch(() => null)
      return
    }

    // The module's own README, plus any sibling documents as sub-pages.
    const [module, pages] = await Promise.all([
      this.$content('modules/' + this.pkg + '/README').only(['title', 'description']).fetch().catch(() => null),
      this.$content('modules/' + this.pkg).only(['title', 'path', 'slug']).fetch().catch(() => []),
    ])

    this.module = module
    this.pages = (Array.isArray(pages) ? pages : [pages]).filter(Boolean)
  },

  computed: {
    /** 'entity' for /modules/entity/deprecations; null on the index. */
    pkg() {
      const [, , pkg] = this.$route.path.split('/')
      return pkg || null
    },

    repo: ({ pkg }) => 'https://github.com/druxt/druxt.js/tree/develop/packages/' + pkg,

    badges: ({ pkg }) => (pkg ? [{ text: 'druxt-' + pkg }] : []),

    breadcrumbs() {
      const items = [{ text: 'Modules', to: '/modules' }]
      if (this.module) items.push({ text: this.module.title, to: '/modules/' + this.pkg })
      return items
    },
  },

  watch: {
    // The initial fetch is handled by Nuxt's own fetch() lifecycle above;
    // this only re-triggers it when navigating between sibling modules,
    // since the parent component instance is reused across /modules/<pkg>
    // route changes and Nuxt doesn't infer that from the child route param.
    pkg() {
      this.$fetch()
    },
  },
}
</script>
