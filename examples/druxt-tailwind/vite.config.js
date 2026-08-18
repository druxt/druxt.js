import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8888'

// Same proxy rationale as the other examples: JSON:API/router/file requests
// must go through this app's own origin, not an absolute backend URL, or
// they break for anyone viewing this app through a different origin than
// the backend (e.g. a tunnel). Nuxt's druxt-router/druxt modules set this
// up automatically via @nuxtjs/proxy; without Nuxt, it's Vite's own
// server.proxy option, configured by hand.
const proxy = {
  '/jsonapi': baseUrl,
  '/en/jsonapi': baseUrl,
  '/es/jsonapi': baseUrl,
  '/router/translate-path': baseUrl,
  '/sites/default/files': baseUrl,
  '/core/profiles/demo_umami/themes/umami/logo.svg': baseUrl,
}

export default defineConfig({
  plugins: [vue2()],
  resolve: {
    alias: {
      // `druxt`'s package entry exports both browser-safe code (DruxtClient,
      // DruxtStore) and its Nuxt-module code (DruxtNuxtModule) from the same
      // bundled file, and the Nuxt-module half imports Node's `path` module
      // at the top level - so importing anything from `druxt` pulls in that
      // import too, even though DruxtClient/DruxtStore themselves never use
      // it. Vite has no Node `path` built into the browser and throws on
      // first access; path-browserify is a drop-in polyfill that satisfies
      // the import without needing druxt.js's package structure to change.
      path: 'path-browserify',
    },
  },
  server: {
    host: true,
    // Match the port the Nuxt examples serve on, so the root
    // `example:druxt-tailwind:test` script (start-server-and-test waiting on
    // localhost:3000) and the Cypress baseUrl work unchanged.
    port: 3000,
    strictPort: true,
    proxy,
    // Vite rejects requests whose Host header isn't localhost/an IP by
    // default - blocks the CI preview job's Cloudflare tunnel, whose
    // hostname is random per run.
    allowedHosts: true,
  },
  preview: {
    host: true,
    proxy,
    allowedHosts: true,
  },
  define: {
    __BASE_URL__: JSON.stringify(baseUrl),
    // Same root cause as the `path` alias above, different symptom: every
    // package's Nuxt-module file does `XNuxtModule.meta = require('../package.json')`
    // at the top level (unconditionally, whether or not the Nuxt module is
    // ever used) - bundled into the same file as the framework-agnostic
    // exports, this means a bare CommonJS `require()` call ships to the
    // browser, where it doesn't exist at all. Stubbing it to a no-op that
    // returns an empty object is safe here specifically because
    // `DruxtNuxtModule` itself is dead code in this app (never called) -
    // only the top-level `.meta = require(...)` assignment needs to not
    // crash, not actually resolve real package.json data.
    require: '(() => ({}))',
  },
})
