<template>
  <footer class="mt-12 pt-6 border-t border-base-300">
    <a
      v-if="editPath"
      class="inline-flex items-center gap-2 text-sm text-base-content/70 hover:text-primary-focus"
      :href="editUrl"
      target="_blank"
      rel="noopener"
    >
      <AppIconExternal class="w-4 h-4" /> Edit this page on GitHub
    </a>

    <div v-if="prev || next" class="mt-6 grid gap-3 sm:grid-cols-2">
      <NuxtLink
        v-if="prev"
        :to="prev.to"
        class="group rounded-box border border-base-300 p-4 hover:border-primary transition-colors"
      >
        <span class="block text-xs uppercase tracking-wider text-base-content/70">Previous</span>
        <span class="block mt-1 font-medium group-hover:text-primary-focus" v-text="prev.text" />
      </NuxtLink>
      <span v-else />

      <NuxtLink
        v-if="next"
        :to="next.to"
        class="group rounded-box border border-base-300 p-4 text-right hover:border-primary transition-colors sm:col-start-2"
      >
        <span class="block text-xs uppercase tracking-wider text-base-content/70">Next</span>
        <span class="block mt-1 font-medium group-hover:text-primary-focus" v-text="next.text" />
      </NuxtLink>
    </div>
  </footer>
</template>

<script>
const EDIT_BASE = 'https://github.com/druxt/druxt.js/edit/develop/docs/nuxt/content'

export default {
  props: {
    /** Content-relative path, e.g. 'guide/getting-started.md'. */
    editPath: { type: String, default: null },
    prev: { type: Object, default: null },
    next: { type: Object, default: null },
  },

  computed: {
    editUrl: ({ editPath }) => EDIT_BASE + '/' + editPath,
  },
}
</script>
