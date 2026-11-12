// @druxt/core with browser sign-in behind the proxy, the session in httpOnly cookies on the site, and the sign-in form
// on its front page. Its Drupal is the test's stand-in, which answers the token and userinfo requests itself.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: ['@druxt/core'],
  druxt: {
    baseUrl: process.env.DRUXT_AUTH_BROWSER_BACKEND || 'http://127.0.0.1:9',
    proxy: { api: true },
    auth: { clientId: 'druxt-auth-browser-test', password: true, scope: 'editor' },
  },
})
