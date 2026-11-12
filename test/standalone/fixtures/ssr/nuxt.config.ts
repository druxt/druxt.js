// @druxt/core with no fetch at all: proves a module's server render holds
// the resolved wrapper, not the "no payload yet" placeholder comment.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: ['@druxt/core'],
  druxt: {
    baseUrl: 'https://drupal.invalid',
  },
})
