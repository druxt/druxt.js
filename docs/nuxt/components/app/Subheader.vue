<template>
  <!--
    Sticky context bar. It stacks directly under the app header (top: 4rem) and
    carries two jump menus: siblings of the current document — the other modules
    when you are inside /modules — and the headings of the page you are on.
    Below xl it is the only route to the on-this-page list, which is hidden.
  -->
  <!--
    Hidden from `xl` up when there are no siblings to jump between: the
    headings dropdown is `xl:hidden` (the "On this page" column replaces it
    there), so without siblings the bar would be a sticky 48px strip
    containing only a section label that the breadcrumb underneath already
    shows.
  -->
  <div
    v-if="siblings.length || headings.length"
    class="sticky top-16 z-30 -mx-5 sm:-mx-8 lg:-mx-12 -mt-8 lg:-mt-12 mb-8
           border-b border-base-300 bg-base-100/90 backdrop-blur"
    :class="{ 'xl:hidden': !siblings.length }"
  >
    <div class="px-5 sm:px-8 lg:px-12 h-12 flex items-center gap-2">
      <span v-if="section" class="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-base-content/70">
        {{ section }}
      </span>
      <!-- Only when something follows it: the separator is the sibling
           dropdown's, and rendering it on `section` alone left a dangling
           "MODULES /" whenever a page had no siblings. -->
      <span v-if="section && siblings.length" class="hidden sm:inline text-base-content/40" aria-hidden="true">/</span>

      <!-- Siblings: modules inside /modules, section documents elsewhere. -->
      <div v-if="siblings.length" class="relative">
        <button
          ref="siblingsButton"
          type="button"
          class="flex items-center gap-1.5 max-w-[13rem] sm:max-w-none px-2 py-1 rounded-btn text-sm font-semibold hover:bg-base-200"
          :aria-expanded="openMenu === 'siblings' ? 'true' : 'false'"
          aria-haspopup="true"
          @click="toggle('siblings')"
        >
          <span class="truncate">{{ currentTitle }}</span>
          <span aria-hidden="true" class="text-base-content/70">▾</span>
        </button>

        <ul
          v-if="openMenu === 'siblings'"
          class="absolute left-0 mt-1 w-72 max-h-[60vh] overflow-y-auto z-50 p-1
                 rounded-box border border-base-300 bg-base-100 shadow-xl"
        >
          <li v-for="item of siblings" :key="item.to">
            <NuxtLink
              class="block px-3 py-1.5 rounded-btn text-sm"
              :class="isCurrent(item.to) ? 'bg-base-200 text-primary-focus font-semibold' : 'text-base-content/80 hover:bg-base-200 hover:text-base-content'"
              :to="item.to"
              @click.native="openMenu = null"
              v-text="item.text"
            />
          </li>
        </ul>
      </div>

      <div class="flex-1" />

      <!--
        Headings of the current document. Hidden from `xl` up, where the
        "On this page" column in the layout takes over: that aside is
        `hidden xl:block`, so above that breakpoint this dropdown was a
        second, redundant copy of the same list sitting beside it. It is
        the only route to the headings below `xl`, which is what it exists
        for.
      -->
      <div v-if="headings.length" class="relative xl:hidden">
        <button
          type="button"
          class="flex items-center gap-1.5 px-2 py-1 rounded-btn text-sm text-base-content/80 hover:bg-base-200 hover:text-base-content"
          :aria-expanded="openMenu === 'headings' ? 'true' : 'false'"
          aria-haspopup="true"
          @click="toggle('headings')"
        >
          <span>Sections</span>
          <span aria-hidden="true" class="text-base-content/70">▾</span>
        </button>

        <ul
          v-if="openMenu === 'headings'"
          class="absolute right-0 mt-1 w-72 max-h-[60vh] overflow-y-auto z-50 p-1
                 rounded-box border border-base-300 bg-base-100 shadow-xl"
        >
          <li v-for="link of headings" :key="link.id">
            <a
              class="block px-3 py-1.5 rounded-btn text-sm text-base-content/80 hover:bg-base-200 hover:text-base-content"
              :class="link.depth > headingBaseDepth ? 'pl-6' : ''"
              :href="'#' + link.id"
              @click="openMenu = null"
            >{{ link.text }}</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppSubheader',

  data: () => ({ openMenu: null }),

  computed: {
    /** The top-level menu item the route sits under, e.g. 'Modules'. */
    activeItem() {
      return this.$store.state.menu.find((item) => {
        const to = ((item.props || {}).to || '').replace(/\/$/, '')
        return to && to !== '/' && this.$route.path.startsWith(to)
      }) || null
    },

    section: ({ activeItem }) => (activeItem ? activeItem.text : null),

    /** 'entity' for /modules/entity/deprecations. */
    pkg() {
      const [, first, second] = this.$route.path.split('/')
      return first === 'modules' && second ? second : null
    },

    inModules() {
      return this.$route.path.split('/')[1] === 'modules'
    },

    siblings() {
      if (this.inModules) {
        return (this.$store.state.modules || []).map((m) => ({ text: m.title, to: m.dir }))
      }

      const children = ((this.activeItem || {}).children || [])
        .map((child) => ({ text: child.text, to: ((child.props || {}).to || '') }))
        .filter((child) => child.to)

      const sectionTo = ((this.activeItem || {}).props || {}).to
      return children.filter((child) => !this.same(child.to, sectionTo))
    },

    currentTitle() {
      const current = this.siblings.find((item) => this.isCurrent(item.to))
        || this.siblings.find((item) => this.$route.path.startsWith(item.to.replace(/\/$/, '')))
      if (current) return current.text
      return this.inModules ? 'All modules' : this.section || 'Documents'
    },

    headings: ({ $store }) => ($store.state.toc || []).filter((o) => o.depth === 2 || o.depth === 3),

    /** Shallowest level in use, so a document opening at `###` isn't indented. */
    headingBaseDepth: ({ headings }) => (headings.length ? Math.min(...headings.map((o) => o.depth)) : 2),
  },

  watch: {
    $route() {
      this.openMenu = null
    },
  },

  mounted() {
    this.onDocument = (e) => {
      if (!this.$el.contains(e.target)) this.openMenu = null
    }
    this.onKey = (e) => {
      if (e.key === 'Escape') this.openMenu = null
    }
    document.addEventListener('click', this.onDocument)
    document.addEventListener('keydown', this.onKey)
  },

  beforeDestroy() {
    document.removeEventListener('click', this.onDocument)
    document.removeEventListener('keydown', this.onKey)
  },

  methods: {
    same(a, b) {
      return (a || '').replace(/\/$/, '') === (b || '').replace(/\/$/, '')
    },

    isCurrent(to) {
      return this.same(this.$route.path, to)
    },

    toggle(name) {
      this.openMenu = this.openMenu === name ? null : name
    },
  },
}
</script>
