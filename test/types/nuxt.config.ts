// The app the typecheck runs in: every ported module, so the runtime code is
// checked with Nuxt's aliases, auto-imports and global component types.
// Each package's port adds its own.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: ['@druxt/core'],
  druxt: {
    baseUrl: 'http://127.0.0.1:8888',
  },
})
