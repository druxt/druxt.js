// @druxt/core with the session its server holds, beside nuxt-auth-utils, for a Drupal that serves JSON:API at /api.
// Its Drupal is the test's stand-in backend, which records what reaches it.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: ['@druxt/core', 'nuxt-auth-utils'],
  druxt: {
    baseUrl: process.env.DRUXT_AUTH_UTILS_BACKEND || 'http://127.0.0.1:9',
    endpoint: '/api',
    proxy: { api: true, files: true },
    auth: { clientId: 'druxt-auth-utils-test', password: true, scope: 'editor' },
    cache: { secret: 'auth-utils-secret' },
  },
  // Lines the test finds in the build's output, which show its capture spans the whole build.
  hooks: {
    'build:before': () => console.warn('[auth-utils fixture] build starts'),
  },
  nitro: {
    hooks: {
      compiled: () => console.warn('[auth-utils fixture] server compiled'),
    },
  },
})
