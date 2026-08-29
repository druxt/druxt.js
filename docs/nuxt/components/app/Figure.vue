<template>
  <figure class="my-0">
    <button
      type="button"
      class="block w-full rounded-box overflow-hidden border border-base-300 bg-base-200 cursor-[zoom-in]"
      :aria-label="'Enlarge: ' + alt"
      @click="zoom = true"
    >
      <img :src="src" :alt="alt" class="block w-full" loading="lazy">
    </button>

    <figcaption v-if="caption && alt" class="mt-2 text-sm text-base-content/55" v-text="alt" />

    <!-- Screenshots of rendered Drupal data are dense; full-size viewing matters. -->
    <div
      v-if="zoom"
      class="fixed inset-0 z-[80] bg-neutral/80 p-6 flex items-center justify-center cursor-[zoom-out]"
      @click="zoom = false"
    >
      <img :src="src" :alt="alt" class="max-h-full max-w-full rounded-box shadow-2xl">
    </div>
  </figure>
</template>

<script>
export default {
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    /** Render the alt text as a visible caption. */
    caption: { type: Boolean, default: true },
  },

  data: () => ({ zoom: false }),

  watch: {
    zoom(open) {
      if (!process.client) return
      document.documentElement.style.overflow = open ? 'hidden' : ''
    },

    $route() {
      this.zoom = false
    },
  },

  mounted() {
    this.onKey = (e) => { if (e.key === 'Escape') this.zoom = false }
    window.addEventListener('keydown', this.onKey)
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKey)
    document.documentElement.style.overflow = ''
  },
}
</script>
