<template>
  <nav v-if="crumbs.length" aria-label="Breadcrumb" class="mb-4">
    <ol class="flex flex-wrap items-center gap-1.5 text-sm text-base-content/70">
      <li v-for="(item, index) of crumbs" :key="index" class="flex items-center gap-1.5">
        <NuxtLink
          v-if="item.to && index < crumbs.length - 1"
          :to="item.to"
          class="hover:text-primary-focus"
          v-text="item.text"
        />
        <span v-else class="text-base-content font-medium" aria-current="page" v-text="item.text" />
        <span v-if="index < crumbs.length - 1" aria-hidden="true" class="opacity-60">/</span>
      </li>
    </ol>
  </nav>
</template>

<script>
export default {
  props: {
    /** [{ text, to }] — the last entry renders as the current page. */
    items: { type: Array, default: () => [] },
  },

  computed: {
    /**
     * A section index document has the same title and route as its section, so
     * callers can legitimately produce "Tutorials / Tutorials". Collapse any
     * neighbour that repeats the previous route or label.
     */
    crumbs: ({ items }) => items.filter((item, i) => {
      const prev = items[i - 1]
      if (!prev) return true
      const same = (a, b) => (a || '').replace(/\/$/, '') === (b || '').replace(/\/$/, '')
      return !(same(prev.to, item.to) || prev.text === item.text)
    }),
  },
}
</script>
