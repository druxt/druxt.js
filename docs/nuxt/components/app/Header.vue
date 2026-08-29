<template>
  <header class="w-full border-b border-base-300 bg-base-100/90 backdrop-blur">
    <div class="max-w-[110rem] mx-auto h-16 px-4 sm:px-6 flex items-center gap-3">
      <!--
        The hamburger opens the drawer, so it must disappear exactly where the
        drawer does. On documentation pages the sidebar becomes sticky at `lg`,
        so above that the button had nothing to open: between 1024 and 1279px
        it was visible but inert — the drawer's own backdrop and close button
        are `lg:hidden`, and the click handler only ever sets `sidebar = true`,
        so it could not even be undone. The homepage has no sticky sidebar, so
        there the drawer (and this button) stay useful until `xl`, where the
        inline section nav takes over.
      -->
      <button
        type="button"
        class="btn btn-ghost btn-square btn-sm -ml-1"
        :class="docs ? 'lg:hidden' : 'xl:hidden'"
        aria-label="Open navigation menu"
        @click="$emit('open-nav')"
      >
        <AppIconMenu class="w-5 h-5" />
      </button>

      <NuxtLink to="/" class="flex items-center gap-2 flex-shrink-0 rounded-btn px-1 py-1 hover:opacity-80">
        <AppLogo class="w-7" title="DruxtJS" />
        <span class="text-lg sm:text-xl font-semibold tracking-tight">{{ title }}</span>
      </NuxtLink>

      <!--
        Links to the release notes, following the convention in this
        ecosystem: Vite, VitePress and Pinia all make the version in the nav
        a link to their changelog. The target is the site's own generated
        page (docgen writes api/packages/<pkg>/CHANGELOG from the package's
        CHANGELOG.md) rather than GitHub, so the reader stays in the docs —
        it is the same page the module pages already call "Release notes".
      -->
      <NuxtLink
        v-if="version"
        class="badge badge-sm badge-outline hidden sm:inline-flex hover:border-primary hover:text-primary-focus"
        to="/api/packages/druxt/CHANGELOG"
        :title="'Druxt ' + version + ' release notes'"
      >{{ version }}</NuxtLink>

      <div class="flex-1" />

      <!--
        Search trigger. `w-48`, not `w-44`: the label was `whitespace-nowrap`
        and would not shrink, so on a non-Mac the wider "Ctrl K" bubble was
        pushed 7.4px past the button's right edge (measured at 768 and
        1152px; "⌘K" happened to fit, so it only showed on non-Mac). The
        label now truncates instead of shoving, which also holds for any
        future shortcut string.
      -->
      <button
        type="button"
        class="hidden sm:flex items-center gap-2 h-9 pl-3 pr-2 w-48 xl:w-56 rounded-btn border border-base-300 bg-base-200 text-sm text-base-content/70 hover:border-primary hover:text-base-content transition-colors"
        @click="$emit('open-search')"
      >
        <AppIconSearch class="w-4 h-4 flex-shrink-0" />
        <span class="flex-1 min-w-0 text-left truncate">Search docs</span>
        <kbd class="kbd kbd-xs flex-shrink-0">{{ shortcut }}</kbd>
      </button>
      <button
        type="button"
        class="sm:hidden btn btn-ghost btn-square btn-sm"
        aria-label="Search"
        @click="$emit('open-search')"
      >
        <AppIconSearch class="w-5 h-5" />
      </button>

      <!--
        Six section links plus the search field need ~1280px before they stop
        wrapping, so the inline nav starts at xl rather than lg.
      -->
      <nav class="hidden xl:block min-w-0">
        <AppMenu horizontal :home="false" :external="false" :icons="false" />
      </nav>

      <div class="flex items-center gap-1 xl:pl-2 xl:border-l border-base-300">
        <a
          v-for="link of external"
          :key="link.text"
          class="hidden md:inline-flex btn btn-ghost btn-square btn-sm"
          :href="link.props.href"
          target="_blank"
          rel="noopener"
          :aria-label="link.text"
          :title="link.text"
        >
          <component :is="iconFor(link)" class="w-5 h-5" />
        </a>

        <AppColorModeToggle />
      </div>
    </div>
  </header>
</template>

<script>
import { MAC_SHORTCUT, searchShortcut } from '~/utils/platform'

export default {
  props: {
    title: { type: String, required: true },
    version: { type: String, default: null },
    /** true on documentation pages, where the sidebar goes sticky at `lg`. */
    docs: { type: Boolean, default: true },
  },

  data: () => ({ shortcut: MAC_SHORTCUT }),

  computed: {
    external: ({ $store }) => $store.state.menu.filter((o) => o.component === 'a'),
  },

  methods: {
    /** GitHub and Discord get their own marks; anything else falls back. */
    iconFor(link) {
      return 'app-icon-' + (link.icon || 'external')
    },
  },

  mounted() {
    this.shortcut = searchShortcut()
  },
}
</script>
