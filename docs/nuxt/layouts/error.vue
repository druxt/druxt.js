<template>
  <AppErrorState :status-code="statusCode" />
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
 *
 * The body lives in components/app/ErrorState.vue, shared with pages/404.vue,
 * the statically served counterpart.
 */
export default {
  props: {
    error: { type: Object, default: () => ({}) },
  },

  head() {
    return {
      title: this.statusCode === 404 ? 'Page not found' : 'Something went wrong',
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex, follow' },
      ],
    }
  },

  computed: {
    statusCode: ({ error }) => error.statusCode || 404,
  },
}
</script>
