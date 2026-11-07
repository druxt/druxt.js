// The component tests' app, against the fake Drupal in test/unit/fake-drupal.ts. No Druxt module is ported yet: each
// package's port adds its module here, with the fake Drupal routes its build reads.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // No app manifest: the test environment never builds one, so #app-manifest would point at a missing file in a fresh checkout.
  experimental: { appManifest: false },
  modules: [],
})
