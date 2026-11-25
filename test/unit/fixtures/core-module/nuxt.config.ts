// @druxt/core alone, loaded by test/unit/core-module.test.ts with the auth options each test overrides.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: ['@druxt/core'],
  druxt: {
    baseUrl: 'https://drupal.test',
  },
})
