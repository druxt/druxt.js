// A decoupled-settings fetcher's part, at server start: the settings it read from Drupal, in two tiers.
export default defineNitroPlugin(async () => {
  await storeDrupalSettings('default', {
    // baseUrl and proxy are client options, which Drupal cannot set: the settings leave them out.
    public: { fromDrupal: 'public-from-drupal', siteUrl: 'https://site-url-from-drupal.test', baseUrl: 'https://injected.invalid' },
    server: { serverOnly: 'server-only-from-drupal', proxy: { api: true } },
  })
})
