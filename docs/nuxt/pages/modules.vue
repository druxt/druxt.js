<template>
  <!--
    Parent route for /modules/*. The module identity chrome lives in the
    layout, which owns it for the /api/packages/<pkg> tabs as well; this route
    adds only the index document's own header.
  -->
  <div>

    <!-- /modules itself: the index document's own title and description. -->
    <AppPageHeader v-if="index" :title="index.title" :description="index.description" />

    <NuxtChild :pkg="pkg" />
  </div>
</template>

<script>

export default {
  name: 'AppModulesParent',

  // Nuxt's default scrollBehavior only resets scroll for a nested route
  // (parent + child match) if some matched component opts in explicitly.
  scrollToTop: true,

  data: () => ({ index: null }),

  // Nuxt's special fetch() hook, not a plain method - this is what makes SSR
  // await it before sending HTML. Previously this lived under `methods` and
  // was only ever invoked by the `pkg` watcher below, so Nuxt never waited
  // for it: the server shipped a blank index header that only appeared after
  // the client re-fetched on mount.
  async fetch() {
    // Captured before awaiting, and re-checked after. This instance is reused
    // across /modules/<pkg> route changes, so moving quickly between modules
    // can leave two fetches in flight and an earlier one resolving later
    // would restore the previous route's header over the current page.
    // Cleared, not just skipped: this instance is reused across routes, so a
    // stale index would render the section header above a module page.
    const pkg = this.pkg
    if (pkg) {
      this.index = null
      return
    }

    const index = await this.$content('modules/README')
      .only(['title', 'description'])
      .fetch()
      .catch(() => null)
    if (this.pkg) return
    this.index = index
  },

  computed: {
    /** 'entity' for /modules/entity/deprecations; null on the index. */
    pkg() {
      const [, , pkg] = this.$route.path.split('/')
      return pkg || null
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
