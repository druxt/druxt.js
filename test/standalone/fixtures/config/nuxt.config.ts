// @druxt/core with every secret set in the config, and the environment
// overriding each at runtime: test/standalone/config.test.ts proves where
// each lands, and that none reaches the page. Nothing is fetched from Drupal.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: ['@druxt/core'],
  druxt: {
    baseUrl: 'https://drupal.invalid',
    auth: { clientId: 'druxt-config', clientSecret: 'auth-secret-from-config' },
    cache: { secret: 'cache-secret-from-config' },
    build: { auth: { clientId: 'build-from-config', clientSecret: 'build-secret-from-config', scope: 'druxt_build' } },
  },
})
