// The app the typecheck runs in: every ported module, so the runtime code is
// checked with Nuxt's aliases, auto-imports and global component types.
// No module is ported yet; each package's port adds its own.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: [],
})
