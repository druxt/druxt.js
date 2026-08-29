<template>
  <ul class="menu" :class="horizontal ? 'menu-horizontal flex-nowrap gap-1' : 'gap-0.5'">
    <slot name="title" />

    <li v-for="(item, key) of items" :key="key">
      <component
        :is="item.component"
        class="rounded-btn"
        :class="[
          horizontal ? 'px-3 py-2 text-sm font-medium whitespace-nowrap' : 'px-3 py-2',
          isActive(item) ? 'bg-base-200 text-primary-focus font-semibold' : 'text-base-content/80 hover:text-base-content',
        ]"
        :aria-current="isCurrent(item) ? 'page' : null"
        v-bind="item.props"
      >
        <component
          :is="iconComponent(item)"
          v-if="item.icon && icons"
          class="inline-block w-5 h-5 mr-2 stroke-current opacity-70"
        />
        {{ item.text }}
      </component>

      <!-- Children of the active section only; no v-show flash on first paint. -->
      <ul
        v-if="children && childrenOf(item).length && isActive(item)"
        class="menu gap-0.5 pl-3 ml-3 border-l border-base-300"
      >
        <li v-for="(child, childKey) of childrenOf(item)" :key="childKey">
          <component
            :is="child.component"
            class="rounded-btn px-3 py-1.5 text-sm"
            :class="isCurrent(child) ? 'bg-base-200 text-primary-focus font-semibold' : 'text-base-content/70 hover:text-base-content'"
            :aria-current="isCurrent(child) ? 'page' : null"
            v-bind="child.props"
            v-text="child.text"
          />
        </li>
      </ul>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    /** Render nested children for the active section. */
    children: { type: Boolean, default: false },
    /** Lay the menu out in a row (header). */
    horizontal: { type: Boolean, default: false },
    /** Include the Home item. */
    home: { type: Boolean, default: true },
    /** Include external links (GitHub, Discord). */
    external: { type: Boolean, default: true },
    /** Render item icons. */
    icons: { type: Boolean, default: true },
  },

  computed: {
    items: ({ $store, home, external }) => $store.state.menu
      .filter((o) => home || o.icon !== 'home')
      .filter((o) => external || o.component !== 'a'),
  },

  methods: {
    iconComponent(item) {
      return 'app-icon-' + item.icon
    },

    /**
     * A section's index document is discovered alongside its siblings, which
     * previously produced "Tutorials › Tutorials" in the trail. The parent
     * link already goes there, so drop any child pointing at the same route.
     */
    childrenOf(item) {
      const to = this.to(item)
      return (item.children || []).filter((child) => this.to(child) && this.to(child) !== to)
    },

    /**
     * The item's route, trailing slash removed, with the root kept as '/'.
     *
     * Trimming used to reduce Home's '/' to an empty string, which the
     * empty-value guards in isActive and isCurrent then read as "no route",
     * so Home could never be marked active or current, on the one page it
     * points at, and the `to === ''` branch below was unreachable.
     */
    to(item) {
      const to = (item.props || {}).to
      if (!to) return null
      return to.replace(/\/$/, '') || '/'
    },

    /** The current route, normalised the same way, for comparison. */
    currentPath() {
      return this.$route.path.replace(/\/$/, '') || '/'
    },

    isCurrent(item) {
      const to = this.to(item)
      return !!to && this.currentPath() === to
    },

    isActive(item) {
      const to = this.to(item)
      if (!to) return false
      const path = this.currentPath()
      // Home matches only itself; every other section also matches its
      // descendants. Compared segment-wise so /guide does not light up on
      // a sibling route that merely shares its prefix.
      if (to === '/') return path === '/'
      return path === to || path.startsWith(to + '/')
    },
  },
}
</script>
