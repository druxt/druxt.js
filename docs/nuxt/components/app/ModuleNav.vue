<template>
  <nav v-if="tabs.length > 1" class="border-b border-base-300">
    <ul class="flex flex-wrap gap-1 -mb-px">
      <li v-for="tab of tabs" :key="tab.to">
        <NuxtLink
          :to="tab.to"
          class="inline-block px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
          :class="isActive(tab)
            ? 'border-primary text-primary-focus'
            : 'border-transparent text-base-content/70 hover:text-base-content'"
          :aria-current="isActive(tab) ? 'page' : null"
          v-text="tab.text"
        />
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  props: {
    /** Package name, e.g. 'entity'. */
    pkg: { type: String, required: true },
    /** Sibling documents from content/modules/<pkg>/. */
    pages: { type: Array, default: () => [] },
  },

  computed: {
    /**
     * The module README becomes "Overview"; every other document in the
     * module's content directory becomes a tab beside it.
     */
    tabs() {
      const base = '/modules/' + this.pkg
      const rest = this.pages
        .filter((o) => o.slug !== 'README')
        .map((o) => ({ text: o.title, to: o.path.replace('/content', '') }))

      return [{ text: 'Overview', to: base }].concat(rest)
    },
  },

  methods: {
    isActive(tab) {
      return this.$route.path.replace(/\/$/, '') === tab.to.replace(/\/$/, '')
    },
  },
}
</script>
