<template>
  <!--
    The one jump-menu implementation: the Subheader, the module header and
    the breadcrumbs all render their sibling/heading menus through this, so
    trigger affordance, panel styling and dismissal behave identically
    everywhere. Dismissed on outside click, Escape, route change and page
    scroll - the panel is absolutely positioned, so a scrolled page would
    otherwise carry an open panel off screen.
  -->
  <div class="relative inline-flex">
    <button
      type="button"
      class="inline-flex items-center gap-1 rounded-btn"
      :class="buttonClass"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="true"
      @click="open = !open"
    >
      <slot />
      <span aria-hidden="true" class="text-base-content/70 text-[0.8em]">▾</span>
    </button>

    <ul
      v-if="open"
      class="absolute top-full mt-1 w-72 max-h-[60vh] overflow-y-auto z-50 p-1
             rounded-box border border-base-300 bg-base-100 shadow-xl"
      :class="align === 'right' ? 'right-0' : 'left-0'"
    >
      <li v-for="item of items" :key="item.href || item.to">
        <a
          v-if="item.href"
          class="block px-3 py-1.5 rounded-btn text-sm text-base-content/80 hover:bg-base-200 hover:text-base-content"
          :class="item.indent ? 'pl-6' : ''"
          :href="item.href"
          @click="open = false"
        >{{ item.text }}</a>
        <NuxtLink
          v-else
          class="block px-3 py-1.5 rounded-btn text-sm"
          :class="isCurrent(item.to) ? 'bg-base-200 text-primary-focus font-semibold' : 'text-base-content/80 hover:bg-base-200 hover:text-base-content'"
          :to="item.to"
          @click.native="open = false"
          v-text="item.text"
        />
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'AppDropdown',

  props: {
    /** Menu entries: { text, to } links, or { text, href, indent } anchors. */
    items: { type: Array, required: true },
    /** Which edge of the trigger the panel hangs from. */
    align: { type: String, default: 'left' },
    /** Extra classes for the trigger button. */
    buttonClass: { type: [String, Array, Object], default: '' },
  },

  data: () => ({ open: false }),

  watch: {
    $route() {
      this.open = false
    },
  },

  mounted() {
    this.onDocument = (e) => {
      if (!this.$el.contains(e.target)) this.open = false
    }
    this.onKey = (e) => {
      if (e.key === 'Escape') this.open = false
    }
    // Panel-internal scrolling is a separate event target and never
    // reaches the window, so this only fires for real page scrolls.
    this.onScroll = () => {
      this.open = false
    }
    document.addEventListener('click', this.onDocument)
    document.addEventListener('keydown', this.onKey)
    window.addEventListener('scroll', this.onScroll, { passive: true })
  },

  beforeDestroy() {
    document.removeEventListener('click', this.onDocument)
    document.removeEventListener('keydown', this.onKey)
    window.removeEventListener('scroll', this.onScroll)
  },

  methods: {
    /**
     * Whether a menu entry is the page being viewed.
     *
     * @param {string} to - The entry's route path.
     * @returns {boolean} True when it matches the current route.
     */
    isCurrent(to) {
      const trim = (s) => (s || '').replace(/\/+$/, '')
      return trim(to) === trim(this.$route.path)
    },
  },
}
</script>
