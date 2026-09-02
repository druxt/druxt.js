<template>
  <div class="max-w-2xl mx-auto px-6 py-24 text-center">
    <p class="text-sm font-semibold uppercase tracking-wider text-base-content/70">
      {{ statusCode }}
    </p>
    <h1 class="mt-3 text-3xl font-bold tracking-tight" v-text="heading" />
    <p class="mt-4 text-base-content/70" v-text="message" />

    <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
      <button type="button" class="btn btn-primary" @click="searchOpen = true">Search the docs</button>
      <NuxtLink class="btn btn-ghost" to="/">Home</NuxtLink>
      <NuxtLink class="btn btn-ghost" to="/tutorials">Tutorials</NuxtLink>
      <NuxtLink class="btn btn-ghost" to="/how-to">How-to guides</NuxtLink>
      <NuxtLink class="btn btn-ghost" to="/modules">Modules</NuxtLink>
      <NuxtLink class="btn btn-ghost" to="/api">API reference</NuxtLink>
    </div>

    <!-- Own dialog, not the default layout's: layouts/error.vue renders
         instead of that layout, so in most contexts where this component
         shows there is no other dialog mounted to reach. -->
    <AppSearch :open="searchOpen" @close="searchOpen = false" />
  </div>
</template>

<script>
/**
 * The error body, shared by layouts/error.vue and pages/404.vue so the
 * client-side error page and the statically served 404 stay one design.
 */
import { notFoundEvent } from '~/lib/analytics'

export default {
  props: {
    /** HTTP status the page represents. */
    statusCode: { type: Number, default: 404 },
  },

  data: () => ({ searchOpen: false }),

  computed: {
    heading: ({ statusCode }) => (statusCode === 404 ? 'Page not found' : 'Something went wrong'),

    message: ({ statusCode }) => (statusCode === 404
      ? 'That page does not exist. It may have moved, or the link that brought you here may be out of date.'
      : 'An unexpected error occurred while loading this page.'),
  },

  /** @returns {void} */
  mounted() {
    if (this.statusCode !== 404) return
    // window.location, not $route: this component also renders from the
    // statically generated dist/404/index.html, and the path the reader
    // actually asked for is the one worth recording.
    //
    // The referrer is the half that makes this actionable. A 404 alone says a
    // URL is dead; the referrer says whether it is a broken internal link, a
    // stale external one, or a search engine holding an index entry that
    // should have been redirected — which is the failure mode a URL
    // restructure produces.
    this.$track(...notFoundEvent(window.location.pathname, document.referrer))
  },
}
</script>
