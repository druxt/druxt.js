// @druxt/core with browser sign-in behind the proxy: the site's server holds the session in httpOnly cookies. Its
// Drupal is the test's front to the example backend, which answers the password grant with the test editor's token.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: ['@druxt/core'],
  druxt: {
    baseUrl: process.env.DRUXT_SESSION_BACKEND || 'http://127.0.0.1:9',
    proxy: { api: true },
    auth: { clientId: 'druxt-session-test', password: true },
  },
})
