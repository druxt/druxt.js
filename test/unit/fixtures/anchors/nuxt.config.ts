// No modules of its own: test/unit/anchors-build.test.ts lists @druxt/core and the modules that require anchors, in
// the order each test needs.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  druxt: {
    baseUrl: 'https://drupal.test',
  },
})
