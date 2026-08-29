<template>
  <nav v-if="links.length" aria-label="On this page" class="text-sm">
    <!-- pl-3 matches the top-level links below, which are indented past the
         list's left border. Without it the heading sat flush against that
         rule while every item was inset from it. -->
    <p class="mb-2 pl-3 text-xs font-semibold uppercase tracking-wider text-base-content/70">On this page</p>
    <ul class="border-l border-base-300">
      <li v-for="link of links" :key="link.id">
        <a
          :href="'#' + link.id"
          class="block py-1 pr-2 -ml-px border-l-2 transition-colors"
          :class="[
            link.depth > baseDepth ? 'pl-6' : 'pl-3',
            active === link.id ? 'border-primary text-primary-focus font-medium' : 'border-transparent text-base-content/70 hover:text-base-content',
          ]"
          @click="active = link.id"
        >{{ link.text }}</a>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  data: () => ({ active: null }),

  computed: {
    /**
     * Content pages push their document.toc into the store, so the TOC does
     * not need to know which page rendered it.
     */
    links: ({ $store }) => ($store.state.toc || []).filter((o) => o.depth === 2 || o.depth === 3),

    /**
     * The shallowest heading level this document actually uses.
     *
     * Indentation is relative to this rather than hard-coded to depth 2,
     * because not every document starts at `##` — the getting-started guide
     * opens at `###`, so its very first entry rendered indented beneath
     * nothing. Anything at the document's own top level now sits flush.
     */
    baseDepth: ({ links }) => (links.length ? Math.min(...links.map((o) => o.depth)) : 2),
  },

  watch: {
    links() {
      this.$nextTick(this.observe)
    },
  },

  mounted() {
    this.observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
      if (visible.length) this.active = visible[0].target.id
    }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 })

    this.$nextTick(this.observe)
  },

  beforeDestroy() {
    if (this.observer) this.observer.disconnect()
  },

  methods: {
    // Called from the `links` watcher, which fires as soon as the new page's
    // TOC lands in the store — a Vuex commit made inside asyncData(), before
    // Nuxt has applied the fetched document and NuxtContent has rendered its
    // headings. A single $nextTick isn't enough to wait that out, so retry
    // across a few animation frames until the headings actually exist.
    observe(attempt = 0) {
      if (!this.observer || !this.links.length) return
      const els = this.links.map(({ id }) => document.getElementById(id)).filter(Boolean)
      if (els.length < this.links.length && attempt < 20) {
        requestAnimationFrame(() => this.observe(attempt + 1))
        return
      }
      this.observer.disconnect()
      els.forEach((el) => this.observer.observe(el))
    },
  },
}
</script>
