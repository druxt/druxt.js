<template>
  <header class="mb-8 pb-6 border-b border-base-300">
    <div v-if="badges.length" class="flex flex-wrap gap-2 mb-3">
      <span
        v-for="badge of badges"
        :key="badge.text"
        class="badge badge-sm"
        :class="badge.class || 'badge-primary badge-outline'"
        v-text="badge.text"
      />
    </div>

    <div class="flex items-center gap-4">
      <span
        v-if="icon"
        class="w-12 h-12 rounded-btn bg-base-200 text-primary-focus grid place-items-center flex-shrink-0"
      >
        <component :is="icon" class="w-7 h-7" />
      </span>
      <div class="min-w-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight" v-text="title" />
        <p v-if="mono" class="mt-1 font-mono text-sm text-base-content/70" v-text="mono" />
      </div>
    </div>

    <p v-if="description" class="mt-3 text-lg text-base-content/70" v-text="description" />

    <slot />
  </header>
</template>

<script>
export default {
  props: {
    title: { type: String, required: true },
    description: { type: String, default: null },
    /** [{ text, class }] */
    badges: { type: Array, default: () => [] },
    /** Icon component rendered in a tile beside the title. */
    icon: { type: Object, default: null },
    /** Monospace identity line under the title, e.g. the npm package name. */
    mono: { type: String, default: null },
  },
}
</script>
