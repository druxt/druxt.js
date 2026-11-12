// @druxt/core and nothing else: it must bring what it needs itself.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: ['@druxt/core'],
  druxt: {
    baseUrl: process.env.DRUXT_BASE_URL || 'http://127.0.0.1:8888',
  },
})
