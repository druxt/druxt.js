// Examples, routes and budgets for the performance audit. Data only.
import { resolve } from 'node:path'

// Lighthouse scores depend on the machine, so each environment keeps its own baseline.
export function environment(env = process.env) {
  const name = env.PERF_AUDIT_ENV || (env.GITHUB_ACTIONS ? 'github' : env.GITLAB_CI ? 'gitlab' : 'local')
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Invalid PERF_AUDIT_ENV: ${name}`)
  return name
}

export const baselinePath = (name) => `perf/baseline.${name}.json`

export const config = {
  // See backend-proxy.mjs for why the audit runs its own proxy.
  backendLog: process.env.PERF_AUDIT_BACKEND_LOG || resolve('.perf/backend-requests.log'),
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
    // API calls the browser makes after DOMContentLoaded may not rise: each one is a refetch of rendered data.
    postLoadApiCalls: 'no-increase',
    // Server-rendered Druxt nodes the browser throws away after hydration may not rise.
    discardedNodes: 'no-increase',
    // Lighthouse performance may drop at most this many points (0 to 100).
    performanceDrop: 10,
    // The inline __NUXT__ payload may grow at most this much.
    payloadGrowthPercent: 10,
  },
  hydration: { loads: 3 },
  unlighthouse: { version: '0.18.0', playwright: '1.62.1' },
}
