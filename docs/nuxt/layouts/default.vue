<template>
  <div class="min-h-screen flex flex-col bg-base-100 text-base-content font-sans antialiased">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-3 focus:px-4 focus:py-2 focus:rounded-btn focus:bg-primary focus:text-primary-content"
    >Skip to content</a>

    <AppHeader
      class="sticky top-0 z-50"
      title="DruxtJS"
      :version="$config.druxtVersion ? 'v' + $config.druxtVersion : null"
      :docs="isDocs"
      @open-search="searchOpen = true"
      @open-nav="sidebar = true"
    />

    <!-- Documentation pages: sidebar / content / on-this-page -->
    <div v-if="isDocs" class="docs-grid flex-grow w-full max-w-[110rem] mx-auto">
      <AppSidebar :open="sidebar" @close="sidebar = false" @open-search="searchOpen = true" />

      <main id="main" class="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <AppSubheader />
        <div class="mx-auto max-w-content">
          <Nuxt />
        </div>
      </main>

      <aside class="hidden xl:block py-12 pr-8">
        <AppToc class="sticky top-24" />
      </aside>
    </div>

    <!-- Full-bleed pages (home) opt out of the docs grid, but keep the drawer
         the header's hamburger opens. -->
    <template v-else>
      <AppSidebar :open="sidebar" :docs="false" @close="sidebar = false" @open-search="searchOpen = true" />
      <main id="main" class="flex-grow">
        <Nuxt />
      </main>
    </template>

    <!-- After the content container, not inside the header or sidebar, so it
         renders on every route including the full-bleed homepage. -->
    <AppSiteFooter :version="$config.druxtVersion ? 'v' + $config.druxtVersion : null" />

    <AppSearch :open="searchOpen" @close="searchOpen = false" />
  </div>
</template>

<script>
import { trapTab } from '~/utils/focus'

export default {
  data: () => ({
    sidebar: false,
    searchOpen: false,
    /** Element to return focus to when the drawer closes. */
    restoreFocusTo: null,
  }),

  computed: {
    isDocs: ({ $route }) => $route.path !== '/',
  },

  watch: {
    // Fallback for Nuxt's own scroll-to-top: its scrollBehavior resolves via
    // a `triggerScroll` event Nuxt emits after the page transition
    // completes, but that signal never fires when a navigation crosses the
    // isDocs boundary above — leaving/entering the full-bleed home template
    // swaps this layout's entire surrounding markup (sidebar, TOC aside),
    // not just the <Nuxt/> page slot, which the transition mechanism isn't
    // built to handle. Path-gated (not hash) so TOC anchor jumps still work.
    // 'instant' opts route changes out of the html { scroll-behavior: smooth }
    // in app.css, which is for in-page scrolls only.
    $route(to, from) {
      this.sidebar = false
      this.searchOpen = false
      if (to.path !== from.path) window.scrollTo({ top: 0, behavior: 'instant' })
    },

    /**
     * Drawer focus handling. Opening moves focus to the drawer's close
     * button so keyboard and screen-reader users land inside the overlay
     * rather than behind it; closing returns focus to whatever opened it
     * (the header hamburger), instead of dropping it on <body>.
     */
    sidebar(open) {
      if (open) {
        this.restoreFocusTo = document.activeElement
        this.$nextTick(() => {
          const close = document.querySelector('aside [aria-label="Close menu"]')
          if (close) close.focus()
        })
        return
      }
      const target = this.restoreFocusTo
      this.restoreFocusTo = null
      if (target && document.contains(target)) this.$nextTick(() => target.focus())
    },
  },

  mounted() {
    this.onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase()
      const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (cmdK || (e.key === '/' && !typing)) {
        e.preventDefault()
        this.searchOpen = true
      }
      // The drawer is a modal overlay on mobile; Escape is the expected way
      // out and the backdrop is not reachable by keyboard.
      if (e.key === 'Escape' && this.sidebar) this.sidebar = false

      // While it is open it should behave like one: without this, Tab walked
      // out of the drawer into the page behind the backdrop and left the
      // drawer open over content the user was now editing focus in.
      if (this.sidebar) trapTab(document.querySelector('aside'), e)
    }
    window.addEventListener('keydown', this.onKey)
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKey)
  },
}
</script>

<style scoped>
/* Tailwind's JIT engine here doesn't convert the underscore-as-space in
   multi-token arbitrary values (e.g. grid-cols-[17rem_minmax(0,1fr)]) — it
   compiles to the literal, invalid `17rem_minmax(0,1fr)`, which the browser
   ignores, silently collapsing this to a single-column grid (sidebar, then
   content, stacked). Plain CSS avoids the arbitrary-value parser entirely. */
@media (min-width: 1024px) {
  .docs-grid {
    display: grid;
    grid-template-columns: 17rem minmax(0, 1fr);
  }
}

@media (min-width: 1280px) {
  .docs-grid {
    grid-template-columns: 17rem minmax(0, 1fr) 15rem;
  }
}
</style>
