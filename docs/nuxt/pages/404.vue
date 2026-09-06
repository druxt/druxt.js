<template>
  <AppErrorState :status-code="404" />
</template>

<script>
/**
 * The statically served 404.
 *
 * `nuxt generate` emits this page as 404/index.html, and the Lagoon nginx
 * config serves it with a real 404 status for unknown URLs instead of the
 * blanket 200 SPA fallback, which read as a soft 404 to every crawler and
 * hid broken links from monitoring. Visiting /404 directly returns 200,
 * which is what the noindex is for.
 */
export default {
  head() {
    return {
      title: 'Page not found',
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex, follow' },
      ],
    }
  },
}
</script>
