// Examples, routes and budgets for the performance audit. Data only.
export const config = {
  // Where examples/drupal/.devtools/start writes the php -S request log.
  backendLog: '/tmp/druxtjs-drupal-php-server.log',
  backendUrl: 'http://127.0.0.1:8888',
  examples: [
    { name: 'druxt-site', port: 3200, routes: ['/', '/recipes', '/recipes/deep-mediterranean-quiche', '/articles/give-it-a-go-and-grow-your-own-herbs', '/en/recipe-category/main-courses'] },
    { name: 'druxt-daisyui', port: 3201, routes: ['/', '/recipes', '/recipes/deep-mediterranean-quiche', '/articles/give-it-a-go-and-grow-your-own-herbs'] },
    { name: 'druxt-bootstrapvue', port: 3204, routes: ['/', '/recipes', '/recipes/deep-mediterranean-quiche'] },
  ],
  budgets: {
    // Backend requests per server render may not rise against the baseline.
    backendRequests: 'no-increase',
    // Lighthouse performance may drop at most this many points (0 to 100).
    performanceDrop: 5,
    // The inline __NUXT__ payload may grow at most this much.
    payloadGrowthPercent: 10,
  },
  unlighthouse: { version: '0.18.0', playwright: '1.62.1' },
}
