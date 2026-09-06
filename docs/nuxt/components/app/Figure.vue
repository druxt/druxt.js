<template>
  <figure class="docs-figure my-0">
    <button
      type="button"
      class="docs-figure-frame cursor-[zoom-in]"
      :aria-label="'Enlarge: ' + alt"
      @click="zoom = true"
    >
      <img :src="src" :alt="alt" class="block w-full" loading="lazy">
    </button>

    <figcaption v-if="caption && alt" v-text="alt" />

    <!--
      Screenshots of rendered Drupal data are dense; full-size viewing
      matters. A real dialog: focus moves to the close button on open, Tab
      cycles within it, Escape and the backdrop both dismiss, and focus
      returns to the thumbnail that opened it.
    -->
    <div
      v-if="zoom"
      ref="dialog"
      class="fixed inset-0 z-[80] bg-neutral/80 p-6 flex items-center justify-center cursor-[zoom-out]"
      role="dialog"
      aria-modal="true"
      :aria-label="alt ? 'Enlarged: ' + alt : 'Enlarged image'"
      @click.self="zoom = false"
      @keydown.tab="onTab"
    >
      <button
        type="button"
        class="absolute top-4 right-4 btn btn-sm btn-circle"
        aria-label="Close image"
        @click="zoom = false"
      >
        <span aria-hidden="true">&times;</span>
      </button>
      <img :src="src" :alt="alt" class="max-h-full max-w-full rounded-box shadow-2xl">
    </div>
  </figure>
</template>

<script>
import { trapTab } from '~/utils/focus'

export default {
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    /** Render the alt text as a visible caption. */
    caption: { type: Boolean, default: true },
  },

  data: () => ({ zoom: false, restoreFocusTo: null }),

  watch: {
    zoom(open) {
      if (!process.client) return
      document.documentElement.style.overflow = open ? 'hidden' : ''

      if (open) {
        this.restoreFocusTo = document.activeElement
        this.$nextTick(() => {
          const close = this.$refs.dialog && this.$refs.dialog.querySelector('[aria-label="Close image"]')
          if (close) close.focus()
        })
        return
      }
      const target = this.restoreFocusTo
      this.restoreFocusTo = null
      if (target && document.contains(target)) this.$nextTick(() => target.focus())
    },

    $route() {
      this.zoom = false
    },
  },

  mounted() {
    this.onKey = (e) => { if (e.key === 'Escape') this.zoom = false }
    window.addEventListener('keydown', this.onKey)
  },

  methods: {
    onTab(e) {
      trapTab(this.$refs.dialog, e)
    },
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKey)
    document.documentElement.style.overflow = ''
  },
}
</script>
