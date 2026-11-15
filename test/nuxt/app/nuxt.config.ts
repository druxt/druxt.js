import { drupal, index } from '../../unit/fake-drupal'

// Core reads Drupal's languages when the app is built, before any test runs. Stubbed here so it finds an index with
// no language type and makes no request, and test/nuxt/setup.ts replaces the stub per test. Each package's port adds
// the fake Drupal routes its build reads.
// Deliberate, and kept for the whole build process: the languages template fetches at build time, before setup.ts can replace it.
globalThis.fetch = drupal({
  'GET /jsonapi': index('', []),
}).fetch

// The component tests' app: @druxt/core, against the fake Drupal in test/unit/fake-drupal.ts. Each package's port
// adds its module here.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // No app manifest: the test environment never builds one, so #app-manifest would point at a missing file in a fresh checkout.
  experimental: { appManifest: false },
  modules: ['@druxt/core'],
  druxt: {
    baseUrl: 'https://drupal.test',
  },
})
