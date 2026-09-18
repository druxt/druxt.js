// Examples, routes and budgets for the performance audit. Data only.
import { resolve } from 'node:path'

export const config = {
  // The audit's own proxy log (backend-proxy.mjs), not the backend's own log:
  // some backends never write a per-request completion line.
  backendLog: process.env.PERF_AUDIT_BACKEND_LOG || resolve('.perf/backend-requests.log'),
  backendUrl: process.env.BASE_URL || 'http://127.0.0.1:8888',
  proxyPort: Number(process.env.PERF_AUDIT_PROXY_PORT || 8890),
  examples: [
    // Every non-root route on druxt-site answers under the /en/ prefix; the
    // unprefixed path 302s there instead of rendering.
    { name: 'druxt-site', port: 3200, routes: ['/', '/en/recipes', '/en/recipes/deep-mediterranean-quiche', '/en/articles/give-it-a-go-and-grow-your-own-herbs', '/en/recipe-category/main-courses'] },
    // druxt-daisyui and druxt-bootstrapvue only have pages/index.vue, no
    // wildcard router: nothing but the front page exists to audit.
    { name: 'druxt-daisyui', port: 3201, routes: ['/'] },
    { name: 'druxt-bootstrapvue', port: 3204, routes: ['/'] },
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
