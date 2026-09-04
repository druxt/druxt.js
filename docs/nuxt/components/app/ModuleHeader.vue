<template>
  <!--
    Wraps the page slot: position sticky only holds within the element's
    parent, so the bar's containing block must span the page content. The
    first layout-mounted version ended at the bar itself, and the "sticky"
    bar simply scrolled away under the site header.
  -->
  <div>
    <template v-if="pkg">
      <!-- Full header: identity, description, Source. Pill-free per the
           approved boards; the package name is plain mono, not a badge. -->
      <header class="mx-auto max-w-content pb-5">
        <!--
          On a package's own route this block is the page header, so it owns
          the h1. It cannot be the visible title: that is the dropdown
          trigger, and a trigger is a <button>, whose content model is
          phrasing content only - an h1 inside it is invalid and its heading
          semantics are not reliably exposed. So the heading is here,
          carrying the same text, and the visible title stays a span.
        -->
        <h1 v-if="isRoot" class="sr-only" v-text="title" />

        <div class="flex items-center gap-3 sm:gap-4">
          <span class="w-11 h-11 sm:w-14 sm:h-14 rounded-btn bg-base-200 text-primary-focus grid place-items-center flex-shrink-0">
            <component :is="icon" class="w-6 h-6 sm:w-8 sm:h-8" />
          </span>
          <!-- The whole identity is the module switcher, caret after the
               machine name; menu behavior lives in AppDropdown. -->
          <AppDropdown :items="siblings" button-class="min-w-0 px-1 -mx-1 hover:bg-base-200">
            <span class="min-w-0 flex flex-col text-left sm:flex-row sm:items-baseline sm:gap-3">
              <span class="text-2xl sm:text-3xl font-bold tracking-tight" v-text="title" />
              <span class="font-mono text-[13px] sm:text-[15px] text-primary-focus" v-text="name" />
            </span>
          </AppDropdown>
          <span class="flex-1" />
          <a class="btn btn-sm btn-ghost gap-2 flex-shrink-0" :href="repo" target="_blank" rel="noopener">
            <AppIconGithub class="w-4 h-4" /><span class="hidden sm:inline">Source</span>
          </a>
        </div>
        <p v-if="description" class="mt-3 text-[15px] text-base-content/70" v-text="description" />
      </header>

      <!-- The bar's stuck state flips when this sentinel passes under the
           sticky site header (the observer compensates for its 4rem). -->
      <div ref="sentinel" aria-hidden="true" />

      <!--
        The tab row is the sticky element, taking AppSubheader's slot under
        the site header on module-tied pages. It survives tab navigation
        between /modules/<pkg> and /api/packages/<pkg> pages: switching
        tabs swaps only the slot content below. Once stuck it condenses
        per the approved boards.
      -->
      <!-- Background is unconditional: sticking is pure CSS, so if stuck
           detection ever misses, the bar must still cover what it overlaps. -->
      <div
        class="sticky top-[108px] z-30 mb-8 bg-base-100/95 backdrop-blur"
        :class="stuck ? '-mx-5 sm:-mx-8 lg:-mx-12 border-b border-base-300' : ''"
      >
        <div
          class="flex items-center gap-3"
          :class="stuck ? 'h-12 sm:h-[52px] px-5 sm:px-8 lg:px-12' : 'mx-auto max-w-content'"
        >
          <template v-if="stuck">
            <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-btn bg-base-200 text-primary-focus grid place-items-center flex-shrink-0">
              <component :is="icon" class="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <!-- The switcher works while stuck too, same trigger idiom. -->
            <AppDropdown :items="siblings" button-class="px-1.5 py-0.5 -mx-1 hover:bg-base-200">
              <span class="flex items-baseline gap-2">
                <span class="text-[15px] sm:text-base font-bold" v-text="title" />
                <span class="hidden sm:inline font-mono text-[13px] text-primary-focus" v-text="name" />
              </span>
            </AppDropdown>
            <span class="flex-1" />
          </template>

          <!-- Mobile, stuck: the active tab plus a disclosure replaces the row. -->
          <button
            v-if="stuck"
            type="button"
            class="sm:hidden inline-flex items-center gap-1 text-sm font-medium text-primary-focus"
            :aria-expanded="open ? 'true' : 'false'"
            aria-controls="module-tabs"
            @click="open = !open"
          >
            {{ activeTab.text }}
            <span aria-hidden="true" class="text-xs">{{ open ? '▴' : '▾' }}</span>
          </button>

          <nav id="module-tabs" :class="navClasses">
            <!-- Right-edge fade hints at horizontal overflow on small screens. -->
            <div class="relative">
              <ul
                class="flex gap-1 overflow-x-auto"
                :class="stuck ? '' : 'border-b border-base-300'"
              >
                <li v-for="tab of tabs" :key="tab.to" class="flex-shrink-0">
                  <NuxtLink
                    :to="tab.to"
                    class="inline-block px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
                    :class="[
                      stuck ? 'py-3.5' : 'py-2.5 -mb-px',
                      isActive(tab)
                        ? 'border-primary text-primary-focus'
                        : 'border-transparent text-base-content/70 hover:text-base-content',
                    ]"
                    :aria-current="isActive(tab) ? 'page' : null"
                    @click.native="onTabClick"
                    v-text="tab.text"
                  />
                </li>
              </ul>
              <span
                aria-hidden="true"
                class="sm:hidden pointer-events-none absolute right-0 top-0 bottom-px w-9 bg-gradient-to-r from-transparent to-base-100"
              />
            </div>
          </nav>
        </div>
      </div>
    </template>

    <slot />
  </div>
</template>

<script>
import { isPackageRoot, moduleIcon, moduleName, modulePkgs } from './icon/module'

export default {
  data: () => ({
    /** Whether the current navigation came from a stuck tab click. */
    fromStuckTab: false,
    /** The module's README document: { title, description }. */
    module: null,
    /** Sibling documents from content/modules/<pkg>/, for the content tabs. */
    pages: [],
    /** Whether the tab bar is stuck under the site header. */
    stuck: false,
    /** Mobile disclosure: whether the full tab row is revealed while stuck. */
    open: false,
  }),

  /**
   * Nuxt's fetch hook; SSR-awaited so the header arrives rendered.
   *
   * Captured-and-recheck guard as in AppModulesParent: this instance lives
   * in the layout and survives every route change, so a slow fetch from a
   * previous module must not overwrite the current one.
   */
  async fetch() {
    const pkg = this.pkg

    if (!pkg) {
      this.module = null
      this.pages = []
      return
    }

    const [module, pages] = await Promise.all([
      this.$content('modules/' + pkg + '/README').only(['title', 'description']).fetch().catch(() => null),
      this.$content('modules/' + pkg).only(['title', 'path', 'slug']).fetch().catch(() => []),
    ])

    if (pkg !== this.pkg) return
    this.module = module
    this.pages = (Array.isArray(pages) ? pages : [pages]).filter(Boolean)
  },

  computed: {
    /**
     * The module a route is tied to: /modules/<pkg>... or
     * /api/packages/<pkg>..., gated to the public module packages so
     * private packages (docgen, test-utils) keep their plain pages.
     *
     * @param {object} vm - The component ViewModel.
     * @param {object} vm.$route - The current route.
     * @returns {?string} The package directory name, or null.
     */
    pkg: ({ $route }) => {
      const [, first, second, third] = $route.path.split('/')
      const candidate =
        first === 'modules' ? second
        : first === 'api' && second === 'packages' ? third
        : null
      return candidate && modulePkgs.includes(candidate) ? candidate : null
    },

    /**
     * Whether this block is the page header for the current route, i.e. a
     * package's own page rather than one of the tabs beneath it. The page
     * components read the same test to skip their own header.
     *
     * @param {object} vm - The component ViewModel.
     * @param {object} vm.$route - The current route.
     * @returns {boolean} True on a package root.
     */
    isRoot: ({ $route }) => isPackageRoot($route.path),

    /**
     * The module's display title, falling back to the package name when the
     * generated README is missing.
     *
     * The fallback is load-bearing, not cosmetic: on a package root the page
     * component suppresses its own header because this one is showing, so a
     * header that declined to render would leave the page with no title and
     * no source link at all. Rendering on `pkg` alone keeps that invariant
     * true rather than hoping the README fetch succeeded.
     *
     * @param {object} vm - The component ViewModel.
     * @param {?object} vm.module - The module's README document, or null.
     * @param {string} vm.name - The npm package name.
     * @returns {string} The title to display.
     */
    title: ({ module, name }) => (module || {}).title || name,

    /**
     * The module's description, when the README supplied one.
     *
     * @param {object} vm - The component ViewModel.
     * @param {?object} vm.module - The module's README document, or null.
     * @returns {?string} The description, or null.
     */
    description: ({ module }) => (module || {}).description || null,

    /**
     * The npm package name shown in mono; plain `druxt` for the core.
     *
     * @param {object} vm - The component ViewModel.
     * @param {string} vm.pkg - The package directory name.
     * @returns {string} The npm name.
     */
    name: ({ pkg }) => moduleName(pkg),

    /**
     * The module's icon component.
     *
     * @param {object} vm - The component ViewModel.
     * @param {string} vm.pkg - The package directory name.
     * @returns {object} The icon component.
     */
    icon: ({ pkg }) => moduleIcon(pkg),

    /**
     * GitHub URL for the Source button.
     *
     * @param {object} vm - The component ViewModel.
     * @param {string} vm.pkg - The package directory name.
     * @returns {string} The package directory URL on GitHub.
     */
    repo: ({ pkg }) => 'https://github.com/druxt/druxt.js/tree/develop/packages/' + pkg,

    /**
     * The other modules, for the switcher; same source and shape as the
     * Subheader's sibling dropdown.
     *
     * @param {object} vm - The component ViewModel.
     * @param {object} vm.$store - The Vuex store.
     * @returns {object[]} Modules as { text, to }.
     */
    siblings: ({ $store }) => ($store.state.modules || []).map((m) => ({ text: m.title, to: m.dir })),

    /**
     * Tab order per the approved boards: Overview, API, Changelog, then the
     * module's own content documents (Deprecations and any others).
     *
     * @param {object} vm - The component ViewModel.
     * @param {string} vm.pkg - The package directory name.
     * @param {object[]} vm.pages - The sibling content documents.
     * @returns {object[]} Ordered tabs as { text, to } objects.
     */
    tabs: ({ pkg, pages }) => {
      const base = '/modules/' + pkg
      const rest = pages
        .filter((o) => o.slug !== 'README')
        .map((o) => ({ text: o.title, to: o.path.replace('/content', '') }))

      return [
        { text: 'README', to: base },
        { text: 'API', to: '/api/packages/' + pkg },
        { text: 'Changelog', to: '/api/packages/' + pkg + '/CHANGELOG' },
      ].concat(rest)
    },

    /**
     * The tab matching the current route; Overview covers the fallback.
     *
     * @param {object} vm - The component ViewModel.
     * @param {object[]} vm.tabs - The ordered tabs.
     * @returns {object} The active tab.
     */
    activeTab({ tabs }) {
      return tabs.find((tab) => this.isActive(tab)) || tabs[0]
    },

    /**
     * Tab-row visibility. Mobile hides the row while stuck unless the
     * disclosure opened it, in which case it drops below the bar. Written
     * as exclusive branches because Tailwind 2 has no `!important`
     * modifier to override `hidden`.
     *
     * @param {object} vm - The component ViewModel.
     * @param {boolean} vm.stuck - Whether the bar is stuck.
     * @param {boolean} vm.open - Whether the mobile disclosure is open.
     * @returns {string} The class list for the nav element.
     */
    navClasses: ({ stuck, open }) => {
      if (!stuck) return 'flex-1 min-w-0'
      if (open) {
        return 'block sm:min-w-0 absolute sm:static inset-x-0 top-full sm:top-auto bg-base-100/95 backdrop-blur sm:bg-transparent sm:backdrop-blur-none border-b border-base-300 sm:border-0 px-5 sm:px-0'
      }
      return 'hidden sm:block min-w-0'
    },
  },

  watch: {
    // Refetch only when the module changes; switching tabs within one
    // module keeps the header exactly as it is - that is the point.
    pkg() {
      this.open = false
      this.$fetch()
    },

    $route() {
      // A tab clicked while the bar was stuck lands with the bar still
      // stuck: scroll to the engage point instead of the page top. Runs
      // after Nuxt's own scroll-to-top (double rAF outlasts its
      // triggerScroll handling), so the reader never watches the full
      // header re-expand mid-navigation.
      if (this.fromStuckTab) {
        this.fromStuckTab = false
        this.$nextTick(() => {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            const sentinel = this.$refs.sentinel
            if (!sentinel) return
            const engage = sentinel.getBoundingClientRect().top + window.scrollY - 63
            // Instant even under the site-wide smooth scrolling: this runs
            // right after the layout's jump to top, and animating the
            // correction would play the two scrolls as a visible stutter.
            window.scrollTo({ top: Math.max(engage, 0), behavior: 'instant' })
          }))
        })
      }
    },

    // The sentinel only exists while a module is shown; rebind around it.
    module() {
      this.$nextTick(() => this.observe())
    },
  },

  mounted() {
    this.observe()
  },

  beforeDestroy() {
    if (this.observer) this.observer.disconnect()
  },

  methods: {
    /**
     * (Re)binds the stuck observer to the sentinel. Stuck exactly while
     * the sentinel sits above the site header plus breadcrumb bar's 108px band;
     * rootMargin shifts the observed top edge down to match.
     */
    observe() {
      if (this.observer) this.observer.disconnect()
      if (!this.$refs.sentinel) return
      this.observer = new IntersectionObserver(
        ([entry]) => {
          this.stuck = !entry.isIntersecting
          if (!this.stuck) this.open = false
        },
        { rootMargin: '-108px 0px 0px 0px', threshold: 0 },
      )
      this.observer.observe(this.$refs.sentinel)
    },

    /** Records the stuck state for the route watcher's scroll handling. */
    onTabClick() {
      this.fromStuckTab = this.stuck
      this.open = false
    },

    /**
     * Whether a tab matches the current route. Content tabs match
     * exactly; the API tab also claims every deeper page under the
     * package's API tree, so the header stays anchored while browsing
     * component and store references.
     *
     * @param {object} tab - The tab as a { text, to } object.
     * @returns {boolean} True when the tab is the current page.
     */
    isActive(tab) {
      const path = this.$route.path.replace(/\/+$/, '')
      if (path === tab.to) return true
      // Keyed on the tab's route, not its label: only the package's API
      // root claims the deeper reference pages under it.
      return (
        tab.to === '/api/packages/' + this.pkg &&
        path.startsWith(tab.to + '/') &&
        path !== tab.to + '/CHANGELOG'
      )
    },
  },
}
</script>
