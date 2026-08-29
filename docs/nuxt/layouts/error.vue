<template>
  <div class="max-w-2xl mx-auto px-6 py-24 text-center">
    <p class="text-sm font-semibold uppercase tracking-wider text-base-content/70">
      {{ statusCode }}
    </p>
    <h1 class="mt-3 text-3xl font-bold tracking-tight" v-text="heading" />
    <p class="mt-4 text-base-content/70" v-text="message" />

    <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
      <NuxtLink class="btn btn-primary" to="/">Home</NuxtLink>
      <NuxtLink class="btn btn-ghost" to="/guide">Read the guide</NuxtLink>
      <NuxtLink class="btn btn-ghost" to="/modules">Browse modules</NuxtLink>
    </div>
  </div>
</template>

<script>
/**
 * Error page.
 *
 * Exists primarily for the `noindex` below. Nuxt's built-in error page carries
 * no robots directive, and `nuxt generate` writes a real HTML file for any
 * route it was asked to build that then failed to resolve. Measured on this
 * site: seven such files, all of them intermediate API directory paths that the
 * breadcrumbs on their own child pages link to, so a crawler reaches them by
 * following ordinary links and indexes a "Document not found" page as though it
 * were content.
 *
 * `noindex` treats the symptom. The cause is that those breadcrumb links point
 * at paths with no document behind them, which is tracked separately.
 */
export default {
  props: {
    error: { type: Object, default: () => ({}) },
  },

  head() {
    return {
      title: this.heading,
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex, follow' },
      ],
    }
  },

  computed: {
    statusCode: ({ error }) => error.statusCode || 404,

    heading: ({ statusCode }) => (statusCode === 404 ? 'Page not found' : 'Something went wrong'),

    message: ({ statusCode }) => (statusCode === 404
      ? 'That page does not exist. It may have moved, or the link that brought you here may be out of date.'
      : 'An unexpected error occurred while loading this page.'),
  },
}
</script>
