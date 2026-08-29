<template>
  <div>
    <!-- Mobile backdrop. On docs pages this only needs to cover the range
         below the sidebar's own lg:sticky breakpoint; on full-bleed pages
         (docs=false) the sidebar never goes sticky, so it must stay in
         overlay mode as long as the header's hamburger trigger is visible
         (xl:hidden) — otherwise there's a width range with a trigger but
         no backdrop or close button to dismiss it. -->
    <div v-if="open" class="fixed inset-0 z-40 bg-neutral/60" :class="docs ? 'lg:hidden' : 'xl:hidden'" @click="$emit('close')" />

    <aside
      class="bg-base-100 border-r border-base-300 w-[17rem] flex-shrink-0 overflow-y-auto
             fixed inset-y-0 left-0 z-50 h-full transition-transform duration-200 ease-out"
      :class="[
        // `invisible` when closed, not just translated off-screen: a
        // transform still leaves the drawer in the tab order, so keyboard
        // users tabbed into 10 focusable controls sitting at x=-272 with no
        // way to see them (WCAG 2.4.3, measured). visibility:hidden removes
        // them from the tab order, and the sticky breakpoint restores it.
        open ? 'translate-x-0' : '-translate-x-full invisible',
        docs ? 'lg:sticky lg:top-16 lg:z-auto lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:visible' : '',
      ]"
      :aria-label="docs ? 'Documentation navigation' : 'Site navigation'"
    >
      <div class="flex items-center justify-between h-16 px-4 border-b border-base-300" :class="docs ? 'lg:hidden' : 'xl:hidden'">
        <span class="text-sm font-semibold">Menu</span>
        <button type="button" class="btn btn-ghost btn-square btn-sm" aria-label="Close menu" @click="$emit('close')">
          <span aria-hidden="true" class="text-xl leading-none">&times;</span>
        </button>
      </div>

      <div class="p-4 space-y-6">
        <button
          type="button"
          class="w-full flex items-center gap-2 h-9 px-3 rounded-btn border border-base-300 bg-base-200 text-sm text-base-content/70 hover:border-primary hover:text-base-content transition-colors"
          @click="$emit('open-search')"
        >
          <AppIconSearch class="w-4 h-4" />
          <span class="flex-1 text-left">Search docs</span>
          <kbd class="kbd kbd-xs">{{ shortcut }}</kbd>
        </button>

        <AppMenu :children="true">
          <li slot="title" class="menu-title px-3 pb-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-base-content/70">Navigation</span>
          </li>
        </AppMenu>

        <ul v-if="recent.length" class="menu gap-0.5">
          <li class="menu-title px-3 pb-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-base-content/70">Recent documents</span>
          </li>
          <li v-for="(item, key) of recent" :key="key">
            <NuxtLink class="rounded-btn px-3 py-1.5 text-sm text-base-content/70 hover:text-base-content" :to="item.to">
              <component :is="iconFor(item)" class="inline-block w-4 h-4 mr-2 flex-shrink-0 stroke-current opacity-70" />
              <span class="min-w-0">
                <span class="block truncate">{{ item.text }}</span>
                <!-- Several documents share a title (every module has a
                     "Deprecations" page), so the title alone is ambiguous. -->
                <span
                  v-if="contextFor(item.to)"
                  class="block text-[11px] text-base-content/70 truncate"
                >{{ contextFor(item.to) }}</span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div class="p-4 mt-2 border-t border-base-300 text-xs text-base-content/70 flex items-center justify-between">
        <span>DruxtJS docs</span>
        <a class="link link-hover" href="https://github.com/druxt/druxt.js" target="_blank" rel="noopener">GitHub</a>
      </div>
    </aside>
  </div>
</template>

<script>
import { documentContext } from '~/utils/content'
import { MAC_SHORTCUT, searchShortcut } from '~/utils/platform'

export default {
  props: {
    open: { type: Boolean, default: false },
    /** false on full-bleed pages: drawer only, never sticky beside content. */
    docs: { type: Boolean, default: true },
  },

  data: () => ({ shortcut: MAC_SHORTCUT }),

  mounted() {
    this.shortcut = searchShortcut()
  },

  computed: {
    // Excludes the page you are on: it was always the first entry, spending a
    // row of a five-row list on the one document you certainly don't need a
    // link to.
    recent: ({ $store, $route }) => $store.state.recent
      .filter((o) => o.to !== $route.path)
      .slice(0, 5),
  },

  methods: {
    /** Where a recent document sits, so same-titled pages are told apart. */
    contextFor(to) {
      return documentContext(to)
    },

    iconFor(item) {
      return 'app-icon-' + item.to.slice(1).split('/')[0]
    },
  },
}
</script>
